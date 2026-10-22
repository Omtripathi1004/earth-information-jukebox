"""Sonification core: turns image columns and data series into notes, then into WAV audio.

The mapping mirrors assets/js/app.js, so the browser and the server sound the same:
  brightness -> pitch (two-octave pentatonic scale)      texture -> loudness
  water / vegetation / bare land / cloud-ice -> timbre    column position -> stereo pan
  data layers: colour hue (blue = low, red = high) -> pitch, grey = no data = silence
"""
from __future__ import annotations

import io
import math
import wave
from dataclasses import dataclass

import numpy as np

SR = 22050
BASE_HZ = 130.81
PENTA = (0, 2, 4, 7, 9)
SHIFT = {"water": -12, "forest": 0, "desert": 0, "ice": 12}
COLS, ROWS = 48, 27

# voice -> (partials as (frequency multiple, waveform, weight), duration s, attack s)
VOICES = {
    "bell": ([(1, "sine", 1.0), (2.76, "sine", 0.45), (5.4, "sine", 0.2)], 1.4, 0.01),
    "water": ([(1, "sine", 1.0), (1.005, "sine", 0.6)], 1.8, 0.08),
    "forest": ([(1, "triangle", 1.0), (2, "sine", 0.25)], 0.7, 0.01),
    "desert": ([(1, "saw", 0.6), (1.5, "triangle", 0.3)], 0.7, 0.01),
}


@dataclass
class Note:
    t: float       # start time in seconds
    freq: float    # Hz
    vel: float     # loudness 0..1
    pan: float     # -1 (left) .. 1 (right)
    voice: str     # bell | water | forest | desert
    label: str = ""


def clamp(x: float, lo: float, hi: float) -> float:
    return min(hi, max(lo, x))


def rnd(x: float) -> int:
    """Round half up, like JavaScript's Math.round."""
    return int(math.floor(x + 0.5))


def scale_freq(k: int) -> float:
    k = int(k)
    return BASE_HZ * 2 ** ((12 * (k // 5) + PENTA[k % 5]) / 12)


def classify(r: float, g: float, b: float) -> str:
    lum = (r + g + b) / 765
    if lum > 0.7 and abs(r - b) < 30:
        return "ice"
    if b > r + 8 and b >= g - 6:
        return "water"
    if g > r + 4 and g >= b:
        return "forest"
    return "desert"


def photo_note(px: np.ndarray, col: int, cols: int, step: float) -> Note | None:
    """One image column of a true-colour photo -> one note (or None if the column is empty)."""
    px = px[px[:, 3] >= 128]
    if len(px) <= 3:
        return None
    rgb = px[:, :3].astype(float)
    r, g, b = rgb.mean(axis=0)
    lum = (r + g + b) / 765
    sd = float(rgb.sum(axis=1).std()) / 765
    cls = classify(r, g, b)
    k = rnd(clamp(lum * 1.15, 0, 1) * 9)
    semis = PENTA[k % 5] + 12 * (k // 5) + SHIFT[cls]
    return Note(col * step, BASE_HZ * 2 ** (semis / 12), 0.08 + min(0.14, sd * 0.9),
                col / cols * 1.6 - 0.8, "bell" if cls == "ice" else cls, cls)


def data_note(px: np.ndarray, col: int, cols: int, step: float, label: str = "data") -> Note | None:
    """One column of a colour-mapped NASA data frame: hue -> pitch. Grey / transparent = no data."""
    px = px[px[:, 3] >= 128][:, :3].astype(int)
    if len(px) == 0:
        return None
    px = px[(px.max(axis=1) - px.min(axis=1)) > 40]
    if len(px) < 2:
        return None
    r, g, b = px.mean(axis=0)
    mx = max(r, g, b)
    sat = mx - min(r, g, b)
    h = ((g - b) / sat) % 6 if mx == r else (b - r) / sat + 2 if mx == g else (r - g) / sat + 4
    h = (h * 60 + 360) % 360
    v = clamp((240 - clamp(h, 0, 240)) / 240, 0, 1)
    level = "low" if v < 0.33 else "medium" if v < 0.66 else "high"
    return Note(col * step, scale_freq(rnd(v * 9) + 3), 0.1 + sat / 255 * 0.12,
                col / cols * 1.6 - 0.8, "bell", f"{label} {level}")


def image_notes(img: np.ndarray, kind: str, label: str = "data", step: float = 0.16) -> list[Note]:
    """img: (rows, cols, 4) uint8 RGBA, already resized to ROWS x COLS."""
    cols = img.shape[1]
    notes = []
    for c in range(cols):
        n = photo_note(img[:, c, :], c, cols, step) if kind == "photo" else data_note(img[:, c, :], c, cols, step, label)
        if n:
            notes.append(n)
    return notes


def climate_notes(temps: list[float], step: float = 0.2) -> list[Note]:
    """One note per year: warmer than the local average -> higher pitch."""
    m = float(np.mean(temps))
    n = len(temps)
    return [Note(i * step, scale_freq(rnd(clamp((t - m + 1.5) / 3, 0, 1) * 14)), 0.16,
                 i / n * 1.6 - 0.8, "bell", f"{t:.2f}") for i, t in enumerate(temps)]


def _osc(kind: str, f: float, t: np.ndarray) -> np.ndarray:
    ph = 2 * np.pi * f * t
    if kind == "sine":
        return np.sin(ph)
    if kind == "triangle":
        return (2 / np.pi) * np.arcsin(np.sin(ph))
    return (2 / np.pi) * sum(np.sin(h * ph) / h for h in range(1, 7))   # band-limited saw


def render(notes: list[Note], sr: int = SR, tail: float = 2.0) -> np.ndarray:
    """Notes -> stereo int16 PCM with a soft two-tap echo."""
    if not notes:
        return np.zeros((sr // 2, 2), dtype=np.int16)
    total = max(n.t + VOICES[n.voice][1] for n in notes) + 0.05 + tail
    out = np.zeros((int(total * sr) + 1, 2))
    for n in notes:
        parts, dur, att = VOICES[n.voice]
        m = int((dur + 0.05) * sr)
        t = np.arange(m) / sr
        vel = max(n.vel, 1e-3)
        env = vel * np.where(t < att, t / att, (0.0008 / vel) ** (np.clip(t - att, 0, None) / (dur - att)))
        sig = sum(w * _osc(kind, n.freq * mult, t) for mult, kind, w in parts) * env
        a = (clamp(n.pan, -1, 1) + 1) * np.pi / 4
        i = int(n.t * sr)
        out[i:i + m, 0] += sig * math.cos(a)
        out[i:i + m, 1] += sig * math.sin(a)
    for delay, gain in ((0.33, 0.35), (0.66, 0.15)):
        d = int(delay * sr)
        out[d:] += out[:-d] * gain
    peak = float(np.abs(out).max())
    if peak > 0:
        out *= 0.85 / peak
    return (out * 32767).astype(np.int16)


def to_wav_bytes(pcm: np.ndarray, sr: int = SR) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()
