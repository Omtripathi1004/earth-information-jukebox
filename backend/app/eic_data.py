"""NASA Earth Information Center (EIC) verified datasets and metadata.

Source provenance:
- NASA GEOS-FP Near-Surface Air Temperature: NASA GMAO & Earth Information Center (earth.gov)
- ECCO2 Ocean Currents & SST: NASA JPL ECCO2 & Earth Information Center (earth.gov)
- Atmospheric Carbon Dioxide: NOAA Global Monitoring Laboratory (GML) & NASA EIC GHG Center (earth.gov/ghgcenter)
- Global Mean Sea Level: NASA GSFC Altimetry / Sea Level Explorer (earth.gov/sealevel)
- Global Surface Temperature Anomaly: NASA Goddard Institute for Space Studies (GISS GISTEMP v4, earth.gov)
- Arctic Sea Ice Extent: NSIDC / NASA Earth Observatory Cryosphere Theme (earth.gov)
"""
from __future__ import annotations

DATASETS = {
    "geos_fp_temp": {
        "id": "geos_fp_temp",
        "title": "NASA GEOS-FP Near-Surface Temperature (2m Air Temp)",
        "theme": "Global Climate & Atmosphere",
        "agency": "NASA GSFC / GMAO & Earth Information Center (earth.gov)",
        "portal_url": "https://earth.gov/",
        "data_identifier": "GEOS-FP 2D Near-Surface Meteorology (inst1_2d_asm_Nx: T2M)",
        "authoritative_url": "https://gmao.gsfc.nasa.gov/GMAO_products/",
        "retrieval_date": "2024 Climatological Cycle (Verified 2024-12)",
        "variable_name": "T2M (2-meter air temperature)",
        "units": "°C",
        "unit_name": "Degrees Celsius",
        "baseline_desc": "Global baseline temperature ~14.0 °C",
        "baseline_val": 14.0,
        "historical_period": "Jan 2024 – Dec 2024 (Monthly Seasonal Cycle)",
        "transformation_notes": "Converted from Kelvin (K) to Celsius (°C) via T(°C) = T(K) - 273.15. Area-weighted global monthly mean.",
        "description": "Daily and monthly global near-surface air temperature from NASA Goddard Earth Observing System Forward Processing (GEOS-FP), tracking global seasonal heating, heatwaves, and cold snaps.",
        "years": [
            "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
            "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024"
        ],
        "values": [
            12.4, 12.8, 13.5, 14.4, 15.3, 16.2, 17.1, 16.8, 15.9, 14.8, 13.6, 12.6
        ],
        "camera": {"lat": 28.0, "lon": 10.0, "zoom": 2.5, "name": "Global Thermal Earth View"},
        "suggested_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "contextual_globe_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "contextual_layer_title": "MODIS Land Surface Temperature (Daytime Skin Temp)",
        "contextual_layer_note": "Contextual Earth observation proxy. The 3D globe displays satellite land skin temperature, which provides geographic surface thermal context but is distinct from the GMAO GEOS-FP 2m atmospheric air temperature grid.",
        "sonification": {
            "voice": "bell",
            "voice_desc": "Continuous tone scaling from 200 Hz (winter/cold) to 800 Hz (summer peak heatwave)",
            "voiceDesc": "Continuous tone scaling from 200 Hz (winter/cold) to 800 Hz (summer peak heatwave)",
            "frequency_formula": "f = 200.0 + clamp((Temp - 12.0) / 5.5, 0.0, 1.0) * (800.0 - 200.0)",
            "formula": "f = 200.0 + clamp((Temp - 12.0) / 5.5, 0.0, 1.0) * (800.0 - 200.0)",
            "timbre": "Warm metallic chime with harmonic overtones",
            "pitch_range_hz": "200 Hz – 800 Hz (calibration) · 244 Hz – 756 Hz (observed 2024)",
            "pitchRange": "200 Hz – 800 Hz (calibration) · 244 Hz – 756 Hz (observed 2024)",
            "full_calibration_range_hz": [200.0, 800.0],
            "observed_historical_range_hz": [243.64, 756.36],
            "dynamics": "Pitch proportional to temperature; velocity scales from 0.12 (cold) to 0.24 (heatwave)",
            "spatial": "Pans temporally along the 12-month calendar trajectory (-0.8 in Jan to +0.8 in Dec)"
        },
        "limitations": "Model grid resolution (0.25° x 0.3125°) averages microclimate variations in steep mountainous terrain and narrow coastal strips."
    },
    "ecco2_ocean_currents": {
        "id": "ecco2_ocean_currents",
        "title": "ECCO2 Sea Surface Potential Temperature",
        "theme": "Ocean Circulation & Energy",
        "agency": "NASA JPL / ECCO2 & Earth Information Center (earth.gov)",
        "portal_url": "https://earth.gov/",
        "data_identifier": "ECCO2 Cube92 High-Resolution Sea Surface Potential Temperature",
        "authoritative_url": "https://ecco.jpl.nasa.gov/",
        "retrieval_date": "2024 Climatological Cycle (Verified 2024-12)",
        "variable_name": "THETA (Surface potential temperature 0–5m)",
        "units": "°C",
        "unit_name": "Degrees Celsius",
        "baseline_desc": "Global mean SST ~16.1 °C",
        "baseline_val": 16.1,
        "historical_period": "Jan 2024 – Dec 2024 (Monthly Seasonal Cycle)",
        "transformation_notes": "Synthesized ocean state estimate. Near-surface layer potential temperature area-averaged across global ocean basin.",
        "description": "High-resolution sea surface potential temperature (0–5m) area-averaged across global oceans from the Estimating the Circulation and Climate of the Ocean (ECCO2) state estimate, tracking seasonal thermal storage.",
        "years": [
            "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
            "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024"
        ],
        "values": [
            15.8, 15.9, 16.1, 16.4, 16.7, 17.0, 17.3, 17.2, 16.9, 16.6, 16.2, 15.9
        ],
        "camera": {"lat": 25.0, "lon": -60.0, "zoom": 3.0, "name": "North Atlantic Ocean Gyre & Gulf Stream"},
        "suggested_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature",
        "contextual_globe_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature",
        "contextual_layer_title": "GHRSST MUR Sea Surface Temperature (1km High-Res SST)",
        "contextual_layer_note": "Contextual satellite thermal proxy. The 3D globe displays high-resolution satellite SST imagery for oceanic orientation, while ECCO2 represents global 3D ocean dynamic current simulation models.",
        "sonification": {
            "voice": "water",
            "voice_desc": "Resonant dual-sine ocean pad reflecting ocean heat capacity and surface thermal energy",
            "voiceDesc": "Resonant dual-sine ocean pad reflecting ocean heat capacity and surface thermal energy",
            "frequency_formula": "f = 160.0 + clamp((SST - 15.5) / 2.0, 0.0, 1.0) * (480.0 - 160.0)",
            "formula": "f = 160.0 + clamp((SST - 15.5) / 2.0, 0.0, 1.0) * (480.0 - 160.0)",
            "timbre": "Deep sine wave pad with slow chorused detune",
            "pitch_range_hz": "160 Hz – 480 Hz (calibration) · 208 Hz – 448 Hz (observed 2024)",
            "pitchRange": "160 Hz – 480 Hz (calibration) · 208 Hz – 448 Hz (observed 2024)",
            "full_calibration_range_hz": [160.0, 480.0],
            "observed_historical_range_hz": [208.0, 448.0],
            "dynamics": "Volume scales with thermal energy magnitude (0.14–0.24); pan follows 12-month calendar trajectory (-0.8 in Jan to +0.8 in Dec)",
            "spatial": "Pans temporally along the 12-month calendar trajectory (-0.8 in Jan to +0.8 in Dec)"
        },
        "limitations": "Sub-mesoscale eddies smaller than 10 km are parameterized rather than fully resolved in global simulations."
    },
    "co2": {
        "id": "co2",
        "title": "Atmospheric Carbon Dioxide (CO₂) — NOAA GML Mauna Loa Record",
        "theme": "Greenhouse Gases",
        "agency": "NOAA GML / NASA Earth Information Center GHG Center",
        "portal_url": "https://earth.gov/ghgcenter",
        "data_identifier": "NOAA GML Mauna Loa Atmospheric CO2 In-Situ Record (2024: 424.61 ppm via NOAA Climate.gov; marine surface global mean 422.8 ppm)",
        "authoritative_url": "https://gml.noaa.gov/ccgg/trends/",
        "retrieval_date": "November 2024 Release (Verified 1980–2024 Series)",
        "variable_name": "XCO2 (Atmospheric CO2 dry air mole fraction)",
        "units": "ppm",
        "unit_name": "Parts per million",
        "baseline_desc": "Pre-industrial atmospheric baseline ~280 ppm",
        "baseline_val": 280,
        "historical_period": "1980–2024 (Fixed Annual Reference Window)",
        "transformation_notes": "Annual in-situ atmospheric CO2 dry air mole fractions from NOAA GML Mauna Loa Baseline Observatory, Hawaii (424.61 ppm in 2024, rounded to 424.6 ppm; NOAA Climate.gov checkpoint). Note: The globally averaged marine boundary layer surface mean for 2024 is 422.8 ppm. Pre-industrial reference: 280 ppm.",
        "description": "Annual mean atmospheric carbon dioxide concentration recorded at NOAA Global Monitoring Laboratory's Mauna Loa Baseline Observatory in Hawaii (424.61 ppm in 2024; NOAA Climate.gov checkpoint; global marine boundary average is 422.8 ppm). Serves as the longest continuous in-situ record of atmospheric CO2.",
        "years": list(range(1980, 2025)),
        "values": [
            338.8, 340.1, 341.2, 342.9, 344.4, 345.9, 347.2, 348.9, 351.5, 352.9,
            354.2, 355.6, 356.4, 357.1, 358.8, 360.8, 362.6, 363.7, 366.7, 368.4,
            369.5, 371.1, 373.3, 375.8, 377.5, 379.8, 381.9, 383.8, 385.6, 387.4,
            389.9, 391.7, 393.9, 396.5, 398.7, 401.0, 404.2, 406.8, 408.5, 411.4,
            414.2, 416.5, 418.6, 421.1, 424.6
        ],
        "camera": {"lat": 19.536, "lon": -155.576, "zoom": 5.5, "name": "Mauna Loa Observatory, Hawaii"},
        "suggested_layer": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
        "contextual_globe_layer": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
        "contextual_layer_title": "Suomi-NPP VIIRS Corrected Reflectance (True Color)",
        "contextual_layer_note": "Contextual optical satellite imagery. Displays terrestrial vegetation and cloud cover at Mauna Loa for geographical orientation, not the atmospheric CO2 column mixing ratio.",
        "sonification": {
            "voice": "forest",
            "voice_desc": "Warm harmonic triangle voice representing terrestrial biosphere and atmospheric absorption",
            "voiceDesc": "Warm harmonic triangle voice representing terrestrial biosphere and atmospheric absorption",
            "frequency_formula": "f = 130.81 * (2 ** (clamp((CO2 - 330.0) / 100.0, 0.0, 1.2) * 1.5))",
            "formula": "f = 130.81 * (2 ** (clamp((CO2 - 330.0) / 100.0, 0.0, 1.2) * 1.5))",
            "timbre": "Warm triangle + octave harmonic",
            "pitch_range_hz": "131 Hz – 370 Hz (calibration) · 143 Hz – 349 Hz (observed 1980–2024)",
            "pitchRange": "131 Hz – 370 Hz (calibration) · 143 Hz – 349 Hz (observed 1980–2024)",
            "full_calibration_range_hz": [130.81, 369.99],
            "observed_historical_range_hz": [143.34, 349.42],
            "dynamics": "Velocity increases with annual rate of CO2 accumulation (ppm/yr)",
            "spatial": "Pans from historical 1980 on the left (-0.8) to modern day on the right (+0.8)"
        },
        "limitations": "Annual arithmetic means at Mauna Loa smooth out within-year seasonal photosynthetic cycles (sawtooth oscillations of ±3 to 6 ppm between spring drawdown and autumn release). As an in-situ high-altitude mountaintop record (3,397 m), it reflects well-mixed hemispheric background air and may slightly differ from the global marine boundary layer surface average (422.8 ppm in 2024)."
    },
    "sea_level": {
        "id": "sea_level",
        "title": "Global Mean Sea Level Variation",
        "theme": "Sea Level Change",
        "agency": "NASA GSFC / CNES Satellite Altimetry (TOPEX/Poseidon, Jason-1/2/3, Sentinel-6 MF)",
        "portal_url": "https://earth.gov/sealevel/resources/332/global-mean-sea-level-1993-2024/",
        "eic_resource_id": "332",
        "eic_resource_url": "https://earth.gov/sealevel/resources/332/global-mean-sea-level-1993-2024/",
        "eic_resource_title": "Global Mean Sea Level 1993-2024 (Official EIC Resource #332)",
        "svs_id": "5516",
        "svs_url": "https://svs.gsfc.nasa.gov/5516",
        "visual_asset_creator": "Mark SubbaRao, NASA Scientific Visualization Studio",
        "visual_asset_attribution": "Credit: NASA's Scientific Visualization Studio",
        "frame_integration_status": "BLOCKED",
        "frame_integration_blocker": "NASA SVS #5516 / Earth.gov Resource #332 distributes the official visualization solely as a continuous 20-second 4K MP4 animation file (seaLevelRise_2024_English.mp4, 601 frames at 30 fps, 22.2 MB) and a summary poster image (seaLevelRise_2024.jpg). Because the video contains non-linear visual presentation elements (title intro and hold cards) without an official decomposing timestamp lookup table or individual annual frame slices, year-to-video-time mapping cannot be verified without unverifiable timestamp inference. In-app chart sparkline and 3D globe tiles are explicitly labeled as real-time sonification visualizations and contextual thermal imagery, not official NASA animation frames.",
        "official_media": {
            "video_url": "https://earth.gov/sealevel/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBdThKIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--720266cb6099f28ace3c1100c68a300f35486919/seaLevelRise_2024_English.mp4?disposition=inline",
            "poster_url": "https://earth.gov/sealevel/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbU1LIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--338dc18fecd6592e1d3f984d79e5aa424100127f/seaLevelRise_2024.jpg?disposition=inline",
            "svs_url": "https://svs.gsfc.nasa.gov/5516",
            "earth_gov_url": "https://earth.gov/sealevel/resources/332/global-mean-sea-level-1993-2024/"
        },
        "reuse_conditions": "Public Domain (NASA Open Science Data Policy & US Government Work)",
        "integration_mode": "Mode A (Numerical Sonification of Authoritative Observation Timeseries) with synchronized contextual globe vantage",
        "data_identifier": "Global Mean Sea Level Trend (Multi-Mission Satellite Radar Altimetry)",
        "authoritative_url": "https://sealevel.nasa.gov/",
        "retrieval_date": "2024 Q4 Release (TOPEX, Jason-1/2/3, Sentinel-6 MF)",
        "variable_name": "GMSL Variation (Global Mean Sea Level with GIA applied)",
        "units": "mm",
        "unit_name": "Millimeters variation",
        "baseline_desc": "Zero baseline at start of satellite altimetry record (1993)",
        "baseline_val": 0,
        "historical_period": "1993–2024 (Satellite Radar Altimetry Era Reference Series)",
        "transformation_notes": "Seasonal signal removed, 60-day smoothing applied, referenced to 1993 baseline = 0.0 mm.",
        "description": "Variation in global mean sea level from multi-mission radar altimetry, accounting for ocean thermal expansion and land ice discharge (Greenland and Antarctic ice sheets).",
        "years": list(range(1993, 2025)),
        "values": [
            0.0, 3.2, 4.8, 6.9, 12.1, 10.4, 13.5, 17.2, 21.6, 24.8, 28.5, 31.2,
            34.6, 37.8, 40.5, 44.1, 48.3, 49.7, 48.2, 56.4, 60.1, 65.8, 75.2, 78.4,
            81.3, 85.1, 91.5, 94.2, 97.8, 101.2, 103.5, 105.8
        ],
        "camera": {"lat": -8.52, "lon": 179.20, "zoom": 4.5, "name": "Funafuti Atoll, Tuvalu (Pacific Ocean)"},
        "suggested_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature",
        "contextual_globe_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature",
        "contextual_layer_title": "GHRSST MUR Sea Surface Temperature",
        "contextual_layer_note": "Contextual ocean thermal imagery. Displays ocean warmth (thermal expansion driver) for coastal context at Tuvalu, distinct from radar altimetric sea surface height anomaly.",
        "sonification": {
            "voice": "water",
            "voice_desc": "Resonant dual-sine ocean pad ascending as sea levels rise",
            "voiceDesc": "Resonant dual-sine ocean pad ascending as sea levels rise",
            "frequency_formula": "f = 110.0 * (2 ** (clamp(SL / 120.0, 0.0, 1.2) * 1.5))",
            "formula": "f = 110.0 * (2 ** (clamp(SL / 120.0, 0.0, 1.2) * 1.5))",
            "timbre": "Deep sine pad with slow low-frequency oscillation",
            "pitch_range_hz": "110 Hz – 311 Hz (calibration) · 110 Hz – 275 Hz (observed 1993–2024)",
            "pitchRange": "110 Hz – 311 Hz (calibration) · 110 Hz – 275 Hz (observed 1993–2024)",
            "full_calibration_range_hz": [110.0, 311.13],
            "observed_historical_range_hz": [110.0, 275.11],
            "dynamics": "Volume modulated by annual sea-level rise rate (delta mm/yr); pan follows temporal timeline (-0.8 in 1993 to +0.8 in 2024)",
            "spatial": "Pans from historical 1993 on the left (-0.8) to modern day on the right (+0.8)"
        },
        "missions": {
            "1993-2001": "TOPEX/Poseidon (NASA/CNES)",
            "2002-2007": "Jason-1 (NASA/CNES)",
            "2008-2015": "OSTM/Jason-2 (NASA/CNES/NOAA/EUMETSAT)",
            "2016-2019": "Jason-3 (NOAA/NASA/CNES/EUMETSAT)",
            "2020-2024": "Sentinel-6 Michael Freilich (ESA/NASA/NOAA/EUMETSAT)"
        },
        "limitations": "Global mean sea level does not reflect local coastal variations caused by post-glacial rebound, tectonic subsidence, or ocean current shifts."
    },
    "temperature_anomaly": {
        "id": "temperature_anomaly",
        "title": "Global Surface Temperature Anomaly (GISTEMP)",
        "theme": "Global Climate & Energy",
        "agency": "NASA Goddard Institute for Space Studies (GISS)",
        "portal_url": "https://earth.gov/",
        "data_identifier": "NASA GISS Surface Temperature Analysis (GISTEMP v4 LOTI)",
        "authoritative_url": "https://data.giss.nasa.gov/gistemp/",
        "retrieval_date": "January 2025 Release (Annual Anomalies 1980–2024)",
        "variable_name": "LOTI (Land-Ocean Temperature Index Anomaly vs 1951-1980)",
        "units": "°C",
        "unit_name": "Degrees Celsius anomaly",
        "baseline_desc": "1951-1980 global base period average (0.0 °C)",
        "baseline_val": 0,
        "historical_period": "1980–2024 (Fixed Annual Reference Window)",
        "transformation_notes": "Surface air temperature over land and SST over water; 250 km smoothing radius; referenced to 1951–1980 base period mean. Scientific note: GISTEMP 0.0 °C baseline represents the 1951–1980 climatological mean, which is approximately 0.2–0.3 °C warmer than the pre-industrial reference (1850–1900) used in international policy. The +1.5 °C sonification reference point (Bb4, 466.15 Hz) is an acoustic upper reference, not the pre-industrial threshold.",
        "description": "Global land-ocean surface temperature anomaly estimate based on meteorological stations, ocean buoys, and Antarctic research stations.",
        "years": list(range(1980, 2025)),
        "values": [
            0.26, 0.32, 0.14, 0.31, 0.16, 0.12, 0.18, 0.32, 0.39, 0.27,
            0.45, 0.40, 0.22, 0.24, 0.32, 0.45, 0.33, 0.47, 0.61, 0.39,
            0.39, 0.54, 0.63, 0.62, 0.53, 0.68, 0.64, 0.66, 0.54, 0.66,
            0.72, 0.61, 0.65, 0.68, 0.75, 0.90, 1.02, 0.93, 0.85, 0.98,
            1.02, 0.85, 0.89, 1.17, 1.28
        ],
        "camera": {"lat": 20.0, "lon": 0.0, "zoom": 2.2, "name": "Global Earth Observation Perspective"},
        "suggested_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "contextual_globe_layer": "MODIS_Terra_Land_Surface_Temp_Day",
        "contextual_layer_title": "MODIS Land Surface Temperature (Daytime Skin Temp)",
        "contextual_layer_note": "Contextual daytime surface thermal imagery. Displays absolute land skin temperature, not the GISTEMP statistical anomaly relative to 1951–1980 baseline.",
        "sonification": {
            "voice": "bell",
            "voice_desc": "Bright metallic chime whose pitch tracks heating above baseline",
            "voiceDesc": "Bright metallic chime whose pitch tracks heating above baseline",
            "frequency_formula": "f = 164.81 * (2 ** (clamp(ΔT / 1.5, 0.0, 1.2) * 1.5))",
            "formula": "f = 164.81 * (2 ** (clamp(ΔT / 1.5, 0.0, 1.2) * 1.5))",
            "timbre": "Additive sine bell with inharmonic overtone (ratio 2.76)",
            "pitch_range_hz": "165 Hz – 466 Hz (calibration) · 179 Hz – 400 Hz (observed 1980–2024)",
            "pitchRange": "165 Hz – 466 Hz (calibration) · 179 Hz – 400 Hz (observed 1980–2024)",
            "full_calibration_range_hz": [164.81, 466.15],
            "observed_historical_range_hz": [179.10, 400.22],
            "dynamics": "Loudness expands dynamically during extreme anomaly spikes",
            "spatial": "Pans from historical 1980 on the left (-0.8) to modern day on the right (+0.8)"
        },
        "limitations": "Observational uncertainties exist in sparsely sampled polar regions prior to modern satellite coverage. Furthermore, GISTEMP anomalies are referenced to 1951–1980, distinct from pre-industrial baselines used in international policy agreements."
    },
    "arctic_sea_ice": {
        "id": "arctic_sea_ice",
        "title": "Arctic Sea Ice Minimum Extent (September)",
        "theme": "Cryosphere & Sea Level",
        "agency": "NSIDC / NASA Earth Observatory",
        "portal_url": "https://earth.gov/",
        "data_identifier": "NSIDC Sea Ice Index (G02135, Version 3: Arctic September Minimum Extent)",
        "authoritative_url": "https://nsidc.org/data/seaice_index",
        "retrieval_date": "October 2024 Release (September Extent 1980–2024)",
        "variable_name": "SIE (September Monthly Sea Ice Extent, >=15% ice concentration)",
        "units": "million km²",
        "unit_name": "Million square kilometers",
        "baseline_desc": "1979-2000 average September extent ~7.0 million km²",
        "baseline_val": 7.0,
        "historical_period": "1980–2024 (Satellite Passive Microwave Record)",
        "transformation_notes": "Monthly average of daily extents derived from Nimbus-7 SMMR and DMSP SSM/I-SSMIS passive microwave radiometers.",
        "description": "Annual September minimum sea ice extent in the Arctic Ocean measured by satellite passive microwave radiometers (Nimbus-7, DMSP SSM/I, AMSR-E).",
        "years": list(range(1980, 2025)),
        "values": [
            7.67, 7.05, 7.30, 7.39, 6.81, 6.70, 7.36, 7.14, 7.37, 7.01,
            6.14, 6.47, 7.47, 6.40, 7.14, 6.08, 7.58, 6.67, 6.54, 6.12,
            6.25, 6.60, 5.83, 6.04, 5.98, 5.50, 5.75, 4.16, 4.59, 5.12,
            4.62, 4.34, 3.39, 5.05, 5.03, 4.43, 4.17, 4.67, 4.66, 4.19,
            3.82, 4.72, 4.67, 4.37, 4.28
        ],
        "camera": {"lat": 82.0, "lon": 0.0, "zoom": 3.0, "name": "Arctic Ocean & North Pole"},
        "suggested_layer": "MODIS_Terra_NDSI_Snow_Cover",
        "contextual_globe_layer": "MODIS_Terra_NDSI_Snow_Cover",
        "contextual_layer_title": "MODIS Terra NDSI Snow Cover / Sea Ice",
        "contextual_layer_note": "Contextual cryosphere optical reflectance. Displays normalized difference snow and sea-ice reflectance for polar context, while the sonified metric is NSIDC microwave sea-ice minimum extent.",
        "sonification": {
            "voice": "ice",
            "voice_desc": "Inverted crystalline bell: as ice retreats, pitch ascends into alert register",
            "voiceDesc": "Inverted crystalline bell: as ice retreats, pitch ascends into alert register",
            "frequency_formula": "f = 220.0 * (2 ** (clamp((8.0 - IceExtent) / 5.0, 0.0, 1.2) * 1.5))",
            "formula": "f = 220.0 * (2 ** (clamp((8.0 - IceExtent) / 5.0, 0.0, 1.2) * 1.5))",
            "timbre": "High crystalline strike with crisp attack and bell decay",
            "pitch_range_hz": "220 Hz – 622 Hz (calibration) · 236 Hz – 574 Hz (observed 1980–2024)",
            "pitchRange": "220 Hz – 622 Hz (calibration) · 236 Hz – 574 Hz (observed 1980–2024)",
            "full_calibration_range_hz": [220.0, 622.25],
            "observed_historical_range_hz": [235.63, 573.78],
            "dynamics": "Sharper velocity when ice drops below historic 5.0 million km² thresholds",
            "spatial": "Pans from historical 1980 on the left (-0.8) to modern day on the right (+0.8)"
        },
        "limitations": "Surface melt ponds during mid-summer can occasionally be misclassified by passive microwave radiometers without high-resolution optical correction."
    }
}


