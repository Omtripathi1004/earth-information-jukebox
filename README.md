# Earth Information Jukebox

> Scroll down to Earth, then listen. A NASA Space Apps 2026 project turning satellite pixels and climate data into sound.

An interactive Earth observation jukebox that sonifies NASA satellite imagery (MODIS, VIIRS), NASA POWER climate data, terrain elevation, 3D buildings, Mapillary street views, and Cesium 3D tiles into audio scales and timbres.

## Features
- **Interactive Earth Globe**: Smooth zoom from orbit down to ground level in 3D using MapLibre GL.
- **Pixel Sonification**: A real-time scanline converts satellite imagery into audio via the Web Audio API and Flask backend.
- **NASA POWER Climate Melodies**: 40 years of temperature data sonified into musical notes.
- **Street View & 3D**: Mapillary street photos and Google Photorealistic 3D Tiles via Cesium ion.
- **Audio Postcard**: Download views as WAV files directly from the server sonification engine.

## Tech Stack
- **Frontend**: HTML5, Tailwind CSS, MapLibre GL, Web Audio API
- **Backend**: Python, Flask, NumPy, Pillow, Requests
- **Deployment**: Vercel Serverless

## Local Setup
```bash
git clone https://github.com/Omtripathi1004/earth-information-jukebox.git
cd earth-information-jukebox
pip install -r backend/requirements.txt
python -m backend.app.main
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.
