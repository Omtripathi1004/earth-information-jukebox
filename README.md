# Earth Information Jukebox

> **NASA Space Apps Challenge 2026: The Earth Information Jukebox**  
> *Scroll down to Earth, then listen. Connecting verified NASA Earth Information Center (EIC) visual frames with real-time, data-driven dynamic sonification.*

[![Live on Vercel](https://img.shields.io/badge/Live%20App-nasa3--pi.vercel.app-0ea5e9?style=flat&logo=vercel)](https://nasa3-pi.vercel.app/)
[![NASA Space Apps](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Challenge-blue?style=flat&logo=nasa)](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20Passing-emerald?style=flat)](tests/test_backend.py)

---

## Challenge Mission & Overview

NASA's **Earth Information Center (EIC)** at [earth.gov](https://earth.gov/) curates high-impact visualizations tracking our living planet across critical themes like global temperature, ocean circulation, greenhouse gases, sea level rise, and the cryosphere. However, relying purely on visual presentation limits accessibility and reach.

**The Earth Information Jukebox** pairs verified EIC visual frames with real-time, physically-calibrated data sonification. Environmental variables (temperature, greenhouse gas concentrations, ocean height anomalies, ice extent) are directly mapped to audible frequencies, timbres, and spatial trajectories—allowing users to **both see and hear Earth’s dynamic systems in lockstep**.

---

## Key Features

1. **Verified NASA Earth Information Center (EIC) Pipeline**:
   - **NASA GEOS-FP Near-Surface Temperature**: 2m air temperature seasonal heating cycle and global heatwaves ($200\text{–}800\text{ Hz}$ continuous bell tone).
   - **ECCO2 Global Ocean Currents & SST**: High-resolution ocean circulation and heat transport ($160\text{–}480\text{ Hz}$ dual-sine ocean pad).
   - **Atmospheric Carbon Dioxide ($\text{CO}_2$)**: NOAA GML & NASA EIC GHG Center annual record ($130\text{–}290\text{ Hz}$ warm harmonic triangle).
   - **Global Mean Sea Level Variation**: Satellite radar altimetry from TOPEX/Poseidon and Jason missions ($110\text{–}265\text{ Hz}$ ascending ocean pad).
   - **Global Surface Temperature Anomaly (GISTEMP v4)**: Land-ocean warming anomaly from NASA GISS ($165\text{–}460\text{ Hz}$ metallic chime).
   - **Arctic Sea Ice Minimum Extent**: NSIDC / NASA satellite microwave ice extent ($220\text{–}550\text{ Hz}$ inverted crystalline alert bell).

2. **Physically-Calibrated Dynamic Sonification**:
   - Every acoustic parameter maps to a real physical measurement—not arbitrary background music.
   - Frequency follows documented mathematical formulas ($f = 200 + \text{norm} \times 600\text{ Hz}$, $f = f_0 \cdot 2^{(\dots)}$).
   - Loudness expands with rates of change (+ppm/year, heatwaves).
   - Stereo panning reflects temporal trajectories from historical baseline (left) to modern record (right).

3. **Multi-Modal Accessibility & Universal Design**:
   - **Dockable Player Bar (`🗕 Dock`)**: Collapse the card into a sleek bottom player so you can inspect the 3D globe and satellite imagery unobstructed while audio plays.
   - **Interactive Sparkline Canvas**: Scrub smoothly through time via mouse drag or mobile touch gestures.
   - **Accessible Numerical Data Table**: Full semantic table (`<table id="eic-data-table">`) for screen reader users and quantitative inspection.
   - **Live Screen Reader Announcements**: Dynamic `#live` ARIA announcements reporting metric values, year, and pitch.
   - **Full Keyboard Navigation**:
     - <kbd>E</kbd>: Open/close EIC Jukebox dialog.
     - <kbd>Space</kbd> or <kbd>K</kbd>: Play / pause timeline playback.
     - <kbd>←</kbd> / <kbd>→</kbd>: Step backward / forward by one year.
     - <kbd>M</kbd>: Toggle audio mute.
     - <kbd>Home</kbd> / <kbd>End</kbd>: Jump to timeline start / end.
     - <kbd>Esc</kbd>: Close modal / return to globe.

4. **Preserved Baseline Capabilities**:
   - Interactive 3D Globe with MapLibre GL.
   - NASA GIBS WMTS raster layers (VIIRS, MODIS TrueColor, LST, SST, Snow Cover, Night Lights).
   - NASA POWER 40-year local climate time-series analysis and melodies.
   - OpenStreetMap 3D extruded buildings and Mapillary ground street-level photography.

---

## 2.5-Minute Demonstration Walkthrough (Judge Demo Script)

> *"Hello, this is our Earth Jukebox project for the NASA Space Apps Challenge.*
>
> 1. ***Select Visualization***: *I click **EIC Jukebox** and select the **NASA GEOS-FP Near-Surface Temperature** dataset. You can see the official NASA earth.gov logo and source confirmation.*
> 2. ***Play Sonification***: *I press **Play Audio Timeline**. The map animates through daily temperature frames (blue is cold, red is hot). At the same time, we hear a clear, continuous tone generated directly by the Web Audio API.*
> 3. ***Observe Data-Driven Sound***: *Notice as the timeline enters summer heatwaves, the pitch of the tone rises—higher pitch directly represents warmer temperature (scaling from 200 Hz up to 800 Hz). The on-screen HUD displays the exact temperature (e.g. 17.1 °C) and frequency.*
> 4. ***Interactive Scrubbing***: *I scrub the timeline back to January—the tone immediately updates to a lower frequency (210 Hz), reflecting the colder winter temperature.*
> 5. ***Synchronized Pause & Stop***: *I pause and stop the audio—the sound halts in exact lockstep, proving it is synchronized with the data rather than a prerecorded loop.*
> 6. ***Dockable Mode & Multi-Sensory Accessibility***: *I click **Dock** to minimize the player into a bottom bar, letting us freely rotate the 3D globe. All along, captions, visible frequency scales, and a full numerical data table make the science accessible to both sighted and visually impaired users.*
>
> *In summary, you can both see and hear Earth’s dynamic systems through this tool, fulfilling the NASA challenge for an Earth Information Jukebox."*

---

## Technical Architecture

```
├── assets/
│   ├── js/
│   │   ├── eic.js          # EIC Adapter, DataPrep, EICSonifier, PlaybackState, EICUI
│   │   ├── app.js          # MapLibre 3D globe, GIBS layers, NASA POWER climate
│   │   ├── patch.js        # Event guards, modal shortcuts, and Cesium memory guards
│   │   └── enhance.js      # Layout observers, ARIA live region announcements
│   └── css/
│       └── style.css       # Tailwind & glassmorphism styling
├── backend/
│   └── app/
│       ├── main.py         # Flask REST API router & static server
│       ├── eic_data.py     # Verified EIC thematic datasets & schema validation
│       ├── nasa.py         # NASA GIBS & POWER upstream clients with TTL cache
│       └── sonify.py       # NumPy audio synthesis & WAV generation engine
├── api/
│   └── index.py            # Vercel serverless WSGI entry point
├── tests/
│   └── test_backend.py     # 13 automated unit & API test cases (100% passing)
├── index.html              # Core application entry point
├── vercel.json             # Vercel serverless routing configuration
└── requirements.txt        # Backend dependencies
```

---

## Local Setup & Development

### Prerequisites
- Python 3.10+
- Modern Web Browser (Chrome, Firefox, Edge, Safari)

### Installation
```bash
# Clone the repository
git clone https://github.com/Omtripathi1004/earth-information-jukebox.git
cd earth-information-jukebox

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Run backend development server
python -m backend.app.main
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

### Running Automated Tests
```bash
pytest -v tests/test_backend.py
```

---

## Sources, Citations & References

- **NASA Earth Information Center (EIC)**: [earth.gov](https://earth.gov/)
- **U.S. Greenhouse Gas Center**: [earth.gov/ghgcenter](https://earth.gov/ghgcenter)
- **NASA Sea Level Explorer**: [earth.gov/sealevel](https://earth.gov/sealevel)
- **NASA Goddard Institute for Space Studies (GISS GISTEMP v4)**: [data.giss.nasa.gov/gistemp](https://data.giss.nasa.gov/gistemp/)
- **NASA Global Modeling and Assimilation Office (GMAO / GEOS-FP)**: [gmao.gsfc.nasa.gov](https://gmao.gsfc.nasa.gov/)
- **National Snow and Ice Data Center (NSIDC)**: [nsidc.org](https://nsidc.org/)
- **NASA EOSDIS GIBS**: [earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs](https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs)
- **NASA POWER Project**: [power.larc.nasa.gov](https://power.larc.nasa.gov/)
- **W3C Web Audio API Specification**: [webaudio.github.io/web-audio-api](https://webaudio.github.io/web-audio-api/)