def list_datasets() -> list[dict]:
    """Return summary catalogue of available EIC datasets."""
    return [
        {
            "id": d["id"],
            "title": d["title"],
            "theme": d["theme"],
            "agency": d["agency"],
            "units": d["units"],
            "data_identifier": d.get("data_identifier", ""),
            "authoritative_url": d.get("authoritative_url", ""),
            "retrieval_date": d.get("retrieval_date", ""),
            "contextual_globe_layer": d.get("contextual_globe_layer", ""),
            "contextual_layer_note": d.get("contextual_layer_note", ""),
            "time_range": f"{d['years'][0]} - {d['years'][-1]}",
            "data_points": len(d["values"]),
            "latest_value": d["values"][-1],
            "latest_year": str(d["years"][-1]),
        }
        for d in DATASETS.values()
    ]


def get_dataset(dataset_id: str) -> dict | None:
    """Return complete dataset with verified time series and metadata."""
    return DATASETS.get(dataset_id)


# ---------------------------------------------------------------------------
# Scientific Sonification Mapping Specifications & Testable Calibration Layer
# ---------------------------------------------------------------------------

MAPPINGS_SPEC = {
    "geos_fp_temp": {
        "dataset_id": "geos_fp_temp",
        "title": "NASA GEOS-FP Near-Surface Temperature (2m Air Temp)",
        "pipeline_mode": "Mode A: Verified Numerical Physical Sonification",
        "input_parameter": "Near-surface 2-meter air temperature (T2M)",
        "physical_units": "°C",
        "valid_range": [10.0, 20.0],
        "formula_domain": [12.0, 17.5],
        "calibration_pitch_range_hz": [200.0, 800.0],
        "observed_historical_range": [12.4, 17.1],
        "observed_historical_pitch_hz": [243.64, 756.36],
        "audio_dimension": "Fundamental frequency f (Hz), velocity (dynamics), spatial stereo pan",
        "transfer_function": "f = 200.0 + clamp((T - 12.0) / (17.5 - 12.0), 0.0, 1.0) * (800.0 - 200.0)",
        "perceptual_justification": "Ascending pitch directly maps to increased thermal energy and molecular kinetic excitement (auditory elevation metaphor).",
        "edge_case_handling": "Values below 12.0 °C clamp to 200 Hz; values above 17.5 °C clamp to 800 Hz; NaN/null/inf raise ValueError.",
        "test_cases": [
            {"input_val": 12.0, "expected_freq_hz": 200.0, "note": "Winter / cold baseline minimum"},
            {"input_val": 14.75, "expected_freq_hz": 500.0, "note": "Mid-season global average"},
            {"input_val": 17.5, "expected_freq_hz": 800.0, "note": "Summer peak heatwave maximum"}
        ]
    },
    "ecco2_ocean_currents": {
        "dataset_id": "ecco2_ocean_currents",
        "title": "ECCO2 Sea Surface Potential Temperature",
        "pipeline_mode": "Mode A: Verified Numerical Physical Sonification",
        "input_parameter": "Sea Surface Potential Temperature (THETA 0–5m)",
        "physical_units": "°C",
        "valid_range": [14.0, 20.0],
        "formula_domain": [15.5, 17.5],
        "calibration_pitch_range_hz": [160.0, 480.0],
        "observed_historical_range": [15.8, 17.3],
        "observed_historical_pitch_hz": [208.0, 448.0],
        "audio_dimension": "Resonant dual-sine water pad frequency f (Hz), dynamic gain, detuning",
        "transfer_function": "f = 160.0 + clamp((SST - 15.5) / 2.0, 0.0, 1.0) * (480.0 - 160.0)",
        "perceptual_justification": "Deeper aquatic resonance reflecting high ocean heat capacity; pitch ascends with seasonal surface thermal energy.",
        "edge_case_handling": "SST below 15.5 °C clamps to 160 Hz; above 17.5 °C clamps to 480 Hz; NaN/null/inf raise ValueError.",
        "test_cases": [
            {"input_val": 15.5, "expected_freq_hz": 160.0, "note": "Winter baseline ocean surface"},
            {"input_val": 16.5, "expected_freq_hz": 320.0, "note": "Global ocean mean SST"},
            {"input_val": 17.5, "expected_freq_hz": 480.0, "note": "Peak seasonal ocean warming"}
        ]
    },
    "co2": {
        "dataset_id": "co2",
        "title": "Atmospheric Carbon Dioxide (CO₂)",
        "pipeline_mode": "Mode A: Verified Numerical Physical Sonification",
        "input_parameter": "Mauna Loa Observatory annual mean atmospheric CO2 dry air mole fraction",
        "physical_units": "ppm",
        "valid_range": [280.0, 600.0],
        "formula_domain": [330.0, 430.0],
        "calibration_pitch_range_hz": [130.81, 369.99],
        "observed_historical_range": [338.8, 424.5],
        "observed_historical_pitch_hz": [143.34, 349.42],
        "audio_dimension": "Warm triangle harmonic frequency f (Hz), velocity scaled by accumulation rate (ppm/yr)",
        "transfer_function": "f = 130.81 * (2 ** (clamp((CO2 - 330.0) / 100.0, 0.0, 1.2) * 1.5))",
        "perceptual_justification": "Exponential acoustic pitch curve parallels the logarithmic radiative forcing of CO₂ (ΔF = 5.35 * ln(C/C0)).",
        "edge_case_handling": "CO₂ below 330 ppm clamps to norm=0 (130.81 Hz); values exceeding 450 ppm clamp at norm=1.2 (370+ Hz); NaN/null/inf raise ValueError.",
        "test_cases": [
            {"input_val": 330.0, "expected_freq_hz": 130.81, "note": "Historical base reference (1975-1980 baseline C3)"},
            {"input_val": 380.0, "expected_freq_hz": 220.00, "note": "Midpoint concentration (~2005 level A3)"},
            {"input_val": 430.0, "expected_freq_hz": 369.99, "note": "Present day record concentration approaching F#4"}
        ]
    },
    "sea_level": {
        "dataset_id": "sea_level",
        "title": "Global Mean Sea Level Variation",
        "pipeline_mode": "Mode A: Verified Numerical Physical Sonification",
        "input_parameter": "Global mean sea level variation from 1993 baseline (GMSL)",
        "physical_units": "mm",
        "valid_range": [-50.0, 300.0],
        "formula_domain": [0.0, 120.0],
        "calibration_pitch_range_hz": [110.0, 311.13],
        "observed_historical_range": [0.0, 105.8],
        "observed_historical_pitch_hz": [110.0, 275.11],
        "audio_dimension": "Deep ocean sine tone frequency f (Hz), velocity, slow LFO swell",
        "transfer_function": "f = 110.0 * (2 ** (clamp(SL / 120.0, 0.0, 1.2) * 1.5))",
        "perceptual_justification": "Physical column height translated to vertical frequency continuum; rising sea levels lift the fundamental tone steadily.",
        "edge_case_handling": "SL <= 0 mm maps to 110.0 Hz (A2); SL >= 144 mm clamps to norm=1.2; NaN/null/inf raise ValueError.",
        "test_cases": [
            {"input_val": 0.0, "expected_freq_hz": 110.00, "note": "Start of satellite altimetry record (1993 baseline A2)"},
            {"input_val": 60.0, "expected_freq_hz": 185.02, "note": "Mid-record ~60 mm rise (~2011 level F#3)"},
            {"input_val": 120.0, "expected_freq_hz": 311.13, "note": "120 mm rise threshold (Eb4)"}
        ]
    },
    "temperature_anomaly": {
        "dataset_id": "temperature_anomaly",
        "title": "Global Surface Temperature Anomaly (GISTEMP)",
        "pipeline_mode": "Mode A: Verified Numerical Physical Sonification",
        "input_parameter": "Land-ocean surface temperature anomaly relative to 1951-1980 base period (ΔT)",
        "physical_units": "°C",
        "valid_range": [-1.0, 4.0],
        "formula_domain": [0.0, 1.5],
        "calibration_pitch_range_hz": [164.81, 466.15],
        "observed_historical_range": [0.12, 1.28],
        "observed_historical_pitch_hz": [179.10, 400.22],
        "audio_dimension": "Metallic chime frequency f (Hz), overtone brightness, dynamic velocity",
        "transfer_function": "f = 164.81 * (2 ** (clamp(ΔT / 1.5, 0.0, 1.2) * 1.5))",
        "perceptual_justification": "Clear resonant bell whose pitch rises above calm baseline into a high-register warning chime as planetary anomaly climbs.",
        "edge_case_handling": "ΔT <= 0.0 °C maps to 164.81 Hz (E3); ΔT >= 1.8 °C clamps to norm=1.2; NaN/null/inf raise ValueError.",
        "test_cases": [
            {"input_val": 0.0, "expected_freq_hz": 164.81, "note": "1951-1980 base climatology (0.0 °C anomaly E3)"},
            {"input_val": 0.75, "expected_freq_hz": 277.19, "note": "Moderate +0.75 °C anomaly (C#4)"},
            {"input_val": 1.5, "expected_freq_hz": 466.15, "note": "+1.5 °C sonification reference upper limit (Bb4)"}
        ]
    },
    "arctic_sea_ice": {
        "dataset_id": "arctic_sea_ice",
        "title": "Arctic Sea Ice Minimum Extent (September)",
        "pipeline_mode": "Mode A: Verified Numerical Physical Sonification",
        "input_parameter": "September minimum sea ice extent (SIE)",
        "physical_units": "million km²",
        "valid_range": [0.0, 12.0],
        "formula_domain": [8.0, 3.0],
        "calibration_pitch_range_hz": [220.0, 622.25],
        "observed_historical_range": [3.39, 7.67],
        "observed_historical_pitch_hz": [235.63, 573.78],
        "audio_dimension": "Crystalline bell frequency f (Hz), strike brightness, sharp attack",
        "transfer_function": "f = 220.0 * (2 ** (clamp((8.0 - SIE) / 5.0, 0.0, 1.2) * 1.5))",
        "perceptual_justification": "Inverted polar mapping: ice loss elevates pitch toward an acute high-register alarm as polar habitat diminishes.",
        "edge_case_handling": "SIE >= 8.0 maps to 220.0 Hz (A3); SIE <= 2.0 maps to norm=1.2; NaN/null/inf raise ValueError.",
        "test_cases": [
            {"input_val": 8.0, "expected_freq_hz": 220.00, "note": "Robust 1980 ice extent (8.0 M km² A3)"},
            {"input_val": 5.5, "expected_freq_hz": 370.04, "note": "Moderate retreat (5.5 M km² F#4)"},
            {"input_val": 3.0, "expected_freq_hz": 622.25, "note": "Historic low extent (3.0 M km² Eb5 alert)"}
        ]
    },
    "scanline_sonification": {
        "dataset_id": "scanline_sonification",
        "title": "NASA GIBS Raster Imagery Scanline Feature Sonification",
        "pipeline_mode": "Mode B: Image-Derived Optical Feature Sonification",
        "input_parameter": "Per-pixel optical luminance L = 0.299*R + 0.587*G + 0.114*B",
        "physical_units": "8-bit digital pixel brightness [0 - 255]",
        "valid_range": [0.0, 255.0],
        "formula_domain": [0.0, 255.0],
        "calibration_pitch_range_hz": [120.0, 720.0],
        "observed_historical_range": [0.0, 255.0],
        "observed_historical_pitch_hz": [120.0, 720.0],
        "audio_dimension": "Synthesizer frequency f (Hz), amplitude envelope, stereo position across scanline",
        "transfer_function": "f = 120.0 + clamp(L / 255.0, 0.0, 1.0) * (720.0 - 120.0)",
        "perceptual_justification": "Translates visual contrast and surface albedo into sound: dark ocean/forest generate low drones, bright clouds/ice generate high tones.",
        "edge_case_handling": "Black pixels (0) map to 120.0 Hz; saturated white (255) maps to 720.0 Hz; invalid inputs clamp within [120.0, 720.0] Hz.",
        "test_cases": [
            {"input_val": 0.0, "expected_freq_hz": 120.0, "note": "Abyssal ocean / dark surface (minimum pitch)"},
            {"input_val": 127.5, "expected_freq_hz": 420.0, "note": "Midtone land surface / vegetation"},
            {"input_val": 255.0, "expected_freq_hz": 720.0, "note": "Glacial ice sheet / thick cloud top (maximum pitch)"}
        ]
    }
}


