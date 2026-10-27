# Earth Information Jukebox

> **NASA Space Apps Challenge 2026: The Earth Information Jukebox**  
> *Scroll down to Earth, then listen. Connecting verified NASA Earth Information Center (EIC) visual frames with real-time, data-driven dynamic sonification.*

[![Live on Vercel](https://img.shields.io/badge/Live%20App-nasa3--pi.vercel.app-0ea5e9?style=flat&logo=vercel)](https://nasa3-pi.vercel.app/)
[![NASA Space Apps](https://img.shields.io/badge/NASA%20Space%20Apps-2026%20Challenge-blue?style=flat)](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/)
[![Tests](https://img.shields.io/badge/Tests-14%2F14%20Passing-emerald?style=flat)](tests/test_backend.py)

---

> **Important Scientific & Legal Notice (14 CFR 1221 Compliance):**  
> The Earth Information Jukebox is an independent prototype developed for the NASA Space Apps Challenge 2026. This application utilizes open scientific data provided by NASA, NOAA, and partner agencies, but is not officially endorsed by or affiliated with NASA. Official NASA insignia ("meatball" or "worm" logos) are not used as project branding.

---

## 1. Challenge Mission & Scientific Distinction

NASA's **Earth Information Center (EIC)** at [earth.gov](https://earth.gov/) curates high-impact visualizations tracking Earth's vital signs across critical themes: global temperature, ocean circulation, greenhouse gases, sea level rise, and the cryosphere.

To maintain strict scientific integrity, this application distinguishes between three explicit sonification pipelines:

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
│ • NASA GISS GISTEMP v4  │ • NOT direct physical   │ • Parameter-to-pitch    │
│ • NSIDC Arctic Sea Ice  │   measurement grids     │   pentatonic scale      │
│ • NASA JPL ECCO2 Ocean  │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

- **Mode A (EIC Physical Data Sonification):** Direct 1-to-1 deterministic translation from verified numerical physical units (°C, ppm, mm, million km²) into calibrated audio frequencies (Hz), timbre, velocity, and stereo pan.
- **Mode B (GIBS Image-Derived Feature Sonification):** Canvas scanline sonification across raster imagery tiles. It sonifies digital image contrast (optical RGB brightness), explicitly labeled as visual feature extraction rather than numerical grid arrays.
- **Mode C (NASA POWER Point Climate Melody):** On-demand localized meteorological time-series queried via the NASA POWER API at a specific user click coordinate.

---

## 2. Scientifically-Testable Sonification Calibration Layer

Every acoustic parameter in Mode A and Mode B follows documented mathematical transfer functions:

| Dataset / Pipeline | Physical Parameter | Range $[min, max]$ | Formula / Transfer Function | Audio Output Dimension | 3 Representative Test Cases |
|---|---|---|---|---|---|
| **NASA GEOS-FP Temp** | 2m Air Temperature ($T$) | $[12.0, 17.5]\text{ }^\circ\text{C}$ | $f = 200.0 + \text{clamp}\left(\frac{T - 12.0}{5.5}, 0, 1\right) \times 600.0$ | Fundamental freq (Hz), warm bell chime | • $12.0\text{ }^\circ\text{C} \to 200.00\text{ Hz}$<br>• $14.75\text{ }^\circ\text{C} \to 500.00\text{ Hz}$<br>• $17.5\text{ }^\circ\text{C} \to 800.00\text{ Hz}$ |
| **ECCO2 Ocean Currents** | Sea Surface Temp ($SST$) | $[15.5, 17.5]\text{ }^\circ\text{C}$ | $f = 160.0 + \text{clamp}\left(\frac{SST - 15.5}{2.0}, 0, 1\right) \times 320.0$ | Resonant dual-sine water pad, chorused detune | • $15.5\text{ }^\circ\text{C} \to 160.00\text{ Hz}$<br>• $16.5\text{ }^\circ\text{C} \to 320.00\text{ Hz}$<br>• $17.5\text{ }^\circ\text{C} \to 480.00\text{ Hz}$ |
| **Atmospheric $\text{CO}_2$** | Carbon Dioxide Mole Fraction | $[330.0, 430.0]\text{ ppm}$ | $f = 130.81 \times 2^{\text{clamp}\left(\frac{CO_2 - 330}{100}, 0, 1.2\right) \times 1.5}$ | Harmonic triangle voice, velocity $\propto \frac{dC}{dt}$ | • $330.0\text{ ppm} \to 130.81\text{ Hz}$<br>• $380.0\text{ ppm} \to 220.00\text{ Hz}$<br>• $430.0\text{ ppm} \to 369.99\text{ Hz}$ |
| **Global Sea Level** | Altimetry Sea Level Rise ($SL$) | $[0.0, 120.0]\text{ mm}$ | $f = 110.0 \times 2^{\text{clamp}\left(\frac{SL}{120}, 0, 1.2\right) \times 1.5}$ | Deep ocean sine pad, ascending foundation | • $0.0\text{ mm} \to 110.00\text{ Hz}$<br>• $60.0\text{ mm} \to 185.02\text{ Hz}$<br>• $120.0\text{ mm} \to 311.13\text{ Hz}$ |
| **Temperature Anomaly** | GISTEMP v4 Anomaly ($\Delta T$) | $[0.0, 1.5]\text{ }^\circ\text{C}$ | $f = 164.81 \times 2^{\text{clamp}\left(\frac{\Delta T}{1.5}, 0, 1.2\right) \times 1.5}$ | Additive metallic bell, bright alert register | • $0.0\text{ }^\circ\text{C} \to 164.81\text{ Hz}$<br>• $0.75\text{ }^\circ\text{C} \to 277.19\text{ Hz}$<br>• $1.5\text{ }^\circ\text{C} \to 466.15\text{ Hz}$ |
| **Arctic Sea Ice** | September Minimum Extent ($SIE$) | $[3.0, 8.0]\text{ M km}^2$ | $f = 220.0 \times 2^{\text{clamp}\left(\frac{8.0 - SIE}{5.0}, 0, 1.2\right) \times 1.5}$ | Inverted crystalline bell (loss raises pitch) | • $8.0\text{ M km}^2 \to 220.00\text{ Hz}$<br>• $5.5\text{ M km}^2 \to 370.04\text{ Hz}$<br>• $3.0\text{ M km}^2 \to 622.25\text{ Hz}$ |
| **GIBS Raster Scanline** | Digital Luminance ($L$) | $[0, 255]$ (8-bit) | $f = 120.0 + \text{clamp}\left(\frac{L}{255}, 0, 1\right) \times 600.0$ | Multi-oscillator harmonic voice (Mode B) | • $L = 0 \to 120.00\text{ Hz}$<br>• $L = 127.5 \to 420.00\text{ Hz}$<br>• $L = 255 \to 720.00\text{ Hz}$ |

---

## 3. Key Usability & Accessibility Features

1. **Dockable Jukebox Player (`🗕 Dock`)**:
   - Allows users to collapse the card into a compact bottom player so the 3D digital globe and satellite layers remain completely visible during sonification playback.
2. **Interactive Sparkline Scrubber**:
   - Scrub time series continuously via mouse drag or mobile touch gestures.
3. **Accessible Screen Reader Support**:
   - Full semantic data table (`<table id="eic-data-table">`) for non-visual quantitative evaluation.
   - Dynamic `#live` ARIA announcements for frame transitions.
4. **Complete Keyboard Controls**:
   - <kbd>E</kbd>: Open/close EIC Jukebox dialog.
   - <kbd>Space</kbd> or <kbd>K</kbd>: Play / pause timeline.
   - <kbd>←</kbd> / <kbd>→</kbd>: Step backward / forward by one frame.
   - <kbd>M</kbd>: Toggle audio mute.
   - <kbd>Home</kbd> / <kbd>End</kbd>: Jump to timeline start / end.
   - <kbd>Esc</kbd>: Close modal / return to globe navigation.

---

## 4. 2.5-Minute Demonstration Walkthrough (Judge Demo Script)

> *"Welcome! This is our Earth Information Jukebox demonstration for the NASA Space Apps Challenge 2026.*
>
> 1. ***Select Visualization***: *Click **EIC Jukebox** (<kbd>E</kbd>) and select **NASA GEOS-FP Near-Surface Temperature**.*
> 2. ***Provenance & Camera Fly-To***: *Notice the data source attribution (NASA GSFC / GMAO & earth.gov). Click **🛰️ View on Globe** to fly to the global thermal observation perspective.*
> 3. ***Play Dynamic Sonification***: *Press **Play Audio Timeline**. The timeline cycles through seasonal temperature frames while the Web Audio API synthesizes a real-time tone.*
> 4. ***Verify Sound-to-Data Coupling***: *As temperatures rise during northern hemisphere summer heatwaves, the acoustic frequency ascends directly from 200 Hz up to 800 Hz in exact alignment with the physical measurements displayed on the HUD.*
> 5. ***Scrub & Halt***: *Drag the sparkline scrubber backward to January—the pitch immediately drops to 210 Hz. Press **Stop**—audio halts instantly without audio node leaks.*
> 6. ***Dockable Mode & Screen Reader Access***: *Click **Dock** to minimize the player into the bottom bar for unobstructed globe navigation, and inspect the semantic data table below for full screen-reader compliance."*

---

## 5. Local Setup & Testing

### Installation & Run
```bash
# Clone repository
git clone https://github.com/Omtripathi1004/earth-information-jukebox.git
cd earth-information-jukebox

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Run backend development server
python -m backend.app.main
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

### Automated Test Suite
```bash
pytest -v tests/test_backend.py
```
*Executes all 14 unit and integration tests, validating EIC REST endpoints, data preparation bounds, audio WAV generation, upstream error handling, and deterministic mathematical sonification mappings.*

---

## 6. Citations & References

- **NASA Earth Information Center (EIC)**: [earth.gov](https://earth.gov/)
- **U.S. Greenhouse Gas Center**: [earth.gov/ghgcenter](https://earth.gov/ghgcenter)
- **NASA Sea Level Explorer**: [earth.gov/sealevel](https://earth.gov/sealevel)
- **NASA Goddard Institute for Space Studies (GISS GISTEMP v4)**: [data.giss.nasa.gov/gistemp](https://data.giss.nasa.gov/gistemp/)
- **NASA Global Modeling and Assimilation Office (GMAO GEOS-FP)**: [gmao.gsfc.nasa.gov](https://gmao.gsfc.nasa.gov/)
- **National Snow and Ice Data Center (NSIDC)**: [nsidc.org](https://nsidc.org/)
- **NASA EOSDIS GIBS**: [earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs](https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs)
- **NASA POWER Project**: [power.larc.nasa.gov](https://power.larc.nasa.gov/)
- **W3C Web Audio API Specification**: [webaudio.github.io/web-audio-api](https://webaudio.github.io/web-audio-api/)
