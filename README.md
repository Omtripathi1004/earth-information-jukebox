# Earth Information Jukebox

> **NASA Space Apps Challenge 2026: The Earth Information Jukebox**  
> *Scroll down to Earth, then listen. Connecting verified NASA Earth Information Center (EIC) visual frames with real-time, data-driven dynamic sonification.*

[![Live on Vercel](https://img.shields.io/badge/Live%20App-nasa3--pi.vercel.app-0ea5e9?style=flat&logo=vercel)](https://nasa3-pi.vercel.app/)
[![NASA Space Apps](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Challenge-blue?style=flat)](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-42%2F42%20Passing-emerald?style=flat)](tests/test_backend.py)
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-706%2F706%20Passing-emerald?style=flat)](tests/test_frontend.js)
[![Browser Audio Tests](https://img.shields.io/badge/Browser%20Audio-19%2F19%20Passing-emerald?style=flat)](tests/test_browser_audio.js)
[![CI](https://github.com/Omtripathi1004/earth-information-jukebox/actions/workflows/test.yml/badge.svg)](https://github.com/Omtripathi1004/earth-information-jukebox/actions)

---

> **Important Scientific & Legal Notice (14 CFR 1221 Compliance):**  
> The Earth Information Jukebox is an independent prototype developed for the NASA Space Apps Challenge 2026. This application utilizes open scientific data provided by NASA, NOAA, and partner agencies, but is not officially endorsed by or affiliated with NASA. Official NASA insignia ("meatball" or "worm" logos) are not used as project branding.

---

## 1. Project Architecture & Directory Structure

The project is structured with a zero-DRY, modular architecture separating client-side visualization/audio from serverless scientific compute and regression verification suites:

```
earth-information-jukebox/
├── index.html                   # Semantic HTML5 entry point & accessible UI HUD
├── vercel.json                  # Production serverless deployment & route routing configuration
├── requirements.txt             # Unified Python dependencies (Flask, NumPy, Gunicorn, Pillow)
├── README.md                    # Scientific documentation & architectural specification
│
├── assets/                      # Production client assets
│   ├── css/
│   │   └── style.css            # Responsive dark UI styling, animations, & accessibility rules
│   └── js/
│       ├── audio-engine.js      # Unified EarthAudioEngine singleton (Web Audio API graph)
│       ├── app.js               # Core map client (MapLibre GL, GIBS scanner, NASA POWER client)
│       └── eic.js               # EIC Jukebox module (data prep, sonification, Pearson correlation)
│
├── backend/                     # Python 3.13 REST backend
│   ├── requirements.txt         # Local backend dependencies
│   └── app/
│       ├── __init__.py          # Package initialization
│       ├── config.py            # Centralized environment & public config sanitizer
│       ├── main.py              # Flask 3.0 application factory & REST endpoints
│       ├── nasa.py              # NASA POWER v10 API client, caching & OLS trend analysis
│       ├── eic_data.py          # EIC dataset catalog, schema validator & statistical metadata
│       └── sonify.py            # NumPy 44.1kHz 16-bit PCM WAV synthesizer
│
├── api/                         # Vercel Serverless Functions
│   └── index.py                 # Serverless WSGI adapter exporting the Flask app
│
├── scripts/                     # Offline build & studio narration utilities
│   └── generate_narration.py    # ElevenLabs studio narration generator
│
└── tests/                       # Comprehensive verification test suites
    ├── test_backend.py          # 42 unit & integration tests (Pytest)
    ├── test_frontend.js         # 706 deterministic schema & sonification assertions (Node.js)
    └── test_browser_audio.js    # 19 live Chromium Web Audio RMS & tone tests (Puppeteer)
```

### Client Architecture
- **Web Audio Synthesis Graph (`audio-engine.js`):** Unified hardware-accelerated audio pipeline routing all voices through a dedicated `DynamicsCompressorNode` (threshold -24 dB, ratio 12:1), master `GainNode`, spatial `DelayNode` feedback unit, and `AnalyserNode` for live measurable RMS signal verification.
- **3D Digital Globe Engine (`app.js`):** Interactive globe projection utilizing MapLibre GL 5.14.0 with continuous scroll-to-zoom altitude interpolation, adaptive 3D perspective pitch (up to 38°), and OpenFreeMap 3D extruded building geometry.
- **EIC Planetary Jukebox (`eic.js`):** Coherent timeline coordinator managing 6 canonical EIC datasets, interactive sparkline scrubber, Pearson correlation calculation across overlapping series, dual-frequency comparison sonifier, and screen-reader data table.

### Backend Architecture
- **REST Endpoints (`backend/app/main.py`):** Flask 3.0 API offering `/api/eic/datasets`, `/api/eic/sonify`, `/api/climate`, `/api/wav`, and sanitized `/api/config`.
- **Serverless Deployment (`api/index.py` & `vercel.json`):** Zero-cold-start WSGI deployment on Vercel, enabling instant global edge availability.
- **WAV Audio Synthesizer (`backend/app/sonify.py`):** High-precision NumPy array processing generating broadcast-quality 44.1 kHz, 16-bit mono PCM `.wav` sonic postcards for offline download.

---

## 2. Exact Tech Stack

| Tier | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Vanilla ES6+ JavaScript | Zero build step, lightning-fast DOM execution, native web standard compliance |
| **Interactive 3D Globe** | MapLibre GL 5.14.0 | Hardware-accelerated WebGL 3D globe projection, dynamic satellite layer raster blending |
| **Audio Synthesis** | W3C Web Audio API | Low-latency oscillator synthesis, biquad filtering, stereo panning, dynamics compression |
| **3D Buildings & Basemap** | OpenFreeMap / OpenStreetMap | Vector building footprints extruded in 3D at street level |
| **UI Styling** | Tailwind CSS (inline utility) | Responsive, mobile-first, high-contrast accessible dark interface |
| **Backend Framework** | Python 3.13 / Flask 3.0 | Lightweight REST API, request validation, upstream caching, and CORS management |
| **Scientific Audio DSP** | NumPy 2.x | Vectorized 44.1 kHz PCM audio synthesis, envelope shaping, harmonic voice generation |
| **Image Processing** | Pillow (PIL) | Server-side satellite raster sampling and luminance feature sonification |
| **Hosting & Edge** | Vercel Serverless Functions | Global edge deployment, automated CI/CD branch previews, zero-maintenance scaling |
| **Production WSGI** | Gunicorn 21.2.0 | Production-grade WSGI HTTP server for containerized and server environments |
| **Testing Harnesses** | Pytest, Node.js, Puppeteer | 42 backend tests + 706 frontend assertions + 19 headless browser audio tests |

---

## 3. NASA Data & Earth Science Resources Utilized

The Earth Information Jukebox directly integrates 8 open scientific resources from NASA, NOAA, and partner institutions:

1. **NASA Earth Information Center (EIC) — [earth.gov](https://earth.gov/)**  
   The primary scientific design benchmark for the application. All 6 canonical Jukebox metrics, themes, units, and baseline references are modeled directly on the Earth Information Center's vital signs visualizations.
2. **NASA EOSDIS GIBS (Global Imagery Browse Services) — [earthdata.nasa.gov](https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs)**  
   Provides real-time WMTS satellite raster imagery projected across the 3D globe:
   - *MODIS Terra Land Surface Temperature (Day)* — Daytime land skin thermal patterns.
   - *MODIS Aqua Corrected Reflectance (True Color)* — Natural photorealistic optical imagery.
   - *Suomi-NPP VIIRS True Color / Day-Night Band* — High-resolution earth surface and night lights.
   - *MODIS NDSI Snow Cover* — Cryospheric snow cover and polar reflectance.
   - *MODIS Aerosol Optical Depth* — Atmospheric particulate and smoke transport.
3. **NASA POWER Project (Prediction of Worldwide Energy Resources) — [power.larc.nasa.gov](https://power.larc.nasa.gov/)**  
   Provides on-demand 40-year localized meteorological time series (1985–2025) via the NASA POWER v10 API, delivering monthly 2-meter air temperature (`T2M`) and precipitation (`PRECTOTCORR`) for any user-clicked coordinate on Earth.
4. **NASA GMAO GEOS-FP (Goddard Earth Observing System Forward Processing) — [gmao.gsfc.nasa.gov](https://gmao.gsfc.nasa.gov/)**  
   Near-surface 2-meter air temperature atmospheric assimilation model output tracking global seasonal temperature cycles (12.4 °C to 17.1 °C in 2024).
5. **NASA GISS GISTEMP v4 (Goddard Institute for Space Studies) — [data.giss.nasa.gov/gistemp](https://data.giss.nasa.gov/gistemp/)**  
   Global surface temperature anomaly analysis (1880–2024) relative to the 1951–1980 base period, sonifying multi-decadal warming trends up to +1.28 °C in 2024.
6. **NOAA Global Monitoring Laboratory (GML) / GHG Center — [earth.gov/ghgcenter](https://earth.gov/ghgcenter)**  
   Continuous in-situ atmospheric carbon dioxide ($CO_2$) measurements from the Mauna Loa Baseline Observatory in Hawaii (1980–2024, 338.76 ppm to 424.61 ppm).
7. **NASA GSFC Sea Level Change Team / EIC Resource #332 — [earth.gov/sealevel](https://earth.gov/sealevel)**  
   Satellite radar altimetry measurements of Global Mean Sea Level (GMSL) rise from TOPEX/Poseidon, Jason-1/2/3, and Sentinel-6 Michael Freilich (1993–2024, 0.0 mm to +105.8 mm).
8. **NSIDC (National Snow and Ice Data Center) — [nsidc.org](https://nsidc.org/)**  
   Arctic Sea Ice Minimum Extent (September annual minimum from Nimbus-7 SMMR and DMSP SSM/I-SSMIS sensors, 1979–2024, 7.67 million km² down to 3.39 million km²).
9. **NASA JPL ECCO2 (Estimating the Circulation and Climate of the Ocean) — [ecco-group.org](https://www.ecco-group.org/)**  
   Cube92 global ocean state estimate providing near-surface (0–5m) area-averaged potential temperature across the global ocean basin.

---

## 4. Challenge Mission & Scientific Distinction

NASA's **Earth Information Center (EIC)** curates high-impact visualizations tracking Earth's vital signs. To maintain strict scientific integrity, this application distinguishes between three explicit sonification pipelines:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EARTH INFORMATION JUKEBOX ARCHITECTURE                │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│         MODE A          │         MODE B          │         MODE C          │
│  Verified Physical Data │   Image-Derived Feature │    User-Query Climate   │
│       Sonification      │       Sonification      │         Melody          │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • NASA GMAO GEOS-FP     │ • NASA EOSDIS GIBS      │ • NASA POWER API        │
│   (2m Air Temperature)  │   WMTS Satellite Tiles  │   (LaRC Meteorology)    │
│ • NOAA GML / GHG Center │ • Per-pixel RGB optical │ • User-selected lat/lon │
│   (Atmospheric CO₂)     │   luminance scanline    │   geographic point      │
│ • NASA GSFC Altimetry   │ • Brightness to audio   │ • 40-year historical    │
│   (Sea Level Variation) │   contrast translation  │   monthly trends        │
│ • NASA GISS GISTEMP v4  │ • Explicitly labeled as │ • Parameter-to-pitch    │
│ • NSIDC Arctic Sea Ice  │   visual proxy rather   │   pentatonic scale      │
│ • NASA JPL ECCO2 Ocean  │   than measurement grids│                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

- **Mode A (EIC Physical Data Sonification):** Direct 1-to-1 deterministic translation from verified numerical physical units (°C, ppm, mm, million km²) into calibrated audio frequencies (Hz), timbre, velocity, and stereo pan.
- **Mode B (GIBS Image-Derived Feature Sonification):** Canvas scanline sonification across raster imagery tiles. It sonifies digital image contrast (optical RGB brightness), explicitly labeled as visual feature extraction rather than numerical grid arrays.
- **Mode C (NASA POWER Point Climate Melody):** On-demand localized meteorological time-series queried via the NASA POWER API at a specific user click coordinate.

---

## 5. Scientifically-Testable Sonification Calibration Layer

Every acoustic parameter in Mode A and Mode B follows documented mathematical transfer functions:

| Dataset / Pipeline | Physical Parameter | Formula Domain & Full Pitch | Observed Historical Range & Pitch | Mathematical Transfer Function | Contextual Globe Layer |
|---|---|---|---|---|---|
| **NASA GEOS-FP Temp** | 2m Air Temperature ($T$) | $[12.0, 17.5]\text{ }^\circ\text{C}$<br>$\to [200.0, 800.0]\text{ Hz}$ | $[12.4, 17.1]\text{ }^\circ\text{C}$<br>$\to [243.6, 756.4]\text{ Hz}$ | $f = 200.0 + \text{clamp}\left(\frac{T - 12.0}{5.5}, 0, 1\right) \times 600.0$ | MODIS Land Surface Temp Day (contextual skin temp proxy) |
| **ECCO2 Potential Temp** | Sea Surface Potential Temp ($SST$) | $[15.5, 17.5]\text{ }^\circ\text{C}$<br>$\to [160.0, 480.0]\text{ Hz}$ | $[15.8, 17.3]\text{ }^\circ\text{C}$<br>$\to [208.0, 448.0]\text{ Hz}$ | $f = 160.0 + \text{clamp}\left(\frac{SST - 15.5}{2.0}, 0, 1\right) \times 320.0$ | GHRSST MUR Sea Surface Temp (1km SST thermal proxy) |
| **Atmospheric $\text{CO}_2$** | Carbon Dioxide Mole Fraction | $[330.0, 430.0]\text{ ppm}$<br>$\to [130.8, 370.0]\text{ Hz}$ | $[338.76, 424.61]\text{ ppm}$<br>$\to [143.3, 349.8]\text{ Hz}$ | $f = 130.81 \times 2^{\text{clamp}\left(\frac{CO_2 - 330}{100}, 0, 1.2\right) \times 1.5}$ | Suomi-NPP VIIRS True Color (photosynthetic biome proxy) |
| **Global Sea Level** | Altimetry GMSL Rise ($SL$) | $[0.0, 120.0]\text{ mm}$<br>$\to [110.0, 311.1]\text{ Hz}$ | $[0.0, 105.8]\text{ mm}$<br>$\to [110.0, 275.1]\text{ Hz}$ | $f = 110.0 \times 2^{\text{clamp}\left(\frac{SL}{120}, 0, 1.2\right) \times 1.5}$ | GHRSST MUR SST (thermal expansion oceanic proxy) |
| **Temperature Anomaly** | GISTEMP v4 Anomaly ($\Delta T$) | $[0.0, 1.5]\text{ }^\circ\text{C}$<br>$\to [164.8, 466.2]\text{ Hz}$ | $[0.12, 1.28]\text{ }^\circ\text{C}$<br>$\to [179.1, 400.2]\text{ Hz}$ | $f = 164.81 \times 2^{\text{clamp}\left(\frac{\Delta T}{1.5}, 0, 1.2\right) \times 1.5}$ | MODIS LST Day (absolute daytime skin temp proxy) |
| **Arctic Sea Ice** | September Min Extent ($SIE$) | $[8.0, 3.0]\text{ M km}^2$<br>$\to [220.0, 622.3]\text{ Hz}$ | $[7.67, 3.39]\text{ M km}^2$<br>$\to [235.6, 573.8]\text{ Hz}$ | $f = 220.0 \times 2^{\text{clamp}\left(\frac{8.0 - SIE}{5.0}, 0, 1.2\right) \times 1.5}$ | MODIS NDSI Snow Cover (polar reflectance proxy) |
| **GIBS Raster Scanline** | Digital Luminance ($L$) | $[0, 255]$ (8-bit)<br>$\to [120.0, 720.0]\text{ Hz}$ | $[0, 255]$ (8-bit)<br>$\to [120.0, 720.0]\text{ Hz}$ | $f = 120.0 + \text{clamp}\left(\frac{L}{255}, 0, 1\right) \times 600.0$ | Mode B: Direct pixel optical feature sonification |

---

## 6. Key Usability & Accessibility Features

1. **Dockable Jukebox Player (`🗕 Dock`)**:
   - Allows users to collapse the card into a compact bottom player so the 3D digital globe and satellite layers remain completely visible during sonification playback.
2. **Interactive Sparkline Scrubber**:
   - Scrub time series continuously via mouse drag or mobile touch gestures with instant acoustic response.
3. **Dual-Metric Comparison & Pearson Correlation**:
   - Compare any two planetary metrics simultaneously with dual-voice audio rendering (bell timbre in left ear, water timbre in right ear) and mathematically rigorous Pearson correlation $r$ computed on overlapping timeframes.
4. **Accessible Screen Reader Support**:
   - Full semantic data table (`<table id="eic-data-table">`) for non-visual quantitative evaluation.
   - Dynamic `#live` ARIA announcements for frame transitions.
5. **Complete Keyboard Controls**:
   - <kbd>E</kbd>: Open/close EIC Jukebox dialog.
   - <kbd>Space</kbd> or <kbd>K</kbd>: Play / pause timeline.
   - <kbd>←</kbd> / <kbd>→</kbd>: Step backward / forward by one frame.
   - <kbd>M</kbd>: Toggle audio mute.
   - <kbd>Home</kbd> / <kbd>End</kbd>: Jump to timeline start / end.
   - <kbd>Esc</kbd>: Close modal / return to globe navigation.

---

## 7. Local Setup & Testing

### Installation & Run
```bash
# Clone repository
git clone https://github.com/Omtripathi1004/earth-information-jukebox.git
cd earth-information-jukebox

# Install Python backend dependencies
pip install -r requirements.txt

# Run backend development server
python -m backend.app.main
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

### Automated Test Suites

```bash
# 1. Run Python backend unit & integration tests (42 tests)
python -m pytest -v tests/test_backend.py

# 2. Run frontend schema, transfer function & UI assertions (706 assertions)
node tests/test_frontend.js

# 3. Run real in-browser Web Audio RMS signal tests in headless Chromium (19 tests)
node tests/test_browser_audio.js
```

---

## 8. Citations & References

- **NASA Earth Information Center (EIC)**: [earth.gov](https://earth.gov/)
- **U.S. Greenhouse Gas Center**: [earth.gov/ghgcenter](https://earth.gov/ghgcenter)
- **NASA Sea Level Explorer**: [earth.gov/sealevel](https://earth.gov/sealevel)
- **NASA Goddard Institute for Space Studies (GISS GISTEMP v4)**: [data.giss.nasa.gov/gistemp](https://data.giss.nasa.gov/gistemp/)
- **NASA Global Modeling and Assimilation Office (GMAO GEOS-FP)**: [gmao.gsfc.nasa.gov](https://gmao.gsfc.nasa.gov/)
- **National Snow and Ice Data Center (NSIDC)**: [nsidc.org](https://nsidc.org/)
- **NASA EOSDIS GIBS**: [earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs](https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs)
- **NASA POWER Project**: [power.larc.nasa.gov](https://power.larc.nasa.gov/)
- **NASA JPL ECCO2 Ocean State Estimate**: [ecco-group.org](https://www.ecco-group.org/)
- **W3C Web Audio API Specification**: [webaudio.github.io/web-audio-api](https://webaudio.github.io/web-audio-api/)