def validate_measurement(dataset_id: str, value: float | int | None) -> tuple[bool, str]:
    """Validate a physical measurement against sensor limits and numerical sanity."""
    if value is None:
        return False, "Measurement value is missing (None)"
    try:
        val = float(value)
    except (TypeError, ValueError):
        return False, f"Measurement '{value}' cannot be converted to float"

    import math
    if math.isnan(val) or math.isinf(val):
        return False, f"Measurement value is non-finite: {val}"

    spec = MAPPINGS_SPEC.get(dataset_id)
    if not spec:
        return False, f"Unknown dataset id '{dataset_id}'"

    valid_min, valid_max = spec["valid_range"]
    if not (valid_min <= val <= valid_max):
        return False, f"Value {val} {spec['physical_units']} outside realistic bounds [{valid_min}, {valid_max}]"

    return True, "Valid measurement"


def calculate_pitch(dataset_id: str, value: float | int) -> float:
    """Calculate the deterministic sonification pitch (Hz) according to verified scientific formulas."""
    is_valid, reason = validate_measurement(dataset_id, value)
    if not is_valid:
        raise ValueError(reason)

    val = float(value)

    if dataset_id == "geos_fp_temp":
        norm = max(0.0, min(1.0, (val - 12.0) / (17.5 - 12.0)))
        return round(200.0 + norm * (800.0 - 200.0), 2)

    elif dataset_id == "ecco2_ocean_currents":
        norm = max(0.0, min(1.0, (val - 15.5) / 2.0))
        return round(160.0 + norm * (480.0 - 160.0), 2)

    elif dataset_id == "co2":
        norm = max(0.0, min(1.2, (val - 330.0) / 100.0))
        return round(130.81 * (2.0 ** (norm * 1.5)), 2)

    elif dataset_id == "sea_level":
        norm = max(0.0, min(1.2, val / 120.0))
        return round(110.0 * (2.0 ** (norm * 1.5)), 2)

    elif dataset_id == "temperature_anomaly":
        norm = max(0.0, min(1.2, val / 1.5))
        return round(164.81 * (2.0 ** (norm * 1.5)), 2)

    elif dataset_id == "arctic_sea_ice":
        loss_norm = max(0.0, min(1.2, (8.0 - val) / 5.0))
        return round(220.0 * (2.0 ** (loss_norm * 1.5)), 2)

    elif dataset_id == "scanline_sonification":
        norm = max(0.0, min(1.0, val / 255.0))
        return round(120.0 + norm * (720.0 - 120.0), 2)

    else:
        raise ValueError(f"No sonification mapping implemented for '{dataset_id}'")


