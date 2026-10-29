import io
import unittest
import wave
from unittest.mock import patch

import numpy as np
from PIL import Image

from backend.app import nasa, sonify, eic_data
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

    def test_eic_metadata_provenance_and_layers(self):
        from backend.app import eic_data
        for ds_id, ds in eic_data.DATASETS.items():
            # Provenance fields verification
            self.assertTrue(ds.get("data_identifier"), f"Missing data_identifier in {ds_id}")
            self.assertTrue(ds.get("authoritative_url"), f"Missing authoritative_url in {ds_id}")
            self.assertTrue(ds.get("retrieval_date"), f"Missing retrieval_date in {ds_id}")
            self.assertTrue(ds.get("variable_name"), f"Missing variable_name in {ds_id}")
            self.assertTrue(ds.get("transformation_notes"), f"Missing transformation_notes in {ds_id}")
            self.assertTrue(ds.get("historical_period"), f"Missing historical_period in {ds_id}")

            # Contextual globe layer check
            ctx_layer = ds.get("contextual_globe_layer")
            self.assertIn(ctx_layer, nasa.LAYERS, f"Contextual layer {ctx_layer} not in nasa.LAYERS")
            self.assertIn("contextual", ds.get("contextual_layer_note", "").lower())

            # Data arrays length
            self.assertEqual(len(ds["years"]), len(ds["values"]))
            self.assertGreater(len(ds["values"]), 0)

            # Reconciled sonification metadata
            son = ds["sonification"]
            self.assertIn("voiceDesc", son)
            self.assertIn("voice_desc", son)
            self.assertIn("formula", son)
            self.assertIn("frequency_formula", son)
            self.assertIn("pitchRange", son)
            self.assertIn("full_calibration_range_hz", son)
            self.assertIn("observed_historical_range_hz", son)

    def test_eic_timeline_synchronization(self):
        from backend.app import eic_data
        for ds_id, ds in eic_data.DATASETS.items():
            vals = ds["values"]
            for i, val in enumerate(vals):
                pitch = eic_data.calculate_pitch(ds_id, val)
                self.assertTrue(100.0 <= pitch <= 850.0, f"Pitch {pitch} out of audible limits for {ds_id}")

            # Verify monotonic directional response
            if ds_id == "geos_fp_temp":
                p_cold = eic_data.calculate_pitch(ds_id, 12.4)
                p_warm = eic_data.calculate_pitch(ds_id, 17.1)
                self.assertLess(p_cold, p_warm)
            elif ds_id == "co2":
                p_1980 = eic_data.calculate_pitch(ds_id, ds["values"][0])
                p_2024 = eic_data.calculate_pitch(ds_id, ds["values"][-1])
                self.assertLess(p_1980, p_2024)
            elif ds_id == "arctic_sea_ice":
                # Inverted: less ice = higher pitch
                p_high_ice = eic_data.calculate_pitch(ds_id, 7.67)
                p_low_ice = eic_data.calculate_pitch(ds_id, 3.39)
                self.assertLess(p_high_ice, p_low_ice)

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
            self.assertEqual(w.getframerate(), 22050)
            self.assertGreater(w.getnframes(), 0)

    def test_climate_wav_and_reverse(self):
        with patch.object(nasa, "get_json", return_value=power_payload()):
            r = self.c.get("/api/sonify/climate.wav?lat=0&lon=0")
        self.assertEqual(r.mimetype, "audio/wav")
        with wave.open(io.BytesIO(r.data)) as w:
            self.assertEqual(w.getnchannels(), 2)
            self.assertEqual(w.getframerate(), 22050)
            self.assertGreater(w.getnframes(), 0)
        with patch.object(nasa, "get_json", return_value={"display_name": "A, B, C"}):
            self.assertEqual(self.c.get("/api/reverse?lat=1&lon=2&zoom=10").get_json()["display_name"], "A, B, C")

    def test_synthetic_trends(self):
        from backend.app import eic_data
        # 1. Strictly increasing
        res_inc = eic_data.compute_trend([2000, 2001, 2002, 2003], [10.0, 12.0, 14.0, 16.0])
        self.assertEqual(res_inc["status"], "valid")
        self.assertEqual(res_inc["ols_slope"], 2.0)
        self.assertEqual(res_inc["step_unit"], "yr")

        # 2. Strictly decreasing
        res_dec = eic_data.compute_trend([2000, 2001, 2002], [5.0, 4.0, 3.0])
        self.assertEqual(res_dec["status"], "valid")
        self.assertEqual(res_dec["ols_slope"], -1.0)

        # 3. Constant values
        res_const = eic_data.compute_trend([2000, 2001, 2002], [7.0, 7.0, 7.0])
        self.assertEqual(res_const["status"], "valid")
        self.assertEqual(res_const["ols_slope"], 0.0)

        # 4. Insufficient points
        res_few = eic_data.compute_trend([2000], [5.0])
        self.assertEqual(res_few["status"], "insufficient_points")

        # 5. Invalid/missing/NaN measurements
        res_nan = eic_data.compute_trend([2000, 2001], [5.0, float("nan")])
        self.assertEqual(res_nan["status"], "invalid_data")

        res_none = eic_data.compute_trend([2000, 2001], [5.0, None])
        self.assertEqual(res_none["status"], "invalid_data")

        # 6. Monthly series detection
        res_mo = eic_data.compute_trend(["Jan 2024", "Feb 2024", "Mar 2024"], [12.4, 12.8, 13.5])
        self.assertTrue(res_mo["is_monthly"])
        self.assertEqual(res_mo["step_unit"], "mo")

        # 7. Real CO2 dataset verification
        co2_ds = eic_data.get_dataset("co2")
        res_co2 = eic_data.compute_trend(co2_ds["years"], co2_ds["values"])
        self.assertEqual(res_co2["status"], "valid")
        self.assertAlmostEqual(res_co2["ols_slope"], 1.92, places=1)
        self.assertFalse(res_co2["is_monthly"])
        self.assertEqual(res_co2["step_unit"], "yr")

    def test_eic_trend_endpoint(self):
        r = self.c.get("/api/eic/trend/co2")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertEqual(j["status"], "valid")
        self.assertEqual(j["step_unit"], "yr")
        self.assertGreater(j["ols_slope"], 1.5)

        r_404 = self.c.get("/api/eic/trend/nonexistent")
        self.assertEqual(r_404.status_code, 404)

    def test_eic_sea_level_official_resource_332(self):
        ds = eic_data.get_dataset("sea_level")
        self.assertIsNotNone(ds)
        self.assertEqual(ds.get("eic_resource_id"), "332")
        self.assertIn("332/global-mean-sea-level-1993-2024", ds.get("portal_url", ""))
        self.assertIn("Public Domain", ds.get("reuse_conditions", ""))
        dyn = ds["sonification"].get("dynamics", "")
        self.assertNotIn("altimeter precision", dyn)
        self.assertIn("Volume modulated by annual sea-level rise rate", dyn)

    def test_eic_co2_provenance_and_discrepancy_resolution(self):
        ds = eic_data.get_dataset("co2")
        self.assertIsNotNone(ds)
        self.assertIn("Mauna Loa Record", ds["title"])
        self.assertIn("424.61", ds["transformation_notes"])
        self.assertIn("422.8", ds["transformation_notes"])
        self.assertEqual(ds["values"][-1], 424.61)

    def test_eic_baseline_pitch_reconciliation(self):
        # GEOS-FP near-surface air temp baseline 14.0 °C maps to 418.18 Hz, not 500 Hz
        p_base = eic_data.calculate_pitch("geos_fp_temp", 14.0)
        self.assertAlmostEqual(p_base, 418.18, places=1)
        self.assertAlmostEqual(eic_data.calculate_pitch("geos_fp_temp", 12.0), 200.0, places=1)
        self.assertAlmostEqual(eic_data.calculate_pitch("geos_fp_temp", 17.5), 800.0, places=1)

    def test_eic_trend_first_point_and_dynamic_span(self):
        sl = eic_data.get_dataset("sea_level")
        trend = eic_data.compute_trend(sl["years"], sl["values"])
        self.assertEqual(trend["status"], "valid")
        self.assertIsNone(trend["first_point_delta"])
        self.assertIsNone(trend["yoy_deltas"][0])
        self.assertEqual(trend["trend_period"], "1993–2024")
        self.assertEqual(trend["trend_label"], "Linear trend, 1993–2024")
        self.assertGreater(trend["ols_slope"], 3.0)

        # Check API endpoint returns the updated structure
        r = self.c.get("/api/eic/trend/sea_level")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertIsNone(j["yoy_deltas"][0])
        self.assertEqual(j["trend_period"], "1993–2024")

    def test_dynamic_pitch_labels_generation(self):
        labels_geos = eic_data.generate_pitch_labels("geos_fp_temp")
        self.assertEqual(len(labels_geos), 3)
        self.assertIn("418 Hz", labels_geos[1])
        self.assertIn("200 Hz", labels_geos[0])
        self.assertIn("800 Hz", labels_geos[2])

        labels_sl = eic_data.generate_pitch_labels("sea_level")
        self.assertEqual(len(labels_sl), 3)
        self.assertIn("110 Hz", labels_sl[0])
        self.assertIn("185 Hz", labels_sl[1])
        self.assertIn("311 Hz", labels_sl[2])

        r = self.c.get("/api/eic/mapping/geos_fp_temp")
        self.assertEqual(r.status_code, 200)
        j = r.get_json()
        self.assertIn("pitch_slider_labels", j)
        self.assertEqual(j["pitch_slider_labels"], labels_geos)

    def test_security_config_no_default_leaks(self):
        import os
        orig_cesium = os.environ.pop("CESIUM_ION_TOKEN", None)
        orig_mapillary = os.environ.pop("MAPILLARY_TOKEN", None)
        try:
            r = self.c.get("/api/config")
            self.assertEqual(r.status_code, 200)
            j = r.get_json()
            self.assertIn(j.get("cesium_ion_token"), ["", None])
            self.assertIn(j.get("mapillary_token"), ["", None])
        finally:
            if orig_cesium: os.environ["CESIUM_ION_TOKEN"] = orig_cesium
            if orig_mapillary: os.environ["MAPILLARY_TOKEN"] = orig_mapillary

    def test_scientific_metadata_integrity_and_missions(self):
        # 1. Sea Level missions platform check
        sl = eic_data.get_dataset("sea_level")
        self.assertIn("missions", sl)
        self.assertIn("TOPEX/Poseidon", sl["missions"]["1993-2001"])
        self.assertIn("Sentinel-6", sl["missions"]["2020-2024"])

        # 2. CO2 limitations station check
        co2 = eic_data.get_dataset("co2")
        self.assertNotIn("Annual global averages", co2["limitations"])
        self.assertIn("Mauna Loa", co2["limitations"])

        # 3. ECCO2 variable name check
        ecco = eic_data.get_dataset("ecco2_ocean_currents")
        self.assertNotIn("velocity", ecco["variable_name"].lower())

        # 4. GISTEMP test case reference note check
        g_spec = eic_data.describe_mapping("temperature_anomaly")
        for tc in g_spec["test_cases"]:
            if tc["input_val"] == 1.5:
                self.assertNotIn("Paris Agreement", tc["note"])
                self.assertIn("sonification reference", tc["note"])

    def test_exact_source_series_checkpoints(self):
        # 1. GEOS-FP
        geos = eic_data.get_dataset("geos_fp_temp")
        self.assertEqual(len(geos["years"]), 12)
        self.assertEqual(geos["years"][0], "Jan 2024")
        self.assertEqual(geos["years"][-1], "Dec 2024")
        self.assertEqual(geos["values"][0], 12.4)
        self.assertEqual(geos["values"][-1], 12.6)
        self.assertEqual(geos["units"], "°C")
        self.assertEqual(geos["baseline_val"], 14.0)

        # 2. ECCO2
        ecco = eic_data.get_dataset("ecco2_ocean_currents")
        self.assertEqual(ecco["title"], "ECCO2 Sea Surface Potential Temperature")
        self.assertEqual(len(ecco["years"]), 12)
        self.assertEqual(ecco["values"][0], 15.8)
        self.assertEqual(ecco["values"][-1], 15.9)
        self.assertEqual(ecco["baseline_val"], 16.1)
        self.assertNotIn("velocity", ecco["data_identifier"].lower())
        self.assertNotIn("velocity", ecco["sonification"]["voice_desc"].lower())
        self.assertNotIn("heat transport", ecco["description"].lower())

        # 3. CO2 Mauna Loa station record
        co2 = eic_data.get_dataset("co2")
        self.assertEqual(len(co2["years"]), 45)
        self.assertEqual(co2["years"][0], 1980)
        self.assertEqual(co2["years"][-1], 2024)
        self.assertEqual(co2["values"][0], 338.76)
        self.assertEqual(co2["values"][-1], 424.61)
        self.assertEqual(co2["baseline_val"], 280.0)
        self.assertIn("Fixed Annual Reference Window", co2["historical_period"])

        # 4. Sea Level Altimetry
        sl = eic_data.get_dataset("sea_level")
        self.assertEqual(len(sl["years"]), 32)
        self.assertEqual(sl["years"][0], 1993)
        self.assertEqual(sl["years"][-1], 2024)
        self.assertEqual(sl["values"][0], 0.0)
        self.assertEqual(sl["values"][-1], 105.8)
        self.assertEqual(sl["baseline_val"], 0.0)
        self.assertEqual(sl["frame_integration_status"], "BLOCKED")
        self.assertEqual(sl["svs_id"], "5516")
        self.assertEqual(sl["eic_resource_id"], "332")

        # 5. GISTEMP v4
        gt = eic_data.get_dataset("temperature_anomaly")
        self.assertEqual(len(gt["years"]), 45)
        self.assertEqual(gt["years"][0], 1980)
        self.assertEqual(gt["years"][-1], 2024)
        self.assertEqual(gt["values"][0], 0.26)
        self.assertEqual(gt["values"][-1], 1.28)
        self.assertEqual(gt["baseline_val"], 0.0)

        # 6. Arctic Sea Ice
        ice = eic_data.get_dataset("arctic_sea_ice")
        self.assertEqual(len(ice["years"]), 45)
        self.assertEqual(ice["years"][0], 1980)
        self.assertEqual(ice["years"][-1], 2024)
        self.assertEqual(ice["values"][0], 7.67)
        self.assertEqual(ice["values"][-1], 4.28)
        self.assertEqual(ice["baseline_val"], 7.0)

    def test_pitch_clamping_and_boundaries(self):
        # Valid measurements within bounds that fall outside formula domain clamp deterministically
        self.assertEqual(eic_data.calculate_pitch("geos_fp_temp", 11.0), 200.0)
        self.assertEqual(eic_data.calculate_pitch("geos_fp_temp", 19.0), 800.0)
        self.assertEqual(eic_data.calculate_pitch("sea_level", -10.0), 110.0)
        self.assertAlmostEqual(eic_data.calculate_pitch("sea_level", 0.0), 110.0, places=1)
        self.assertEqual(eic_data.calculate_pitch("temperature_anomaly", -0.5), 164.81)
        self.assertEqual(eic_data.calculate_pitch("arctic_sea_ice", 9.0), 220.0)

        # Measurements outside physical validity bounds raise ValueError
        with self.assertRaises(ValueError):
            eic_data.calculate_pitch("geos_fp_temp", 5.0)
        with self.assertRaises(ValueError):
            eic_data.calculate_pitch("geos_fp_temp", 25.0)

    def test_gistemp_labels_sonification_ref(self):
        labels = eic_data.generate_pitch_labels("temperature_anomaly")
        self.assertEqual(len(labels), 3)
        self.assertIn("Sonification Ref", labels[2])
        self.assertNotIn("Policy Ref", labels[2])

    def test_api_404_error_handling(self):
        r1 = self.c.get("/api/eic/dataset/unknown_metric")
        self.assertEqual(r1.status_code, 404)
        r2 = self.c.get("/api/eic/trend/unknown_metric")
        self.assertEqual(r2.status_code, 404)
        r3 = self.c.get("/api/eic/mapping/unknown_metric")
        self.assertEqual(r3.status_code, 404)

    def test_mocked_offline_wav_generation(self):
        # 1. Climate WAV route
        with patch.object(nasa, "get_json", return_value=power_payload()):
            r = self.c.get("/api/sonify/climate.wav?lat=20.0&lon=10.0")
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.mimetype, "audio/wav")
            with wave.open(io.BytesIO(r.data), "rb") as w:
                self.assertEqual(w.getnchannels(), 2)
                self.assertEqual(w.getframerate(), 22050)
                self.assertGreater(w.getnframes(), 0)

        # 2. Frame WAV route
        with patch.object(nasa, "get_bytes", return_value=tile_bytes()):
            r = self.c.get("/api/sonify/frame.wav?layer=MODIS_Terra_CorrectedReflectance_TrueColor&date=2024-01-01&lat=20.0&lon=10.0&zoom=3")
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.mimetype, "audio/wav")
            with wave.open(io.BytesIO(r.data), "rb") as w:
                self.assertEqual(w.getnchannels(), 2)
                self.assertEqual(w.getframerate(), 22050)
                self.assertGreater(w.getnframes(), 0)



    def test_co2_metadata_and_mapping_consistency(self):
        # 1. Direct dataset inspection
        ds = eic_data.get_dataset("co2")
        self.assertEqual(ds["values"][-1], 424.61)
        self.assertIn("424.61", ds["transformation_notes"])

        # 2. Derived mapping inspection
        mapping = eic_data.describe_mapping("co2")
        self.assertEqual(mapping["observed_historical_range"], [338.76, 424.61])
        self.assertAlmostEqual(mapping["observed_historical_pitch_hz"][1], 349.82, places=1)

        # 3. HTTP API endpoint verification
        r_ds = self.c.get("/api/eic/dataset/co2")
        self.assertEqual(r_ds.status_code, 200)
        self.assertEqual(r_ds.get_json()["values"][-1], 424.61)

        r_map = self.c.get("/api/eic/mapping/co2")
        self.assertEqual(r_map.status_code, 200)
        self.assertEqual(r_map.get_json()["observed_historical_range"], [338.76, 424.61])




