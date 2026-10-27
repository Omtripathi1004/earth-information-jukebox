import io
import unittest
import wave
from unittest.mock import patch

import numpy as np
from PIL import Image

from backend.app import nasa, sonify
from backend.app.main import app


def tile_bytes():
    """A 256x256 fake tile: water | forest | cloud."""
    a = np.zeros((256, 256, 3), np.uint8)
    a[:, :85], a[:, 85:170], a[:, 170:] = (20, 50, 110), (40, 90, 40), (235, 235, 240)
    buf = io.BytesIO()
    Image.fromarray(a).save(buf, "PNG")
    return buf.getvalue()


def power_payload(slope=0.03):
    t, r = {}, {}
    for y in range(1985, 2026):
        for m in range(1, 13):
            t[f"{y}{m:02d}"] = 20 + slope * (y - 1985)
            r[f"{y}{m:02d}"] = 3.0
    return {"properties": {"parameter": {"T2M": t, "PRECTOTCORR": r}}}


class SonifyTests(unittest.TestCase):
    def test_scale(self):
        self.assertAlmostEqual(sonify.scale_freq(0), 130.81)
        self.assertAlmostEqual(sonify.scale_freq(5), 261.62, places=2)     # one octave up
        self.assertGreater(sonify.scale_freq(9), sonify.scale_freq(8))

    def test_classify(self):
        self.assertEqual(sonify.classify(20, 50, 110), "water")
        self.assertEqual(sonify.classify(40, 90, 40), "forest")
        self.assertEqual(sonify.classify(235, 235, 240), "ice")
        self.assertEqual(sonify.classify(190, 160, 120), "desert")

    def test_data_note_ignores_grey_and_orders_hue(self):
        grey = np.tile(np.array([[128, 128, 128, 255]], np.uint8), (27, 1))
        self.assertIsNone(sonify.data_note(grey, 0, 48, 0.16))
        blue = np.tile(np.array([[30, 60, 220, 255]], np.uint8), (27, 1))
        red = np.tile(np.array([[220, 40, 30, 255]], np.uint8), (27, 1))
        self.assertLess(sonify.data_note(blue, 0, 48, 0.16).freq, sonify.data_note(red, 0, 48, 0.16).freq)

    def test_render_is_a_valid_stereo_wav(self):
        notes = sonify.climate_notes([10 + 0.05 * i for i in range(10)])
        data = sonify.to_wav_bytes(sonify.render(notes))
        with wave.open(io.BytesIO(data)) as w:
            self.assertEqual((w.getnchannels(), w.getframerate(), w.getsampwidth()), (2, sonify.SR, 2))
            self.assertGreater(w.getnframes(), sonify.SR * 2)
        pcm = sonify.render(notes)
        self.assertLessEqual(int(np.abs(pcm).max()), 32767)

    def test_warmer_years_are_higher(self):
        notes = sonify.climate_notes([10, 10.5, 11, 11.5, 12])
        self.assertEqual([n.freq for n in notes], sorted(n.freq for n in notes))