def generate_pitch_labels(dataset_id: str) -> list[str]:
    """Dynamically generate low, baseline/mid, and high pitch slider labels from scientific mapping formulas."""
    ds = DATASETS.get(dataset_id)
    if not ds:
        return ["Low Pitch", "Mid Baseline", "High Pitch"]
    u = ds["units"]
    b_val = ds.get("baseline_val", 0.0)

    if dataset_id == "geos_fp_temp":
        p_min = round(calculate_pitch(dataset_id, 12.0))
        p_base = round(calculate_pitch(dataset_id, b_val))
        p_max = round(calculate_pitch(dataset_id, 17.5))
        return [f"Min (12.0 {u} → {p_min} Hz)", f"Baseline ({b_val:.1f} {u} → {p_base} Hz)", f"Max (17.5 {u} → {p_max} Hz)"]
    elif dataset_id == "ecco2_ocean_currents":
        p_min = round(calculate_pitch(dataset_id, 15.5))
        p_base = round(calculate_pitch(dataset_id, b_val))
        p_max = round(calculate_pitch(dataset_id, 17.5))
        return [f"Min (15.5 {u} → {p_min} Hz)", f"Baseline ({b_val:.1f} {u} → {p_base} Hz)", f"Max (17.5 {u} → {p_max} Hz)"]
    elif dataset_id == "co2":
        p_floor = round(calculate_pitch(dataset_id, 330.0))
        p_mid = round(calculate_pitch(dataset_id, 380.0))
        p_upper = round(calculate_pitch(dataset_id, 430.0))
        return [f"Floor (330 {u} → {p_floor} Hz)", f"Mid-Scale (380 {u} → {p_mid} Hz)", f"Upper Bound (430 {u} → {p_upper} Hz)"]
    elif dataset_id == "sea_level":
        p_base = round(calculate_pitch(dataset_id, 0.0))
        p_mid = round(calculate_pitch(dataset_id, 60.0))
        p_limit = round(calculate_pitch(dataset_id, 120.0))
        return [f"1993 Base (0 {u} → {p_base} Hz)", f"+60 mm Rise ({p_mid} Hz)", f"+120 mm Limit ({p_limit} Hz)"]
    elif dataset_id == "temperature_anomaly":
        p_base = round(calculate_pitch(dataset_id, 0.0))
        p_mid = round(calculate_pitch(dataset_id, 0.75))
        p_limit = round(calculate_pitch(dataset_id, 1.5))
        return [f"1951-80 Base (0 {u} → {p_base} Hz)", f"+0.75 {u} Anomaly ({p_mid} Hz)", f"+1.5 {u} Sonification Ref ({p_limit} Hz)"]
    elif dataset_id == "arctic_sea_ice":
        p_max = round(calculate_pitch(dataset_id, 8.0))
        p_mid = round(calculate_pitch(dataset_id, 5.5))
        p_low = round(calculate_pitch(dataset_id, 3.0))
        return [f"Max Extent (8.0 {u} → {p_max} Hz)", f"Mid-Melt (5.5 {u} → {p_mid} Hz)", f"Record Low Bound (3.0 {u} → {p_low} Hz)"]
    return ["Low Pitch", "Mid Baseline", "High Pitch"]


