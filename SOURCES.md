# Sources, licences and credits

The Earth Information Jukebox is an independent prototype made for the NASA Space Apps Challenge. It is not an official NASA product.

## Data and services
| Source | Used for | Terms |
|---|---|---|
| NASA Earth Information Center (EIC) & NOAA GML | Thematic planetary datasets: Atmospheric CO₂ (`earth.gov/ghgcenter`), Sea Level Rise (`earth.gov/sealevel`), Global Surface Temperature Anomaly (GISTEMP v4), Arctic Sea Ice Extent | Open data (NASA / NOAA / US Federal open science) |
| NASA EOSDIS GIBS | Satellite imagery and data layers (true colour, land temperature, aerosol, sea surface temperature, snow cover, night lights) | NASA open data |
| NASA POWER | Local temperature and rain, 1985 to 2025 | NASA open data |
| OpenStreetMap and Nominatim | Place search, building shapes, labels | ODbL 1.0, © OpenStreetMap contributors |
| OpenFreeMap | Vector tiles for buildings and labels | OpenStreetMap data, free to use with attribution |
| AWS Terrain Tiles | Ground height | Open data, see the terrain tiles attribution page |
| Mapillary | Street-level photos | CC BY-SA 4.0, © Mapillary contributors |
| Esri World Imagery | Close-up base imagery | Esri terms, not open source |
| Google Photorealistic 3D Tiles via Cesium ion | Optional photoreal 3D view | Google and Cesium terms, not open source, needs a free token |

## Software
| Package | Licence |
|---|---|
| MapLibre GL JS | BSD-3-Clause |
| CesiumJS | Apache-2.0 |
| Tailwind CSS | MIT |
| Flask | BSD-3-Clause |
| NumPy | BSD-3-Clause |
| Pillow | HPND |
| Requests | Apache-2.0 |
| Inter, JetBrains Mono, Space Grotesk (Google Fonts) | SIL OFL 1.1 |

## Notes
- This project was built with help from AI coding tools (Claude, by Anthropic).
- Tokens can be set in a local `.env` file (copied from `.env.example`) or as Vercel environment variables. No secrets are stored in this repository.