class TestNOAACO2ScientificReconciliation(unittest.TestCase):
    """Phase 4: Comprehensive regression testing against authoritative NOAA GML annual-mean CO2 data."""

    EXPECTED_NOAA_OBSERVATIONS = {
        1980: 338.76, 1981: 340.12, 1982: 341.48, 1983: 343.15, 1984: 344.87,
        1985: 346.35, 1986: 347.61, 1987: 349.31, 1988: 351.69, 1989: 353.20,
        1990: 354.45, 1991: 355.70, 1992: 356.54, 1993: 357.21, 1994: 358.96,
        1995: 360.97, 1996: 362.74, 1997: 363.88, 1998: 366.84, 1999: 368.54,
        2000: 369.71, 2001: 371.32, 2002: 373.45, 2003: 375.98, 2004: 377.70,
        2005: 379.98, 2006: 382.09, 2007: 384.02, 2008: 385.83, 2009: 387.64,
        2010: 390.10, 2011: 391.85, 2012: 394.06, 2013: 396.74, 2014: 398.81,
        2015: 401.01, 2016: 404.41, 2017: 406.76, 2018: 408.72, 2019: 411.65,
        2020: 414.21, 2021: 416.41, 2022: 418.53, 2023: 421.08, 2024: 424.61
    }

    def setUp(self):
        self.ds = eic_data.get_dataset("co2")

    def test_1_contains_exactly_45_observations_1980_2024(self):
        self.assertEqual(len(self.ds["years"]), 45)
        self.assertEqual(len(self.ds["values"]), 45)
        self.assertEqual(self.ds["years"][0], 1980)
        self.assertEqual(self.ds["years"][-1], 2024)

    def test_2_year_ordering_complete_sequential_and_aligned(self):
        expected_years = list(range(1980, 2025))
        self.assertEqual(self.ds["years"], expected_years)
        for i in range(len(self.ds["years"]) - 1):
            self.assertEqual(self.ds["years"][i + 1] - self.ds["years"][i], 1)

    def test_3_compare_every_annual_observation_against_checked_in_noaa_snapshot(self):
        import os
        fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "noaa_co2_annmean_mlo.csv")
        self.assertTrue(os.path.exists(fixture_path), "NOAA CSV fixture must be present")
        csv_data = {}
        with open(fixture_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 2 and parts[0].isdigit():
                    csv_data[int(parts[0])] = float(parts[1])
        
        for yr, val in zip(self.ds["years"], self.ds["values"]):
            self.assertIn(yr, csv_data, f"Year {yr} must be in NOAA authoritative CSV")
            self.assertAlmostEqual(val, csv_data[yr], places=2, msg=f"Year {yr} mismatch with NOAA CSV")
            self.assertAlmostEqual(val, self.EXPECTED_NOAA_OBSERVATIONS[yr], places=2)

    def test_4_exact_representative_checkpoints(self):
        val_map = dict(zip(self.ds["years"], self.ds["values"]))
        self.assertEqual(val_map[1980], 338.76)
        self.assertEqual(val_map[1982], 341.48)
        self.assertEqual(val_map[1983], 343.15)
        self.assertEqual(val_map[2016], 404.41)
        self.assertEqual(val_map[2024], 424.61)

    def test_5_derived_min_max_and_observed_pitch_range_from_canonical_array(self):
        min_v = min(self.ds["values"])
        max_v = max(self.ds["values"])
        self.assertEqual(min_v, 338.76)
        self.assertEqual(max_v, 424.61)

        p_min = eic_data.calculate_pitch("co2", min_v)
        p_max = eic_data.calculate_pitch("co2", max_v)
        self.assertEqual(p_min, 143.28)
        self.assertEqual(p_max, 349.82)

        mapping = eic_data.describe_mapping("co2")
        self.assertEqual(mapping["observed_historical_range"], [338.76, 424.61])
        self.assertEqual(mapping["observed_historical_pitch_hz"], [143.28, 349.82])

    def test_6_linear_trend_recalculated_against_independent_computation(self):
        trend = eic_data.compute_trend(self.ds["years"], self.ds["values"])
        self.assertEqual(trend["status"], "valid")
        # Independent linear regression calculation
        years = self.ds["years"]
        vals = self.ds["values"]
        n = len(years)
        x_m = sum(years) / n
        y_m = sum(vals) / n
        expected_slope = sum((x - x_m) * (y - y_m) for x, y in zip(years, vals)) / sum((x - x_m) ** 2 for x in years)
        expected_total_change = vals[-1] - vals[0]

        self.assertAlmostEqual(trend["ols_slope"], expected_slope, places=3)
        self.assertAlmostEqual(trend["ols_slope"], 1.9158, places=3)
        self.assertAlmostEqual(trend["total_change"], expected_total_change, places=3)
        self.assertAlmostEqual(trend["total_change"], 85.85, places=2)
        self.assertAlmostEqual(trend["mean_annual_rate"], 85.85 / 44, places=3)

    def test_7_first_observation_no_delta_subsequent_deltas_consecutive(self):
        trend = eic_data.compute_trend(self.ds["years"], self.ds["values"])
        deltas = trend["yoy_deltas"]
        self.assertIsNone(deltas[0])
        self.assertEqual(trend["first_point_delta"], None)
        self.assertIn("No prior observation", trend["first_point_note"])
        
        # Verify subsequent deltas
        for i in range(1, len(self.ds["values"])):
            expected_delta = round(self.ds["values"][i] - self.ds["values"][i - 1], 4)
            self.assertAlmostEqual(deltas[i], expected_delta, places=4)
        
        # Check specific consecutive deltas
        self.assertAlmostEqual(deltas[1], 1.36, places=2)   # 340.12 - 338.76
        self.assertAlmostEqual(deltas[44], 3.53, places=2)  # 424.61 - 421.08

    def test_8_api_and_frontend_consistency(self):
        import json, os
        # Check frontend JS values match backend values exactly
        fe_path = os.path.join(os.path.dirname(__file__), "..", "assets", "js", "eic.js")
        with open(fe_path, "r", encoding="utf-8") as f:
            fe_code = f.read()
        for val in [338.76, 340.12, 341.48, 404.41, 421.08, 424.61]:
            self.assertIn(f"{val:.2f}", fe_code, f"Frontend must contain canonical value {val}")

    def test_9_sonification_transfer_function_boundaries_and_checkpoints(self):
        # f = 130.81 * (2 ** (clamp((val - 330) / 100, 0, 1.2) * 1.5))
        # 1. Below / at calibration floor (330 ppm)
        self.assertEqual(eic_data.calculate_pitch("co2", 280.0), 130.81)
        self.assertEqual(eic_data.calculate_pitch("co2", 300.0), 130.81)
        self.assertEqual(eic_data.calculate_pitch("co2", 330.0), 130.81)
        # 2. Midpoint (380 ppm -> norm=0.5)
        self.assertEqual(eic_data.calculate_pitch("co2", 380.0), 220.00)
        # 3. Nominal calibration ceiling (430 ppm -> norm=1.0)
        self.assertEqual(eic_data.calculate_pitch("co2", 430.0), 369.99)
        # 4. Corrected 2024 observation (424.61 ppm)
        self.assertEqual(eic_data.calculate_pitch("co2", 424.61), 349.82)
        # 5. Clamping upper threshold (450.0 ppm -> norm=1.2)
        self.assertEqual(eic_data.calculate_pitch("co2", 450.0), 455.51)
        # 6. Values beyond headroom (460, 500, 600 ppm) clamp cleanly to 455.51 Hz
        self.assertEqual(eic_data.calculate_pitch("co2", 460.0), 455.51)
        self.assertEqual(eic_data.calculate_pitch("co2", 500.0), 455.51)
        self.assertEqual(eic_data.calculate_pitch("co2", 600.0), 455.51)
        # 7. Values outside physical valid range (<280 or >600) raise ValueError
        with self.assertRaises(ValueError):
            eic_data.calculate_pitch("co2", 250.0)
        with self.assertRaises(ValueError):
            eic_data.calculate_pitch("co2", 650.0)
        with self.assertRaises(ValueError):
            eic_data.calculate_pitch("co2", float("nan"))
        with self.assertRaises(ValueError):
            eic_data.calculate_pitch("co2", float("inf"))

    def test_11_dataset_scientific_classification_and_ecco2_labeling(self):
        # Verify all 6 datasets have explicit data_classification
        for d_id in ["geos_fp_temp", "ecco2_ocean_currents", "co2", "sea_level", "temperature_anomaly", "arctic_sea_ice"]:
            ds = eic_data.get_dataset(d_id)
            self.assertIn("data_classification", ds, f"{d_id} must have data_classification")
            self.assertTrue(len(ds["data_classification"]) > 10)

        # ECCO2 must be labeled as synthesized climatological model output
        ecco = eic_data.get_dataset("ecco2_ocean_currents")
        self.assertIn("Synthesized Climatological Model Output", ecco["data_classification"])
        self.assertIn("scalar thermal storage", ecco["transformation_notes"])

        # NOAA CO2 must be in-situ observational
        co2_ds = eic_data.get_dataset("co2")
        self.assertIn("In-Situ Observational Measurement", co2_ds["data_classification"])

    def test_10_outdated_approximate_or_inconsistent_values_fail(self):
        outdated_approximations = [338.8, 341.2, 342.9, 344.4, 404.2, 424.5, 424.6]
        for val in outdated_approximations:
            self.assertNotIn(val, self.ds["values"], f"Outdated approximate value {val} must not be in canonical array")


if __name__ == "__main__":
    unittest.main()

