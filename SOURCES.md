# Sources, Licences, and Scientific Data Attribution

> **Legal Disclaimer:** The Earth Information Jukebox is an independent prototype developed for the NASA Space Apps Challenge 2026. It is not an official NASA product, and is not endorsed by or affiliated with the National Aeronautics and Space Administration (NASA), NOAA, or any partner agency. In accordance with 14 CFR 1221, official NASA insignia (the "meatball" or "worm" logos) are not used as project branding.

---

## 1. Scientific Data Sources & Provenance

| Dataset / Pipeline | Sponsoring Agency & Portal | Scientific Description | Coverage & Resolution | Pipeline Classification |
|---|---|---|---|---|
| **NASA GEOS-FP Near-Surface Air Temperature (2m Air Temp)** | NASA GSFC / Global Modeling and Assimilation Office (GMAO) via [earth.gov](https://earth.gov/) | Global near-surface air temperature model assimilation tracking seasonal heating cycles and temperature extremes. Baseline mean ~14.0 °C maps to 418 Hz. | Global coverage, 0.25° × 0.3125° grid, monthly climatology Jan–Dec 2024. | **Mode A:** Verified Numerical Physical Sonification |
| **ECCO2 Sea Surface Potential Temperature** | NASA JPL / ECCO2 Consortium via [earth.gov](https://earth.gov/) | High-resolution global ocean circulation model near-surface potential temperature (THETA 0–5m) area-averaged across global ocean basin. Sonified via calibrated aquatic synthesizer voice reflecting thermal energy. | Global oceans, 0.25° grid, seasonal monthly cycle Jan–Dec 2024. | **Mode A:** Verified Numerical Physical Sonification |
| **Atmospheric Carbon Dioxide ($\text{CO}_2$)** | NOAA Global Monitoring Laboratory (GML) & NASA Earth Information Center GHG Center via [earth.gov/ghgcenter](https://earth.gov/ghgcenter) | Annual atmospheric carbon dioxide mole fraction in dry air recorded at the Mauna Loa Baseline Observatory in Hawaii (424.61 ppm annual mean in 2024 via NOAA Climate.gov, rounded to 424.6 ppm in the fixed 1980–2024 reference series; global marine boundary layer average is 422.8 ppm). Pre-industrial baseline 280 ppm. | In-situ Mauna Loa reference time series, annual averages 1980–2024 (ppm). | **Mode A:** Verified Numerical Physical Sonification |
| **Global Mean Sea Level Variation** | NASA GSFC Altimetry & CNES via [earth.gov/sealevel Resource #332](https://earth.gov/sealevel/resources/332/global-mean-sea-level-1993-2024/) & [NASA SVS #5516](https://svs.gsfc.nasa.gov/5516) | Sea level anomaly derived from multi-mission satellite radar altimeters (TOPEX/Poseidon, Jason-1/2/3, Sentinel-6 Michael Freilich). Referenced to 1993 baseline = 0.0 mm. Official visual animation distributed as continuous 4K video by Mark SubbaRao (NASA SVS #5516); frame sequence integration is blocked due to lack of decomposed annual frames. | Global ocean mean, annual variations 1993–2024 (mm). | **Mode A:** Verified Numerical Physical Sonification |
| **Global Surface Temperature Anomaly (GISTEMP v4)** | NASA Goddard Institute for Space Studies (GISS) via [earth.gov](https://earth.gov/) | Land-ocean temperature anomaly relative to the 1951–1980 base period, integrating station networks, buoys, and polar observations. +1.5 °C sonification reference upper limit. | Global annual anomalies 1980–2024 (°C anomaly). | **Mode A:** Verified Numerical Physical Sonification |
| **Arctic Sea Ice Minimum Extent (September)** | National Snow and Ice Data Center (NSIDC) / NASA Earth Observatory via [earth.gov](https://earth.gov/) | Satellite passive microwave radiometry (Nimbus-7, DMSP SSM/I-SSMIS, AMSR-E) monitoring polar cryosphere decline. | Arctic Ocean basin, annual September minimums 1980–2024 (million km²). | **Mode A:** Verified Numerical Physical Sonification |
| **NASA EOSDIS GIBS Satellite Imagery** | NASA Global Imagery Browse Services (GIBS) via [earthdata.nasa.gov](https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs) | Global WMTS raster tile service delivering full-resolution satellite imagery (MODIS Terra/Aqua, Suomi-NPP VIIRS, GHRSST MUR SST). | Global raster tiles, daily updates from 2000 to present. | **Mode B:** Image-Derived Optical Feature Sonification (Scanline) |
| **NASA POWER Project Meteorology** | NASA Langley Research Center (LaRC) POWER via [power.larc.nasa.gov](https://power.larc.nasa.gov/) | Prediction Of Worldwide Energy Resources point climatology derived from GMAO MERRA-2 assimilation for user-queried coordinates. | Point queries at specified lat/lon, 1985–2025 monthly averages. | **Mode C:** User-Query Point Climate Melody |

> **Crucial Distinction:** NASA POWER point meteorological data is accessed for user-queried locations on demand. It is **not** the underlying numerical data array for NASA EIC/GMAO global visualizations. Raster imagery tiles from NASA GIBS provide optical and geophysical context and are sonified in Mode B via luminance feature extraction, not direct grid array measurements.

---

## 2. Geospatial Base Services

| Service | Purpose | Terms & Licence |
|---|---|---|
| OpenStreetMap & Nominatim | Geocoding and geographic point search | ODbL 1.0, © OpenStreetMap contributors |
| OpenFreeMap | Vector tiles for 3D buildings and cartographic labels | Free to use with attribution |
| AWS Terrain Tiles | 3D topographic relief elevation | Open data |
| Mapillary | Street-level photographic exploration | CC BY-SA 4.0, © Mapillary contributors |
| Esri World Imagery | High-resolution aerial base imagery fallback | Esri Terms of Use |
| Cesium ion | Optional 3D photorealistic tiles | Cesium & Google terms (client token with backend environment override via `CESIUM_ION_TOKEN`) |

---

## 3. Open-Source Software & Tooling

| Software / Library | Licence | Role in Architecture |
|---|---|---|
| MapLibre GL JS | BSD-3-Clause | Interactive 3D WebGL digital globe rendering |
| CesiumJS | Apache-2.0 | High-fidelity 3D spatial terrain engine |
| Web Audio API (W3C) | W3C Permissive | In-browser real-time synthesis engine (oscillators, biquad filters, panners) |
| Flask | BSD-3-Clause | Backend microservice and REST API routing |
| NumPy | BSD-3-Clause | Array operations and offline WAV file generation |
| Pillow (PIL) | HPND | Satellite raster tile decoding and luminance extraction |
| Requests | Apache-2.0 | Upstream HTTP client for NASA APIs |
| Tailwind CSS | MIT | Responsive accessibility-focused UI styling |
| Inter, JetBrains Mono, Space Grotesk | SIL OFL 1.1 | Typography |
