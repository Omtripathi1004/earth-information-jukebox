"""Earth Information Jukebox backend (Flask).

Flask backend: serves the web app and a small API for data, search and server-side sonification.

Run from the repository root:
    pip install -r backend/requirements.txt
    python -m backend.app.main            # http://127.0.0.1:8000
Production:
    gunicorn -w 2 --threads 4 -b 0.0.0.0:$PORT backend.app.main:app
"""
from __future__ import annotations

import datetime as dt
import os
import re
from dataclasses import asdict
from pathlib import Path

import numpy as np
from flask import Flask, Response, jsonify, request, send_from_directory
from PIL import Image

from . import nasa, sonify

ROOT = Path(__file__).resolve().parents[2]            # repository root: index.html and assets/

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass

DEFAULT_LAYER = "MODIS_Terra_CorrectedReflectance_TrueColor"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ApiError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message, self.status = message, status


def num(name: str, lo: float, hi: float, default: float | None = None) -> float:
    raw = request.args.get(name)
    if raw in (None, ""):
        if default is None:
            raise ApiError(f"missing '{name}'")
        return default
    try:
        v = float(raw)
    except ValueError:
        raise ApiError(f"'{name}' must be a number") from None
    if not (lo <= v <= hi):                           # also rejects NaN
        raise ApiError(f"'{name}' must be between {lo} and {hi}")
    return v


def imagery_date() -> str:
    raw = request.args.get("date") or (dt.date.today() - dt.timedelta(days=3)).isoformat()
    try:
        d = dt.date.fromisoformat(raw) if DATE_RE.match(raw) else None
    except ValueError:
        d = None
    if d is None or d < dt.date(2000, 1, 1) or d > dt.date.today():
        raise ApiError("'date' must be YYYY-MM-DD, from 2000-01-01 up to today")
    return raw


def frame_notes():
    """Fetch the GIBS tile under the view centre and turn its columns into notes."""
    layer = request.args.get("layer", DEFAULT_LAYER)
    if layer not in nasa.LAYERS:
        raise ApiError(f"unknown layer; choose one of {sorted(nasa.LAYERS)}")
    meta = nasa.LAYERS[layer]
    date, lat, lon = imagery_date(), num("lat", -90, 90), num("lon", -180, 180)
    z = min(int(num("zoom", 0, 12, 5)), meta["matrix"])
    step = num("step", 0.08, 0.5, 0.16)
    x, y = nasa.tile_for(lat, lon, z)
    img = nasa.fetch_tile(layer, date, z, x, y).resize((sonify.COLS, sonify.ROWS), Image.BILINEAR)
    notes = sonify.image_notes(np.asarray(img), meta["kind"], meta["label"], step)
    return layer, date, (z, x, y), step, notes


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    @app.after_request
    def headers(resp):
        if request.path.startswith("/api/"):
            resp.headers["Access-Control-Allow-Origin"] = "*"      # lets a static frontend use a hosted backend
            resp.headers.setdefault("Cache-Control", "public, max-age=300")
        return resp

    @app.errorhandler(ApiError)
    def api_error(e):
        return jsonify(error=e.message), e.status

    @app.errorhandler(nasa.UpstreamError)
    def upstream_error(e):
        return jsonify(error=str(e)), 502

    @app.get("/api/health")
    def health():
        return jsonify(ok=True, service="earth-information-jukebox", layers=sorted(nasa.LAYERS))

    @app.get("/api/config")
    def config():
        """Optional shared tokens for a team deployment. Browser tokens are public by nature: restrict them at the provider."""
        return jsonify(mapillary_token=os.environ.get("MAPILLARY_TOKEN") or None, cesium_ion_token=os.environ.get("CESIUM_ION_TOKEN") or None)

    @app.get("/api/climate")
    def climate():
        return jsonify(nasa.climate(num("lat", -90, 90), num("lon", -180, 180)))

    @app.get("/api/geocode")
    def geocode():
        q = (request.args.get("q") or "").strip()
        if not q or len(q) > 200:
            raise ApiError("'q' must be 1 to 200 characters")
        return jsonify(nasa.nominatim("search", {"format": "json", "limit": int(num("limit", 1, 5, 1)), "q": q}))

    @app.get("/api/reverse")
    def reverse():
        return jsonify(nasa.nominatim("reverse", {"format": "json", "zoom": int(num("zoom", 3, 18, 10)),
                                                  "lat": num("lat", -90, 90), "lon": num("lon", -180, 180)}))

    @app.get("/api/sonify/frame.json")
    def frame_json():
        layer, date, (z, x, y), step, notes = frame_notes()
        return jsonify(layer=layer, date=date, tile={"z": z, "x": x, "y": y}, step_s=step, notes=[asdict(n) for n in notes])

    def wav_response(notes, name):
        body = sonify.to_wav_bytes(sonify.render(notes))
        disp = "inline" if request.args.get("inline") else "attachment"
        return Response(body, mimetype="audio/wav", headers={"Content-Disposition": f'{disp}; filename="{name}"'})

    @app.get("/api/sonify/frame.wav")
    def frame_wav():
        layer, date, _, _, notes = frame_notes()
        if not notes:
            raise ApiError("that view has no data to sonify (empty tile)", 404)
        return wav_response(notes, f"earth-postcard-{layer}-{date}.wav")

    @app.get("/api/sonify/climate.wav")
    def climate_wav():
        c = nasa.climate(num("lat", -90, 90), num("lon", -180, 180))
        return wav_response(sonify.climate_notes(c["temp_c"]), f"climate-{c['lat']}_{c['lon']}.wav")

    @app.get("/")
    def index():
        return send_from_directory(ROOT, "index.html")

    @app.get("/assets/<path:p>")
    def assets(p):
        return send_from_directory(ROOT / "assets", p)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "8000")))
