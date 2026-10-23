"""Upstream clients with caching: NASA GIBS tiles, NASA POWER climate, OpenStreetMap Nominatim."""
from __future__ import annotations

import io
import math
import os
import threading
import time

import numpy as np
import requests
from PIL import Image

UA = os.environ.get("JUKEBOX_CONTACT", "earth-information-jukebox/1.0 (set JUKEBOX_CONTACT to your contact email or repo URL)")
TIMEOUT = 15
MAX_BYTES = 4_000_000

LAYERS = {
    "MODIS_Terra_CorrectedReflectance_TrueColor": {"matrix": 9, "ext": "jpg", "kind": "photo", "label": "photo"},
    "MODIS_Aqua_CorrectedReflectance_TrueColor": {"matrix": 9, "ext": "jpg", "kind": "photo", "label": "photo"},
    "VIIRS_SNPP_CorrectedReflectance_TrueColor": {"matrix": 9, "ext": "jpg", "kind": "photo", "label": "photo"},
    "MODIS_Terra_Land_Surface_Temp_Day": {"matrix": 7, "ext": "png", "kind": "data", "label": "land temperature"},
    "MODIS_Terra_Aerosol": {"matrix": 6, "ext": "png", "kind": "data", "label": "aerosol"},
    "GHRSST_L4_MUR_Sea_Surface_Temperature": {"matrix": 7, "ext": "png", "kind": "data", "label": "sea temperature"},
    "MODIS_Terra_NDSI_Snow_Cover": {"matrix": 8, "ext": "png", "kind": "data", "label": "snow cover"},
    "VIIRS_SNPP_DayNightBand_At_Sensor_Radiance": {"matrix": 8, "ext": "png", "kind": "data", "label": "night light"},
}
GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best"
POWER = "https://power.larc.nasa.gov/api/temporal/monthly/point"
NOMINATIM = "https://nominatim.openstreetmap.org"


class UpstreamError(Exception):
    """An outside service failed or returned something unusable."""


class TTLCache:
    def __init__(self, ttl: float, maxsize: int = 512):
        self.ttl, self.maxsize, self._d, self._lock = ttl, maxsize, {}, threading.Lock()

    def get(self, key):
        with self._lock:
            hit = self._d.get(key)
            if hit and hit[0] > time.time():
                return hit[1]
            self._d.pop(key, None)
        return None

    def set(self, key, value):
        with self._lock:
            if len(self._d) >= self.maxsize:
                self._d.pop(min(self._d, key=lambda k: self._d[k][0]), None)
            self._d[key] = (time.time() + self.ttl, value)

    def clear(self):
        with self._lock:
            self._d.clear()


_tiles, _climate, _geo = TTLCache(3600, 256), TTLCache(86400, 512), TTLCache(86400, 512)


def clear_caches():
    for c in (_tiles, _climate, _geo):
        c.clear()


def get_bytes(url: str, params=None, headers=None) -> bytes:
    try:
        r = requests.get(url, params=params, headers={"User-Agent": UA, **(headers or {})}, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise UpstreamError(f"could not reach {url.split('/')[2]}") from e
    if r.status_code != 200:
        raise UpstreamError(f"{url.split('/')[2]} answered {r.status_code}")
    if len(r.content) > MAX_BYTES:
        raise UpstreamError("upstream response too large")
    return r.content


def get_json(url: str, params=None, headers=None):
    try:
        import json
        return json.loads(get_bytes(url, params, headers))
    except ValueError as e:
        raise UpstreamError("upstream did not return JSON") from e


def tile_for(lat: float, lon: float, z: int) -> tuple[int, int]:
    lat = max(-85.0511, min(85.0511, lat))
    n = 2 ** z
    x = int((lon + 180) / 360 * n) % n
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    return x, max(0, min(n - 1, y))


def tile_url(layer: str, date: str, z: int, x: int, y: int) -> str:
    m = LAYERS[layer]
    return f"{GIBS}/{layer}/default/{date}/GoogleMapsCompatible_Level{m['matrix']}/{z}/{y}/{x}.{m['ext']}"


def fetch_tile(layer: str, date: str, z: int, x: int, y: int) -> Image.Image:
    url = tile_url(layer, date, z, x, y)
    raw = _tiles.get(url)
    if raw is None:
        raw = get_bytes(url)
        _tiles.set(url, raw)
    try:
        return Image.open(io.BytesIO(raw)).convert("RGBA")
    except Exception as e:  # noqa: BLE001 - any decode problem is an upstream problem
        raise UpstreamError("GIBS returned an unreadable tile") from e


def climate(lat: float, lon: float, start: int = 1985, end: int = 2025) -> dict:
    """Annual mean temperature and rainfall from NASA POWER monthly data, plus a linear trend."""
    glat, glon = round(lat * 2) / 2, round(lon * 2) / 2          # POWER is a ~0.5 degree grid: share cache entries
    key = (glat, glon, start, end)
    cached = _climate.get(key)
    if cached:
        return cached
    j = get_json(POWER, {"parameters": "T2M,PRECTOTCORR", "community": "RE", "longitude": glon, "latitude": glat,
                         "start": start, "end": end, "format": "JSON"})
    try:
        T, R = j["properties"]["parameter"]["T2M"], j["properties"]["parameter"]["PRECTOTCORR"]
    except (KeyError, TypeError) as e:
        raise UpstreamError("NASA POWER returned an unexpected shape") from e
    years, temps, rains = [], [], []
    for y in range(start, end + 1):
        tm = [T[k] for k in (f"{y}{m:02d}" for m in range(1, 13)) if T.get(k, -999) > -900]
        rm = [R[k] for k in (f"{y}{m:02d}" for m in range(1, 13)) if R.get(k, -999) > -900]
        if len(tm) >= 10:
            years.append(y)
            temps.append(sum(tm) / len(tm))
            rains.append(sum(rm) / len(rm) if rm else 0.0)
    if len(years) < 5:
        raise UpstreamError("NASA POWER has too little data for this point")
    slope = float(np.polyfit(years, temps, 1)[0])
    out = {"lat": glat, "lon": glon, "years": years, "temp_c": [round(t, 3) for t in temps],
           "rain_mm_day": [round(r, 3) for r in rains], "mean_c": round(float(np.mean(temps)), 3),
           "mean_rain_mm_day": round(float(np.mean(rains)), 3), "trend_c_per_year": round(slope, 5),
           "trend_c_per_decade": round(slope * 10, 3), "source": "NASA POWER (monthly, community RE)"}
    _climate.set(key, out)
    return out


_nom_lock, _nom_last = threading.Lock(), [0.0]


def nominatim(path: str, params: dict):
    """Cached, rate-limited (1 request per second) Nominatim call, as its usage policy requires."""
    key = (path, tuple(sorted(params.items())))
    cached = _geo.get(key)
    if cached is not None:
        return cached
    with _nom_lock:
        wait = 1.05 - (time.time() - _nom_last[0])
        if wait > 0:
            time.sleep(wait)
        try:
            out = get_json(f"{NOMINATIM}/{path}", params)
        finally:
            _nom_last[0] = time.time()
    _geo.set(key, out)
    return out