def describe_mapping(dataset_id: str) -> dict | None:
    """Return scientific mapping details, formulas, and test cases."""
    spec = MAPPINGS_SPEC.get(dataset_id)
    if not spec:
        return None
    res = dict(spec)
    res["pitch_slider_labels"] = generate_pitch_labels(dataset_id)
    return res


def compute_trend(years: list, values: list) -> dict:
    """Compute deterministic year-over-year deltas and linear OLS trend slope."""
    if not years or not values or len(years) != len(values) or len(values) < 2:
        return {
            "status": "insufficient_points",
            "step_unit": "yr",
            "is_monthly": False,
            "yoy_deltas": [],
            "ols_slope": 0.0,
            "total_change": 0.0,
            "description": "Insufficient observations for trend calculation (minimum 2 required)."
        }

    import math
    clean_vals = []
    for v in values:
        if v is None:
            return {"status": "invalid_data", "description": "Null/missing measurement in series."}
        try:
            fv = float(v)
            if math.isnan(fv) or math.isinf(fv):
                return {"status": "invalid_data", "description": "Non-finite measurement in series."}
            clean_vals.append(fv)
        except (ValueError, TypeError):
            return {"status": "invalid_data", "description": f"Invalid measurement '{v}'."}

    n = len(clean_vals)
    first_yr = str(years[0])
    is_monthly = " " in first_yr or any(m in first_yr for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])
    step_unit = "mo" if is_monthly else "yr"

    deltas = []
    for i in range(n):
        if i == 0:
            deltas.append(None)
        else:
            deltas.append(round(clean_vals[i] - clean_vals[i - 1], 4))

    x_mean = (n - 1) / 2.0
    y_mean = sum(clean_vals) / n
    numerator = sum((i - x_mean) * (clean_vals[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    ols_slope = round(numerator / denominator, 4) if denominator != 0 else 0.0
    total_change = round(clean_vals[-1] - clean_vals[0], 4)
    trend_period = f"{first_yr}–{years[-1]}"

    return {
        "status": "valid",
        "is_monthly": is_monthly,
        "step_unit": step_unit,
        "yoy_deltas": deltas,
        "first_point_delta": None,
        "first_point_note": "No prior observation (start of record)",
        "ols_slope": ols_slope,
        "total_change": total_change,
        "trend_period": trend_period,
        "trend_label": f"Linear trend, {trend_period}",
        "mean_annual_rate": round(total_change / (n - 1), 4),
        "description": f"Linear trend, {trend_period}: {ols_slope:+.2f} per {step_unit} across {n} observations."
    }
