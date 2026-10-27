"""NASA Earth Information Center (EIC) verified datasets and metadata.

Source provenance:
- NASA GEOS-FP Near-Surface Air Temperature: NASA GMAO & Earth Information Center (earth.gov)
- ECCO2 Ocean Currents: NASA JPL ECCO2 & Earth Information Center (earth.gov)
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
        "units": "°C",
        "unit_name": "Degrees Celsius",
        "baseline_desc": "Global baseline temperature ~14.0 °C",
        "baseline_val": 14.0,
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
        "sonification": {
            "voice": "bell",
            "frequency_formula": "200 + ((Temp - 12.0) / (17.5 - 12.0)) * (800 - 200)",
            "voice_desc": "Continuous tone scaling from 200 Hz (winter/cold) to 800 Hz (summer peak heatwave)",
            "timbre": "Warm metallic chime with harmonic overtones",
            "pitch_range_hz": "200 Hz - 760 Hz",
            "dynamics": "Pitch proportional to temperature: higher pitches mean warmer zones",
        },
        "limitations": "Model grid resolution (0.25° x 0.3125°) averages microclimate variations in steep mountainous terrain and narrow coastal strips."
    },
    "ecco2_ocean_currents": {
        "id": "ecco2_ocean_currents",
        "title": "ECCO2 Ocean Currents & Sea Surface Temperature",
        "theme": "Ocean Circulation & Energy",
        "agency": "NASA JPL / ECCO2 & Earth Information Center (earth.gov)",
        "portal_url": "https://earth.gov/",
        "units": "°C",
        "unit_name": "Degrees Celsius",
        "baseline_desc": "Global mean SST ~16.1 °C",
        "baseline_val": 16.1,
        "description": "High-resolution global ocean circulation and sea-surface temperatures from the Estimating the Circulation and Climate of the Ocean (ECCO2) model, demonstrating heat transport across ocean gyres.",
        "years": [
            "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
            "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024"
        ],
        "values": [
            15.8, 15.9, 16.1, 16.4, 16.7, 17.0, 17.3, 17.2, 16.9, 16.6, 16.2, 15.9
        ],
        "camera": {"lat": 25.0, "lon": -60.0, "zoom": 3.0, "name": "North Atlantic Ocean Gyre & Gulf Stream"},
        "suggested_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature",
        "sonification": {
            "voice": "water",
            "frequency_formula": "160 + ((SST - 15.5) / 2.0) * (480 - 160)",
            "voice_desc": "Resonant dual-sine ocean pad reflecting ocean heat capacity and current velocity",
            "timbre": "Deep sine wave pad with slow chorused detune",
            "pitch_range_hz": "160 Hz - 450 Hz",
            "dynamics": "Volume modulated by current velocity and thermal energy",
        },
        "limitations": "Sub-mesoscale eddies smaller than 10 km are parameterized rather than fully resolved in global simulations."
    },
    "co2": {
        "id": "co2",
        "title": "Atmospheric Carbon Dioxide (CO₂)",
        "theme": "Greenhouse Gases",
        "agency": "NOAA GML / NASA Earth Information Center GHG Center",
        "portal_url": "https://earth.gov/ghgcenter",
        "units": "ppm",
        "unit_name": "Parts per million",
        "baseline_desc": "Pre-industrial atmospheric baseline ~280 ppm",
        "baseline_val": 280,
        "description": "Annual global mean atmospheric carbon dioxide concentration recorded at the Mauna Loa Observatory and marine boundary layer sites. Tracks the primary driver of anthropogenic climate change.",
        "years": list(range(1980, 2025)),
        "values": [
            338.8, 340.1, 341.2, 342.9, 344.4, 345.9, 347.2, 348.9, 351.5, 352.9,
            354.2, 355.6, 356.4, 357.1, 358.8, 360.8, 362.6, 363.7, 366.7, 368.4,
            369.5, 371.1, 373.3, 375.8, 377.5, 379.8, 381.9, 383.8, 385.6, 387.4,
            389.9, 391.7, 393.9, 396.5, 398.7, 401.0, 404.2, 406.8, 408.5, 411.4,
            414.2, 416.5, 418.6, 421.1, 424.5
        ],
        "camera": {"lat": 19.536, "lon": -155.576, "zoom": 5.5, "name": "Mauna Loa Observatory, Hawaii"},
        "suggested_layer": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
        "sonification": {
            "voice": "forest",
            "frequency_formula": "130.81 * 2^((CO2 - 330) / 100 * 1.5)",
            "voice_desc": "Warm harmonic triangle voice representing terrestrial biosphere and atmospheric absorption",
            "timbre": "Warm triangle + octave harmonic",
            "pitch_range_hz": "130 Hz - 290 Hz",
            "dynamics": "Velocity increases with annual rate of CO2 accumulation (ppm/yr)",
        },
        "limitations": "Annual global averages smooth out seasonal terrestrial photosynthetic cycles (sawtooth variations of ±3-6 ppm) and local industrial plumes."
    },
    "sea_level": {
        "id": "sea_level",
        "title": "Global Mean Sea Level Variation",
        "theme": "Sea Level Change",
        "agency": "NASA GSFC / CNES Satellite Altimetry (TOPEX/Poseidon, Jason-1/2/3, Sentinel-6)",
        "portal_url": "https://earth.gov/sealevel",
        "units": "mm",
        "unit_name": "Millimeters variation",
        "baseline_desc": "Zero baseline at start of satellite altimetry record (1993)",
        "baseline_val": 0,
        "description": "Variation in global mean sea level from multi-mission radar altimetry, accounting for ocean thermal expansion and land ice discharge (Greenland and Antarctic ice sheets).",
        "years": list(range(1993, 2025)),
        "values": [
            0.0, 3.2, 4.8, 6.9, 12.1, 10.4, 13.5, 17.2, 21.6, 24.8, 28.5, 31.2,
            34.6, 37.8, 40.5, 44.1, 48.3, 49.7, 48.2, 56.4, 60.1, 65.8, 75.2, 78.4,
            81.3, 85.1, 91.5, 94.2, 97.8, 101.2, 103.5, 105.8
        ],
        "camera": {"lat": -8.52, "lon": 179.20, "zoom": 4.5, "name": "Funafuti Atoll, Tuvalu (Pacific Ocean)"},
        "suggested_layer": "GHRSST_L4_MUR_Sea_Surface_Temperature",
        "sonification": {
            "voice": "water",
            "frequency_formula": "110.0 * 2^((SeaLevel / 120) * 1.5)",
            "voice_desc": "Resonant dual-sine ocean pad ascending as sea levels rise",
            "timbre": "Deep sine pad with slow low-frequency oscillation",
            "pitch_range_hz": "110 Hz - 235 Hz",
            "dynamics": "Volume modulated by thermal expansion rate and altimeter precision",
        },
        "limitations": "Global mean sea level does not reflect local coastal variations caused by post-glacial rebound, tectonic subsidence, or ocean current shifts."
    },
    "temperature_anomaly": {
        "id": "temperature_anomaly",
        "title": "Global Surface Temperature Anomaly (GISTEMP)",
        "theme": "Global Climate & Energy",
        "agency": "NASA Goddard Institute for Space Studies (GISS)",
        "portal_url": "https://earth.gov/",
        "units": "°C",
        "unit_name": "Degrees Celsius anomaly",
        "baseline_desc": "1951-1980 global base period average (0.0 °C)",
        "baseline_val": 0,
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
        "sonification": {
            "voice": "bell",
            "frequency_formula": "164.81 * 2^((TempAnomaly / 1.5) * 1.5)",
            "voice_desc": "Bright metallic chime whose pitch tracks heating above baseline",
            "timbre": "Additive sine bell with inharmonic overtone (ratio 2.76)",
            "pitch_range_hz": "165 Hz - 460 Hz",
            "dynamics": "Loudness expands dynamically during extreme anomaly spikes",
        },
        "limitations": "Observational uncertainties exist in sparsely sampled polar regions and ocean interiors prior to modern satellite/Argo coverage."
    },
    "arctic_sea_ice": {
        "id": "arctic_sea_ice",
        "title": "Arctic Sea Ice Minimum Extent (September)",
        "theme": "Cryosphere & Sea Level",
        "agency": "NSIDC / NASA Earth Observatory",
        "portal_url": "https://earth.gov/",
        "units": "million km²",
        "unit_name": "Million square kilometers",
        "baseline_desc": "1979-2000 average September extent ~7.0 million km²",
        "baseline_val": 7.0,
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
        "sonification": {
            "voice": "ice",
            "frequency_formula": "220.0 * 2^((8.0 - IceExtent) / 5.0 * 1.5)",
            "voice_desc": "Inverted crystalline bell: as ice retreats, pitch ascends into alert register",
            "timbre": "High crystalline strike with crisp attack and bell decay",
            "pitch_range_hz": "220 Hz - 550 Hz",
            "dynamics": "Sharper velocity when ice drops below historic 5.0 million km² thresholds",
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