class ApiTests(unittest.TestCase):
    def setUp(self):
        nasa.clear_caches()
        self.c = app.test_client()

    def test_eic_endpoints(self):
        r = self.c.get("/api/eic/datasets")
        self.assertEqual(r.status_code, 200)
        datasets = r.get_json()["datasets"]
        self.assertGreaterEqual(len(datasets), 4)
        ids = [d["id"] for d in datasets]
        self.assertIn("co2", ids)
        self.assertIn("sea_level", ids)
        self.assertIn("geos_fp_temp", ids)
        self.assertIn("ecco2_ocean_currents", ids)

        r_detail = self.c.get("/api/eic/dataset/co2")
        self.assertEqual(r_detail.status_code, 200)
        co2 = r_detail.get_json()
        self.assertEqual(co2["units"], "ppm")
        self.assertIn("years", co2)
        self.assertIn("values", co2)
        self.assertEqual(len(co2["years"]), len(co2["values"]))

        # 404 for nonexistent dataset
        self.assertEqual(self.c.get("/api/eic/dataset/nonexistent").status_code, 404)

        # Mappings catalogue and detail
        r_maps = self.c.get("/api/eic/mappings")
        self.assertEqual(r_maps.status_code, 200)
        self.assertIn("geos_fp_temp", r_maps.get_json()["mappings"])

        r_map_detail = self.c.get("/api/eic/mapping/geos_fp_temp")
        self.assertEqual(r_map_detail.status_code, 200)
        self.assertEqual(r_map_detail.get_json()["physical_units"], "°C")

    def test_eic_sonification_calculations(self):
        from backend.app import eic_data
        for ds_id, spec in eic_data.MAPPINGS_SPEC.items():
            for tc in spec["test_cases"]:
                inp = tc["input_val"]
                expected = tc["expected_freq_hz"]
                actual = eic_data.calculate_pitch(ds_id, inp)
                self.assertAlmostEqual(actual, expected, delta=0.1)

            # Edge cases
            valid_none, _ = eic_data.validate_measurement(ds_id, None)
            self.assertFalse(valid_none)
            valid_nan, _ = eic_data.validate_measurement(ds_id, float("nan"))
            self.assertFalse(valid_nan)
            valid_inf, _ = eic_data.validate_measurement(ds_id, float("inf"))
            self.assertFalse(valid_inf)
            with self.assertRaises(ValueError):
                eic_data.calculate_pitch(ds_id, float("nan"))

    def test_health_and_static(self):
        j = self.c.get("/api/health").get_json()
        self.assertTrue(j["ok"])
        self.assertIn("MODIS_Terra_Aerosol", j["layers"])
        r = self.c.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"Earth Information Jukebox", r.data)
        js = self.c.get("/assets/js/app.js")
        self.assertEqual(js.status_code, 200)
        js.close()
        self.assertEqual(self.c.get("/backend/app/main.py").status_code, 404)    # source is not served

    def test_climate_trend(self):
        with patch.object(nasa, "get_json", return_value=power_payload(0.03)):
            j = self.c.get("/api/climate?lat=26.8&lon=80.9").get_json()
        self.assertEqual(len(j["years"]), 41)
        self.assertAlmostEqual(j["trend_c_per_year"], 0.03, places=4)
        self.assertAlmostEqual(j["trend_c_per_decade"], 0.3, places=2)

    def test_config_reads_environment(self):
        import os
        with patch.dict(os.environ, {"MAPILLARY_TOKEN": "MLY|abc", "CESIUM_ION_TOKEN": ""}):
            j = self.c.get("/api/config").get_json()
        self.assertEqual(j["mapillary_token"], "MLY|abc")
        self.assertIsNone(j["cesium_ion_token"])

    def test_validation(self):
        self.assertEqual(self.c.get("/api/climate?lat=999&lon=0").status_code, 400)
        self.assertEqual(self.c.get("/api/climate?lat=abc&lon=0").status_code, 400)
        self.assertEqual(self.c.get("/api/climate?lon=0").status_code, 400)
        self.assertEqual(self.c.get("/api/sonify/frame.wav?lat=0&lon=0&layer=nope").status_code, 400)
        self.assertEqual(self.c.get("/api/sonify/frame.wav?lat=0&lon=0&date=2999-01-01").status_code, 400)
        self.assertEqual(self.c.get("/api/geocode?q=").status_code, 400)

    def test_upstream_failure_is_a_502(self):
        with patch.object(nasa, "get_json", side_effect=nasa.UpstreamError("down")):
            r = self.c.get("/api/climate?lat=1&lon=1")
        self.assertEqual(r.status_code, 502)
        self.assertIn("down", r.get_json()["error"])

    def test_frame_json_and_wav(self):
        with patch.object(nasa, "get_bytes", return_value=tile_bytes()):
            j = self.c.get("/api/sonify/frame.json?lat=10&lon=10&zoom=4&date=2024-06-01").get_json()
            kinds = {n["label"] for n in j["notes"]}
            self.assertTrue({"water", "forest", "ice"} <= kinds)
            pans = [n["pan"] for n in j["notes"]]
            self.assertLess(min(pans), -0.7)
            self.assertGreater(max(pans), 0.7)
            r = self.c.get("/api/sonify/frame.wav?lat=10&lon=10&zoom=4&date=2024-06-01")
        self.assertEqual(r.mimetype, "audio/wav")
        self.assertIn("attachment", r.headers["Content-Disposition"])
        with wave.open(io.BytesIO(r.data)) as w:
            self.assertEqual(w.getnchannels(), 2)

    def test_climate_wav_and_reverse(self):
        with patch.object(nasa, "get_json", return_value=power_payload()):
            r = self.c.get("/api/sonify/climate.wav?lat=0&lon=0")
        self.assertEqual(r.mimetype, "audio/wav")
        with patch.object(nasa, "get_json", return_value={"display_name": "A, B, C"}):
            self.assertEqual(self.c.get("/api/reverse?lat=1&lon=2&zoom=10").get_json()["display_name"], "A, B, C")


if __name__ == "__main__":
    unittest.main()
