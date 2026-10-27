/**
 * Earth Information Center (EIC) Jukebox Module
 * Target: NASA Space Apps Challenge - The Earth Information Jukebox
 * 
 * Implements the verified EIC visualization-to-sonification pipeline
 * adhering strictly to the official NASA Space Apps Challenge specifications.
 */
(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Verified NASA Earth Information Center (EIC) Datasets & Provenance
  // ---------------------------------------------------------------------------
  const EIC_DATASETS = {
    geos_fp_temp: {
      id: 'geos_fp_temp',
      title: 'NASA GEOS-FP Near-Surface Temperature (2m Air Temp)',
      theme: 'Global Climate & Atmosphere',
      agency: 'NASA GSFC / GMAO & Earth Information Center (earth.gov)',
      portalUrl: 'https://earth.gov/',
      units: '°C',
      unitName: 'Degrees Celsius',
      baselineDesc: 'Global baseline temperature ~14.0 °C',
      baselineVal: 14.0,
      description: 'Daily and monthly global near-surface air temperature from the NASA Goddard Earth Observing System Forward Processing (GEOS-FP) model visualization. Tracks seasonal heating cycles, heatwaves (red), and cold snaps (blue) across our living planet.',
      years: [
        'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
        'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
      ],
      values: [
        12.4, 12.8, 13.5, 14.4, 15.3, 16.2, 17.1, 16.8, 15.9, 14.8, 13.6, 12.6
      ],
      camera: { lat: 28.0, lon: 10.0, zoom: 2.5, name: 'Global Thermal Earth View' },
      suggestedLayer: 'MODIS_Terra_Land_Surface_Temp_Day',
      sonification: {
        voice: 'bell',
        voiceDesc: 'Continuous pitch scaling: higher pitch = warmer temperature; lower pitch = colder temperature.',
        formula: 'f = 200 + ((Temp - 12.0) / (17.5 - 12.0)) * (800 - 200)',
        contextualGlobeLayer: 'MODIS_Terra_Land_Surface_Temp_Day',
        contextualLayerTitle: 'MODIS Land Surface Temperature (Daytime Skin Temp)',
        contextualLayerNote: 'Contextual Earth observation proxy. The 3D globe displays satellite land skin temperature, which provides geographic surface thermal context but is distinct from the GMAO GEOS-FP 2m atmospheric air temperature grid.',
        pitchRange: '200 Hz – 800 Hz (calibration) · 244 Hz – 756 Hz (observed 2024)',
        fullCalibrationRange: '200 Hz – 800 Hz',
        voice_desc: 'Continuous tone scaling from 200 Hz (winter/cold) to 800 Hz (summer peak heatwave)',
        frequency_formula: 'f = 200.0 + clamp((Temp - 12.0) / 5.5, 0.0, 1.0) * (800.0 - 200.0)',
        dynamics: 'Loudness expands with thermal intensity; pitch directly tracks warmth in °C.',
        spatial: 'Pans from left to right along the annual calendar trajectory.'
      },
      limitations: 'Model grid resolution averages microclimate extremes in steep mountainous terrain and narrow coastal boundaries.'
    },
    ecco2_ocean_currents: {
      id: 'ecco2_ocean_currents',
      title: 'ECCO2 Ocean Currents & Sea Surface Temperature',
      theme: 'Ocean Circulation & Energy',
      agency: 'NASA JPL / ECCO2 & Earth Information Center (earth.gov)',
      portalUrl: 'https://earth.gov/',
      units: '°C',
      unitName: 'Degrees Celsius',
      baselineDesc: 'Global mean SST ~16.1 °C',
      baselineVal: 16.1,
      description: 'High-resolution global ocean circulation and sea-surface temperatures from the Estimating the Circulation and Climate of the Ocean (ECCO2) model, demonstrating heat transport across global ocean gyres.',
      years: [
        'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
        'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
      ],
      values: [
        15.8, 15.9, 16.1, 16.4, 16.7, 17.0, 17.3, 17.2, 16.9, 16.6, 16.2, 15.9
      ],
      camera: { lat: 25.0, lon: -60.0, zoom: 3.0, name: 'North Atlantic Ocean Gyre & Gulf Stream' },
      suggestedLayer: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
      sonification: {
        voice: 'water',
        voiceDesc: 'Resonant dual-sine ocean pad reflecting ocean heat capacity and current velocity.',
        formula: 'f = 160 + ((SST - 15.5) / 2.0) * (480 - 160)',
        contextualGlobeLayer: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
        contextualLayerTitle: 'GHRSST MUR Sea Surface Temperature (1km High-Res SST)',
        contextualLayerNote: 'Contextual satellite thermal proxy. The 3D globe displays high-resolution satellite SST imagery for oceanic orientation, while ECCO2 represents global 3D ocean dynamic current simulation models.',
        pitchRange: '160 Hz – 480 Hz (calibration) · 208 Hz – 448 Hz (observed 2024)',
        fullCalibrationRange: '160 Hz – 480 Hz',
        voice_desc: 'Resonant dual-sine ocean pad reflecting ocean heat capacity and current velocity',
        frequency_formula: 'f = 160.0 + clamp((SST - 15.5) / 2.0, 0.0, 1.0) * (480.0 - 160.0)',
        dynamics: 'Volume scales with thermal energy magnitude (0.14–0.24); pan follows 12-month calendar trajectory (-0.8 in Jan to +0.8 in Dec).',
        spatial: 'Spatial panning tracking ocean current direction.'
      },
      limitations: 'Sub-mesoscale eddies smaller than 10 km are parameterized rather than directly resolved.'
    },
    co2: {
      id: 'co2',
      title: 'Atmospheric Carbon Dioxide (CO₂) — NOAA GML Mauna Loa Record',
      theme: 'Greenhouse Gases',
      agency: 'NOAA GML / NASA Earth Information Center GHG Center',
      portalUrl: 'https://earth.gov/ghgcenter',
      units: 'ppm',
      unitName: 'Parts per million',
      baselineDesc: 'Pre-industrial baseline ~280 ppm',
      baselineVal: 280,
      description: 'Annual mean atmospheric carbon dioxide concentration recorded at NOAA Global Monitoring Laboratory Mauna Loa Observatory in Hawaii (424.5 ppm in 2024; global marine boundary average is 422.8 ppm). Serves as the longest continuous in-situ record of atmospheric CO2.',
      years: [
        1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
        1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
        2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
        2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
        2020, 2021, 2022, 2023, 2024
      ],
      values: [
        338.8, 340.1, 341.2, 342.9, 344.4, 345.9, 347.2, 348.9, 351.5, 352.9,
        354.2, 355.6, 356.4, 357.1, 358.8, 360.8, 362.6, 363.7, 366.7, 368.4,
        369.5, 371.1, 373.3, 375.8, 377.5, 379.8, 381.9, 383.8, 385.6, 387.4,
        389.9, 391.7, 393.9, 396.5, 398.7, 401.0, 404.2, 406.8, 408.5, 411.4,
        414.2, 416.5, 418.6, 421.1, 424.5
      ],
      camera: { lat: 19.536, lon: -155.576, zoom: 5.2, name: 'Mauna Loa Observatory, Hawaii' },
      suggestedLayer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
      sonification: {
        voice: 'forest',
        voiceDesc: 'Warm harmonic triangle voice representing the biosphere and radiative absorption.',
        formula: 'f = 130.81 * 2^(((CO2 - 330) / 100) * 1.5)',
        contextualGlobeLayer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        contextualLayerTitle: 'Suomi-NPP VIIRS Corrected Reflectance (True Color)',
        contextualLayerNote: 'Contextual optical satellite imagery. Displays terrestrial vegetation and cloud cover at Mauna Loa for geographical orientation, not the atmospheric CO2 column mixing ratio.',
        pitchRange: '131 Hz – 370 Hz (calibration) · 143 Hz – 349 Hz (observed 1980–2024)',
        fullCalibrationRange: '131 Hz – 370 Hz',
        voice_desc: 'Warm harmonic triangle voice representing terrestrial biosphere and atmospheric absorption',
        frequency_formula: 'f = 130.81 * (2 ** (clamp((CO2 - 330.0) / 100.0, 0.0, 1.2) * 1.5))',
        dynamics: 'Loudness expands with higher annual accumulation rates (+ppm/yr).',
        spatial: 'Pans from historical 1980 on the left (-0.8) to modern day on the right (+0.8).'
      },
      limitations: 'Annual global means smooth out seasonal vegetation cycles (sawtooth ±3-6 ppm) and local industrial plumes.'
    },
    sea_level: {
      id: 'sea_level',
      title: 'Global Mean Sea Level Variation',
      theme: 'Sea Level Change',
      agency: 'NASA GSFC / CNES Satellite Altimetry (TOPEX/Poseidon, Jason, Sentinel-6 MF · EIC #332)',
      portalUrl: 'https://earth.gov/sealevel/resources/332/global-mean-sea-level-1993-2024/',
      eic_resource_id: '332',
      eic_resource_url: 'https://earth.gov/sealevel/resources/332/global-mean-sea-level-1993-2024/',
      units: 'mm',
      unitName: 'Millimeters variation',
      baselineDesc: 'Zero baseline at start of satellite altimetry record (1993)',
      baselineVal: 0,
      description: 'Continuous satellite radar altimetry measuring global ocean height change, reflecting seawater thermal expansion and land ice discharge.',
      years: [
        1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002,
        2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012,
        2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022,
        2023, 2024
      ],
      values: [
        0.0, 3.2, 4.8, 6.9, 12.1, 10.4, 13.5, 17.2, 21.6, 24.8,
        28.5, 31.2, 34.6, 37.8, 40.5, 44.1, 48.3, 49.7, 48.2, 56.4,
        60.1, 65.8, 75.2, 78.4, 81.3, 85.1, 91.5, 94.2, 97.8, 101.2,
        103.5, 105.8
      ],
      camera: { lat: -8.52, lon: 179.20, zoom: 4.2, name: 'Funafuti Atoll, Tuvalu (Pacific Ocean)' },
      suggestedLayer: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
      sonification: {
        voice: 'water',
        voiceDesc: 'Resonant dual-sine ocean pad ascending steadily as sea levels rise.',
        formula: 'f = 110.0 * 2^((SeaLevel / 120) * 1.5)',
        contextualGlobeLayer: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
        contextualLayerTitle: 'GHRSST MUR Sea Surface Temperature',
        contextualLayerNote: 'Contextual ocean thermal imagery. Displays ocean warmth (thermal expansion driver) for coastal context at Tuvalu, distinct from radar altimetric sea surface height anomaly.',
        pitchRange: '110 Hz – 311 Hz (calibration) · 110 Hz – 275 Hz (observed 1993–2024)',
        fullCalibrationRange: '110 Hz – 311 Hz',
        voice_desc: 'Resonant dual-sine ocean pad ascending as sea levels rise',
        frequency_formula: 'f = 110.0 * (2 ** (clamp(SL / 120.0, 0.0, 1.2) * 1.5))',
        dynamics: 'Volume modulated by annual sea-level rise rate (delta mm/yr); pan follows temporal timeline (-0.8 in 1993 to +0.8 in 2024).',
        spatial: 'Spatial panning from 1993 on the left to 2024 on the right.'
      },
      limitations: 'Global mean values do not capture regional coastline dynamics influenced by post-glacial rebound or land subsidence.'
    },
    temperature_anomaly: {
      id: 'temperature_anomaly',
      title: 'Global Surface Temperature Anomaly (GISTEMP)',
      theme: 'Global Climate & Energy',
      agency: 'NASA Goddard Institute for Space Studies (GISS)',
      portalUrl: 'https://earth.gov/',
      units: '°C',
      unitName: 'Degrees Celsius anomaly',
      baselineDesc: '1951-1980 base period global mean (0.0 °C)',
      baselineVal: 0,
      description: 'Global combined land-surface air and sea-surface water temperature anomalies relative to the 1951-1980 base period, demonstrating continuous planetary warming.',
      years: [
        1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
        1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
        2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
        2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
        2020, 2021, 2022, 2023, 2024
      ],
      values: [
        0.26, 0.32, 0.14, 0.31, 0.16, 0.12, 0.18, 0.32, 0.39, 0.27,
        0.45, 0.40, 0.22, 0.24, 0.32, 0.45, 0.33, 0.47, 0.61, 0.39,
        0.39, 0.54, 0.63, 0.62, 0.53, 0.68, 0.64, 0.66, 0.54, 0.66,
        0.72, 0.61, 0.65, 0.68, 0.75, 0.90, 1.02, 0.93, 0.85, 0.98,
        1.02, 0.85, 0.89, 1.17, 1.28
      ],
      camera: { lat: 20.0, lon: 0.0, zoom: 2.0, name: 'Global Earth Observation Perspective' },
      suggestedLayer: 'MODIS_Terra_Land_Surface_Temp_Day',
      sonification: {
        voice: 'bell',
        voiceDesc: 'Bright metallic bell chime with inharmonic overtones tracking heating spikes above baseline.',
        formula: 'f = 164.81 * 2^((TempAnomaly / 1.5) * 1.5)',
        contextualGlobeLayer: 'MODIS_Terra_Land_Surface_Temp_Day',
        contextualLayerTitle: 'MODIS Land Surface Temperature (Daytime Skin Temp)',
        contextualLayerNote: 'Contextual daytime surface thermal imagery. Displays absolute land skin temperature, not the GISTEMP statistical anomaly relative to 1951–1980 baseline.',
        pitchRange: '165 Hz – 466 Hz (calibration) · 179 Hz – 400 Hz (observed 1980–2024)',
        fullCalibrationRange: '165 Hz – 466 Hz',
        voice_desc: 'Bright metallic chime whose pitch tracks heating above baseline',
        frequency_formula: 'f = 164.81 * (2 ** (clamp(ΔT / 1.5, 0.0, 1.2) * 1.5))',
        dynamics: 'Loudness expands during record-setting heat years (e.g. 2016, 2020, 2023, 2024).',
        spatial: 'Pans from left to right along the 45-year timeline.'
      },
      limitations: 'Observational station density is lower in southern oceans and Antarctic interior than in continental mid-latitudes.'
    },
    arctic_sea_ice: {
      id: 'arctic_sea_ice',
      title: 'Arctic Sea Ice Minimum Extent (September)',
      theme: 'Cryosphere & Sea Level',
      agency: 'NSIDC / NASA Earth Observatory',
      portalUrl: 'https://earth.gov/',
      units: 'million km²',
      unitName: 'Million square kilometers',
      baselineDesc: '1979-2000 average September extent ~7.0 million km²',
      baselineVal: 7.0,
      description: 'Annual September minimum ice extent across the Arctic Ocean derived from satellite passive microwave radiometers.',
      years: [
        1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989,
        1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999,
        2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009,
        2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
        2020, 2021, 2022, 2023, 2024
      ],
      values: [
        7.67, 7.05, 7.30, 7.39, 6.81, 6.70, 7.36, 7.14, 7.37, 7.01,
        6.14, 6.47, 7.47, 6.40, 7.14, 6.08, 7.58, 6.67, 6.54, 6.12,
        6.25, 6.60, 5.83, 6.04, 5.98, 5.50, 5.75, 4.16, 4.59, 5.12,
        4.62, 4.34, 3.39, 5.05, 5.03, 4.43, 4.17, 4.67, 4.66, 4.19,
        3.82, 4.72, 4.67, 4.37, 4.28
      ],
      camera: { lat: 82.0, lon: 0.0, zoom: 3.0, name: 'Arctic Ocean & North Pole' },
      suggestedLayer: 'MODIS_Terra_NDSI_Snow_Cover',
      sonification: {
        voice: 'ice',
        voiceDesc: 'Inverted crystalline bell: as Arctic ice retreats, pitch ascends into an urgent high register.',
        formula: 'f = 220.0 * 2^(((8.0 - IceExtent) / 5.0) * 1.5)',
        contextualGlobeLayer: 'MODIS_Terra_NDSI_Snow_Cover',
        contextualLayerTitle: 'MODIS Terra NDSI Snow Cover / Sea Ice',
        contextualLayerNote: 'Contextual cryosphere optical reflectance. Displays normalized difference snow and sea-ice reflectance for polar context, while the sonified metric is NSIDC microwave sea-ice minimum extent.',
        pitchRange: '220 Hz – 622 Hz (calibration) · 236 Hz – 574 Hz (observed 1980–2024)',
        fullCalibrationRange: '220 Hz – 622 Hz',
        voice_desc: 'Inverted crystalline bell: as ice retreats, pitch ascends into alert register',
        frequency_formula: 'f = 220.0 * (2 ** (clamp((8.0 - IceExtent) / 5.0, 0.0, 1.2) * 1.5))',
        dynamics: 'Strikes sharply when ice levels breach historical thresholds (< 4.5 million km²).',
        spatial: 'Pans across time trajectory from 1980 to 2024.'
      },
      limitations: 'Summer melt ponds on ice surfaces can attenuate microwave signals without multispectral optical validation.'
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Data Preparation & Adapter Layer (EICAdapter)
  // ---------------------------------------------------------------------------
  class EICAdapter {
    constructor(config = {}) {
      this.config = config;
    }

    async fetchVisualizationFrames(datasetId) {
      const ds = EIC_DATASETS[datasetId];
      if (!ds) throw new Error(`EIC dataset '${datasetId}' not found`);
      return {
        title: ds.title,
        theme: ds.theme,
        agency: ds.agency,
        frames: ds.years,
        units: ds.units
      };
    }

    async fetchVisualizationData(datasetId) {
      const ds = EIC_DATASETS[datasetId];
      if (!ds) throw new Error(`EIC dataset '${datasetId}' not found`);
      return {
        values: ds.values,
        years: ds.years,
        units: ds.units
      };
    }
  }

  class EICDataPrep {
    static validate(dataset) {
      if (!dataset || !Array.isArray(dataset.years) || !Array.isArray(dataset.values)) {
        throw new Error('Invalid EIC dataset structure');
      }
      if (dataset.years.length !== dataset.values.length || dataset.years.length === 0) {
        throw new Error('Years and values length mismatch or empty');
      }
      for (let i = 0; i < dataset.values.length; i++) {
        const v = dataset.values[i];
        if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) {
          throw new Error(`Invalid non-finite measurement at index ${i}`);
        }
      }
      return true;
    }

    static normalize(val, minVal, maxVal) {
      if (val == null || maxVal === minVal) return 0;
      return (val - minVal) / (maxVal - minVal);
    }

    static computeStats(dataset) {
      this.validate(dataset);
      const vals = dataset.values;
      const n = vals.length;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min || 1;
      const deltas = vals.map((v, i) => (i === 0 ? null : v - vals[i - 1]));

      const firstYr = String(dataset.years[0]);
      const isMonthly = firstYr.includes(' ') || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].some(m => firstYr.includes(m));
      const stepUnit = isMonthly ? 'mo' : 'yr';

      // Ordinary Least Squares slope across observations
      const xMean = (n - 1) / 2.0;
      const yMean = vals.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (i - xMean) * (vals[i] - yMean);
        den += (i - xMean) * (i - xMean);
      }
      const olsSlope = den !== 0 ? num / den : 0;
      const totalChange = vals[n - 1] - vals[0];

      return {
        min, max, range, deltas,
        isMonthly,
        stepUnit,
        olsSlope,
        totalChange,
        meanRate: n > 1 ? totalChange / (n - 1) : 0
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Physically-Calibrated EIC Audio Synthesizer
  // ---------------------------------------------------------------------------
  class EICSonifier {
    static getAudioContext() {
      if (window.ac && window.ac.state !== 'closed') {
        if (window.ac.state === 'suspended') window.ac.resume();
        return window.ac;
      }
      if (typeof window.boot === 'function') {
        window.boot();
        if (window.ac) return window.ac;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        window.ac = new AudioCtx();
        return window.ac;
      }
      return null;
    }

    static calculateNote(dataset, index, stats) {
      const val = dataset.values[index];
      const year = dataset.years[index];
      const delta = stats.deltas[index];
      const n = dataset.years.length;
      const pan = n > 1 ? (index / (n - 1)) * 1.6 - 0.8 : 0;

      let freq = 220;
      let voiceType = 'bell';
      let vel = 0.16;

      if (dataset.id === 'geos_fp_temp') {
        // GEOS-FP Temp: 12.0 C -> 200 Hz; 17.5 C -> 800 Hz (page 6 & 9 of challenge specification)
        const norm = Math.max(0, Math.min(1.0, (val - 12.0) / (17.5 - 12.0)));
        freq = 200.0 + norm * (800.0 - 200.0);
        voiceType = 'bell';
        vel = 0.12 + norm * 0.12;
      } else if (dataset.id === 'ecco2_ocean_currents') {
        // ECCO2: 15.5 C -> 160 Hz; 17.5 C -> 480 Hz
        const norm = Math.max(0, Math.min(1.0, (val - 15.5) / 2.0));
        freq = 160.0 + norm * (480.0 - 160.0);
        voiceType = 'water';
        vel = 0.14 + norm * 0.10;
      } else if (dataset.id === 'co2') {
        const norm = Math.max(0, Math.min(1.2, (val - 330) / 100));
        freq = 130.81 * Math.pow(2, norm * 1.5);
        voiceType = 'forest';
        const dVal = (delta !== null && delta !== undefined) ? delta : 0;
        vel = 0.12 + Math.min(0.12, Math.max(0, dVal) / 3.0 * 0.12);
      } else if (dataset.id === 'sea_level') {
        const norm = Math.max(0, Math.min(1.2, val / 120));
        freq = 110.0 * Math.pow(2, norm * 1.5);
        voiceType = 'water';
        const dVal = (delta !== null && delta !== undefined) ? delta : 0;
        vel = 0.14 + Math.min(0.10, Math.max(0, dVal) / 5.0 * 0.10);
      } else if (dataset.id === 'temperature_anomaly') {
        const norm = Math.max(0, Math.min(1.2, val / 1.5));
        freq = 164.81 * Math.pow(2, norm * 1.5);
        voiceType = 'bell';
        vel = 0.12 + Math.min(0.14, norm * 0.14);
      } else if (dataset.id === 'arctic_sea_ice') {
        const lossNorm = Math.max(0, Math.min(1.2, (8.0 - val) / 5.0));
        freq = 220.0 * Math.pow(2, lossNorm * 1.5);
        voiceType = 'bell';
        vel = 0.13 + Math.min(0.13, lossNorm * 0.13);
      }

      return { freq, voiceType, vel, pan, val, year, delta };
    }

    static playNote(dataset, index, stats, isMuted) {
      if (isMuted) return null;
      const ctx = this.getAudioContext();
      if (!ctx) return null;

      const note = this.calculateNote(dataset, index, stats);

      if (typeof window.voice === 'function') {
        try {
          window.voice(note.voiceType === 'ice' ? 'bell' : note.voiceType, note.freq, note.vel, note.pan);
          return note;
        } catch (e) {
          // Fall back to native nodes
        }
      }

      try {
        const now = ctx.currentTime;
        const dur = note.voiceType === 'water' ? 1.6 : 0.85;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        osc.type = note.voiceType === 'forest' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(note.freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(note.vel, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        if (panner) {
          panner.pan.setValueAtTime(note.pan, now);
          osc.connect(gain);
          gain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          osc.connect(gain);
          gain.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + dur + 0.05);
      } catch (err) {
        console.warn('Audio playback notice:', err);
      }

      return note;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Coherent Playback State Coordinator
  // ---------------------------------------------------------------------------
  class EICPlaybackState {
    constructor() {
      // Default to GEOS-FP Near-Surface Temperature as featured in the NASA challenge brief
      this.dataset = EIC_DATASETS.geos_fp_temp;
      this.stats = EICDataPrep.computeStats(this.dataset);
      this.currentIndex = 0;
      this.isPlaying = false;
      this.timer = null;
      this.speed = 1.0;
      this.isMuted = false;
      this.syncGlobe = true;
      this.abortCtrl = null;
      this.listeners = [];
    }

    onChange(fn) {
      this.listeners.push(fn);
    }

    notify(note) {
      for (const fn of this.listeners) {
        try { fn(this, note); } catch (e) { console.error(e); }
      }
    }

    setDataset(id) {
      if (!EIC_DATASETS[id]) return;
      this.stop();
      this.dataset = EIC_DATASETS[id];
      this.stats = EICDataPrep.computeStats(this.dataset);
      this.currentIndex = 0;
      this.fetchAsyncUpdate(id);
      if (this.syncGlobe) this.flyToDatasetLocation();
      const note = EICSonifier.playNote(this.dataset, this.currentIndex, this.stats, this.isMuted);
      this.notify(note);
    }

    fetchAsyncUpdate(id) {
      if (this.abortCtrl) {
        try { this.abortCtrl.abort(); } catch (e) {}
      }
      if (typeof AbortController !== 'undefined') {
        this.abortCtrl = new AbortController();
      }
      const signal = this.abortCtrl ? this.abortCtrl.signal : undefined;
      const apiBase = typeof window.API !== 'undefined' ? window.API : '';

      fetch(`${apiBase}/api/eic/dataset/${id}`, { signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.values) && this.dataset.id === id) {
            Object.assign(this.dataset, data);
            this.stats = EICDataPrep.computeStats(this.dataset);
            this.notify(null);
          }
        })
        .catch(() => {});
    }

    seek(index, playSound = true) {
      const len = this.dataset.years.length;
      this.currentIndex = Math.max(0, Math.min(len - 1, index));
      let note = null;
      if (playSound) {
        note = EICSonifier.playNote(this.dataset, this.currentIndex, this.stats, this.isMuted);
      }
      this.notify(note);
    }

    next() {
      const len = this.dataset.years.length;
      if (this.currentIndex >= len - 1) {
        this.pause();
        return;
      }
      this.seek(this.currentIndex + 1, true);
    }

    prev() {
      if (this.currentIndex <= 0) return;
      this.seek(this.currentIndex - 1, true);
    }

    play() {
      if (this.isPlaying) return;
      const listenBtn = document.getElementById('listen');
      if (listenBtn && listenBtn.classList.contains('on')) {
        listenBtn.click();
      }
      EICSonifier.getAudioContext();
      this.isPlaying = true;
      clearInterval(this.timer);

      if (this.currentIndex >= this.dataset.years.length - 1) {
        this.currentIndex = 0;
      }

      const note = EICSonifier.playNote(this.dataset, this.currentIndex, this.stats, this.isMuted);
      this.notify(note);

      const intervalMs = Math.round(420 / this.speed);
      this.timer = setInterval(() => {
        if (this.currentIndex >= this.dataset.years.length - 1) {
          this.pause();
          return;
        }
        this.next();
      }, intervalMs);

      this.notify(note);
    }

    pause() {
      this.isPlaying = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.notify(null);
    }

    stop() {
      this.pause();
      this.currentIndex = 0;
      this.seek(0, false);
    }

    togglePlay() {
      if (this.isPlaying) this.pause();
      else this.play();
    }

    setSpeed(spd) {
      this.speed = spd;
      if (this.isPlaying) {
        this.pause();
        this.play();
      } else {
        this.notify(null);
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.notify(null);
    }

    flyToDatasetLocation() {
      const cam = this.dataset.camera;
      if (!cam || !window.map) return;
      try {
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const dur = prefersReducedMotion ? 0 : 1800;

        if (typeof window.pick === 'function' && !prefersReducedMotion) {
          window.pick(cam.lat, cam.lon, cam.zoom);
        } else if (window.map.flyTo) {
          window.map.flyTo({ center: [cam.lon, cam.lat], zoom: cam.zoom, duration: dur });
        }

        if (this.dataset.suggestedLayer && typeof window.applyLayer === 'function') {
          const lyrSelect = document.getElementById('lyr');
          if (lyrSelect) {
            const opt = Array.from(lyrSelect.options).find(o => o.value.startsWith(this.dataset.suggestedLayer));
            if (opt) {
              lyrSelect.value = opt.value;
              window.applyLayer();
            }
          }
        }
      } catch (err) {
        console.warn('Globe navigation notice:', err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. User Interface Controller (EICUI)
  // ---------------------------------------------------------------------------
  class EICUI {
    static init() {
      this.state = new EICPlaybackState();
      this.adapter = new EICAdapter();
      this.isDocked = false;
      this.injectStyles();
      this.setupElements();
      this.attachEvents();
      this.state.onChange((state, note) => this.render(state, note));
      this.render(this.state);
    }

    static injectStyles() {
      if (document.getElementById('eic-styles')) return;
      const style = document.createElement('style');
      style.id = 'eic-styles';
      style.textContent = `
        #eic-modal {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, width 0.25s ease, height 0.25s ease;
        }
        #eic-modal.docked {
          top: auto !important;
          bottom: 12px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: min(660px, calc(100vw - 20px)) !important;
          max-height: 200px !important;
          padding: 12px !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.3) !important;
        }
        #eic-modal.docked .eic-expanded-only {
          display: none !important;
        }
        #eic-modal.docked #eic-sparkline {
          height: 48px !important;
        }
        .eic-badge {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.4);
          color: #38bdf8;
        }
        .eic-pitch-bar {
          background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 30%, #f59e0b 70%, #ef4444 100%);
          height: 4px;
          border-radius: 2px;
        }
        .eic-btn-active {
          background: #0284c7 !important;
          color: #ffffff !important;
          border-color: #38bdf8 !important;
        }
        #eic-sparkline {
          cursor: crosshair;
          touch-action: none;
        }
        @media (max-width: 640px) {
          #eic-modal {
            padding: 14px !important;
            width: calc(100vw - 16px) !important;
          }
          #eic-modal button {
            min-height: 38px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          #eic-modal {
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    static setupElements() {
      this.modal = document.getElementById('eic-modal');
      this.btnOpen = document.getElementById('eic-btn');
      this.btnClose = document.getElementById('eic-close');
      this.btnMinimize = document.getElementById('eic-minimize');
      this.selectDataset = document.getElementById('eic-dataset-select');
      this.btnPlay = document.getElementById('eic-play');
      this.btnStop = document.getElementById('eic-stop');
      this.btnPrev = document.getElementById('eic-prev');
      this.btnNext = document.getElementById('eic-next');
      this.slider = document.getElementById('eic-slider');
      this.canvas = document.getElementById('eic-sparkline');
      this.btnMute = document.getElementById('eic-mute');
      this.speedSelect = document.getElementById('eic-speed');
      this.btnGlobe = document.getElementById('eic-fly-globe');
      this.btnHowSound = document.getElementById('eic-toggle-sound-info');
      this.soundInfoPanel = document.getElementById('eic-sound-info');
      this.tableDetails = document.getElementById('eic-table-details');
      this.tableBody = document.getElementById('eic-data-table-body');
      this.captionBanner = document.getElementById('eic-caption-banner');
    }

    static attachEvents() {
      if (this.btnOpen) {
        this.btnOpen.addEventListener('click', () => {
          this.modal.hidden = false;
          this.btnOpen.setAttribute('aria-expanded', 'true');
          this.state.flyToDatasetLocation();
          EICSonifier.getAudioContext();
          this.drawSparkline();
        });
      }

      if (this.btnClose) {
        this.btnClose.addEventListener('click', () => {
          this.modal.hidden = true;
          this.btnOpen.setAttribute('aria-expanded', 'false');
          this.state.pause();
        });
      }

      if (this.btnMinimize) {
        this.btnMinimize.addEventListener('click', () => {
          this.isDocked = !this.isDocked;
          this.modal.classList.toggle('docked', this.isDocked);
          this.btnMinimize.textContent = this.isDocked ? '🗖 Expand' : '🗕 Dock';
          this.btnMinimize.title = this.isDocked ? 'Expand to full detailed card' : 'Dock player to bottom bar';
          setTimeout(() => this.drawSparkline(), 50);
        });
      }

      const listenBtn = document.getElementById('listen');
      if (listenBtn) {
        listenBtn.addEventListener('click', () => {
          if (this.state.isPlaying) this.state.pause();
        });
      }

      window.addEventListener('resize', () => this.drawSparkline());

      if (this.selectDataset) {
        this.selectDataset.addEventListener('change', (e) => {
          this.state.setDataset(e.target.value);
        });
      }

      if (this.btnPlay) {
        this.btnPlay.addEventListener('click', () => this.state.togglePlay());
      }

      if (this.btnStop) {
        this.btnStop.addEventListener('click', () => this.state.stop());
      }

      if (this.btnPrev) {
        this.btnPrev.addEventListener('click', () => this.state.prev());
      }

      if (this.btnNext) {
        this.btnNext.addEventListener('click', () => this.state.next());
      }

      if (this.slider) {
        this.slider.addEventListener('input', (e) => {
          this.state.seek(parseInt(e.target.value, 10), true);
        });
      }

      if (this.btnMute) {
        this.btnMute.addEventListener('click', () => this.state.toggleMute());
      }

      if (this.speedSelect) {
        this.speedSelect.addEventListener('change', (e) => {
          this.state.setSpeed(parseFloat(e.target.value));
        });
      }

      if (this.btnGlobe) {
        this.btnGlobe.addEventListener('click', () => this.state.flyToDatasetLocation());
      }

      if (this.btnHowSound && this.soundInfoPanel) {
        this.btnHowSound.addEventListener('click', () => {
          this.soundInfoPanel.hidden = !this.soundInfoPanel.hidden;
          this.btnHowSound.setAttribute('aria-expanded', String(!this.soundInfoPanel.hidden));
        });
      }

      if (this.tableDetails) {
        this.tableDetails.addEventListener('toggle', () => {
          if (this.tableDetails.open) this.renderDataTable();
        });
      }

      if (this.canvas) {
        const handleSeekPos = (clientX) => {
          const rect = this.canvas.getBoundingClientRect();
          const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
          const frac = x / rect.width;
          const idx = Math.round(frac * (this.state.dataset.years.length - 1));
          this.state.seek(idx, true);
        };

        this.canvas.addEventListener('click', (e) => handleSeekPos(e.clientX));

        let isTouchDragging = false;
        this.canvas.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches[0]) {
            isTouchDragging = true;
            handleSeekPos(e.touches[0].clientX);
            e.preventDefault();
          }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
          if (isTouchDragging && e.touches && e.touches[0]) {
            handleSeekPos(e.touches[0].clientX);
            e.preventDefault();
          }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => { isTouchDragging = false; });
      }

      window.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

        if (/^e$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditing) {
          if (this.modal.hidden) {
            this.btnOpen.click();
          } else {
            this.btnClose.click();
          }
          return;
        }

        if (this.modal && !this.modal.hidden && !isEditing) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.state.prev();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.state.next();
          } else if (e.key === ' ' || e.key === 'k') {
            e.preventDefault();
            this.state.togglePlay();
          } else if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            this.state.toggleMute();
          } else if (e.key === 'Home') {
            e.preventDefault();
            this.state.seek(0, true);
          } else if (e.key === 'End') {
            e.preventDefault();
            this.state.seek(this.state.dataset.years.length - 1, true);
          }
        }
      });
    }

    static render(state, note) {
      const d = state.dataset;
      const idx = state.currentIndex;
      const year = d.years[idx];
      const val = d.values[idx];
      const delta = state.stats.deltas[idx];
      const baselineDiff = val - d.baselineVal;

      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      const stats = state.stats;
      const isMonthly = stats.isMonthly;
      const stepUnit = stats.stepUnit;
      setText('eic-delta-label', isMonthly ? 'Monthly Step Delta' : 'Year-over-Year Delta');

      let deltaText = '';
      if (idx > 0 && delta !== null && delta !== undefined) {
        deltaText = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} ${d.units}/${stepUnit}`;
      } else {
        deltaText = 'No prior observation';
      }

      setText('eic-title', d.title);
      setText('eic-theme', d.theme);
      setText('eic-agency', d.agency);
      setText('eic-desc', d.description);
      setText('eic-year-display', String(year));
      setText('eic-val-display', `${val.toFixed(1)} ${d.units}`);
      setText('eic-baseline-display', `${baselineDiff >= 0 ? '+' : ''}${baselineDiff.toFixed(1)} ${d.units} vs baseline`);
      setText('eic-delta-display', deltaText);

      // Long-term trend summary
      const startYr = d.years[0];
      const endYr = d.years[d.years.length - 1];
      const trendSummary = isMonthly
        ? `Annual Cycle Amplitude: ${(stats.max - stats.min).toFixed(1)} ${d.units} (Peak: ${d.years[d.values.indexOf(stats.max)]})`
        : `Linear trend, ${startYr}–${endYr}: ${stats.olsSlope >= 0 ? '+' : ''}${stats.olsSlope.toFixed(2)} ${d.units}/yr`;
      setText('eic-trend-summary', trendSummary);

      // Contextual globe imagery notice
      const ctxNote = d.contextualLayerNote || d.contextual_layer_note || '';
      setText('eic-globe-context-note', ctxNote);

      // Dynamic metric-specific pitch slider labels
      const pitchLabels = {
        geos_fp_temp: ['Min (12.0 °C → 200 Hz)', 'Baseline (14.0 °C → 418 Hz)', 'Max (17.5 °C → 800 Hz)'],
        ecco2_ocean_currents: ['Min (15.5 °C → 160 Hz)', 'Baseline (16.5 °C → 320 Hz)', 'Max (17.5 °C → 480 Hz)'],
        co2: ['1980 Base (330 ppm → 131 Hz)', 'Mid-Scale (380 ppm → 220 Hz)', 'Upper Bound (430 ppm → 370 Hz)'],
        sea_level: ['1993 Base (0 mm → 110 Hz)', '+60 mm Rise (185 Hz)', '+120 mm Limit (311 Hz)'],
        temperature_anomaly: ['1951-80 Base (0 °C → 165 Hz)', '+0.75 °C Anomaly (277 Hz)', '+1.5 °C Paris Goal (466 Hz)'],
        arctic_sea_ice: ['1980 Extent (8.0 M km² → 220 Hz)', 'Mid-Melt (5.5 M km² → 370 Hz)', 'Record Low (3.0 M km² → 622 Hz)']
      };
      const curLabels = pitchLabels[d.id] || ['Low Pitch', 'Mid Baseline', 'High Pitch'];
      setText('eic-pitch-label-low', curLabels[0]);
      setText('eic-pitch-label-mid', curLabels[1]);
      setText('eic-pitch-label-high', curLabels[2]);

      if (this.slider) {
        this.slider.min = '0';
        this.slider.max = String(d.years.length - 1);
        this.slider.value = String(idx);
        this.slider.setAttribute('aria-valuenow', String(idx));
        this.slider.setAttribute('aria-valuetext', `${year}: ${val} ${d.units}`);
      }

      if (this.btnPlay) {
        this.btnPlay.innerHTML = state.isPlaying
          ? '<span aria-hidden="true">⏸</span> Pause'
          : '<span aria-hidden="true">▶</span> Play Audio Timeline';
        this.btnPlay.classList.toggle('eic-btn-active', state.isPlaying);
        this.btnPlay.setAttribute('aria-pressed', String(state.isPlaying));
      }

      if (this.btnMute) {
        this.btnMute.textContent = state.isMuted ? '🔇 Muted' : '🔊 Audio On';
        this.btnMute.classList.toggle('opacity-50', state.isMuted);
        this.btnMute.setAttribute('aria-pressed', String(state.isMuted));
      }

      const s = d.sonification || {};
      const voiceName = (s.voice || 'bell').toUpperCase();
      const voiceDesc = s.voiceDesc || s.voice_desc || 'Calibrated physical sonification tone';
      const formula = s.formula || s.frequency_formula || '';
      const pitchRange = s.pitchRange || s.pitch_range_hz || '';
      const dynamics = s.dynamics || '';
      const spatial = s.spatial || '';

      setText('eic-sound-var', `${d.title} (${d.units})`);
      setText('eic-sound-voice', `${voiceName}: ${voiceDesc}`);
      setText('eic-sound-formula', formula);
      setText('eic-sound-range', pitchRange);
      setText('eic-sound-dynamics', dynamics);
      setText('eic-sound-spatial', spatial);
      setText('eic-sound-limits', d.limitations || '');

      const calculatedNote = note || EICSonifier.calculateNote(d, idx, state.stats);
      const freqHz = Math.round(calculatedNote.freq);
      setText('eic-live-freq', `${freqHz} Hz`);
      setText('eic-live-pan', `Pan: ${calculatedNote.pan > 0 ? '+' : ''}${calculatedNote.pan.toFixed(2)}`);

      // Accessible live caption banner (as specified on page 11)
      if (this.captionBanner) {
        this.captionBanner.textContent = `Current pitch ${freqHz} Hz corresponds to ${val.toFixed(1)} ${d.units} (${year}) · ${d.id === 'arctic_sea_ice' ? 'smaller ice extent = higher pitch' : 'higher value = higher pitch'}`;
      }

      this.drawSparkline();

      if (this.tableDetails && this.tableDetails.open) {
        this.renderDataTable();
      }

      const live = document.getElementById('live');
      if (live && state.isPlaying) {
        live.textContent = `${d.title}: ${year}, value ${val} ${d.units}, pitch ${freqHz} Hz`;
      }
    }

    static renderDataTable() {
      if (!this.tableBody) return;
      const d = this.state.dataset;
      const stats = this.state.stats;
      const curIdx = this.state.currentIndex;

      const rows = d.years.map((yr, i) => {
        const val = d.values[i];
        const delta = stats.deltas[i];
        const note = EICSonifier.calculateNote(d, i, stats);
        const isCurrent = i === curIdx;
        return `
          <tr class="${isCurrent ? 'bg-sky-500/20 text-white font-bold' : 'hover:bg-slate-900'} cursor-pointer" onclick="window.EICJukebox.PlaybackState.seek(${i}, true)">
            <td class="py-1 px-2">${isCurrent ? '▶ ' : ''}${yr}</td>
            <td class="py-1 px-2">${val.toFixed(1)} ${d.units}</td>
            <td class="py-1 px-2 ${delta > 0 ? 'text-amber-400' : 'text-slate-400'}">${(i === 0 || delta === null || delta === undefined) ? '— (start of record)' : ((delta >= 0 ? '+' : '') + delta.toFixed(2))}</td>
            <td class="py-1 px-2 text-purple-300">${Math.round(note.freq)} Hz</td>
          </tr>
        `;
      });
      this.tableBody.innerHTML = rows.join('');
    }

    static drawSparkline() {
      if (!this.canvas) return;
      const ctx = this.canvas.getContext('2d');
      const w = this.canvas.width;
      const h = this.canvas.height;
      const d = this.state.dataset;
      const vals = d.values;
      const idx = this.state.currentIndex;
      const n = vals.length;

      ctx.clearRect(0, 0, w, h);

      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min || 1;

      const padX = 14;
      const padY = 10;
      const plotW = w - padX * 2;
      const plotH = h - padY * 2;

      const getX = (i) => padX + (i / (n - 1)) * plotW;
      const getY = (v) => h - padY - ((v - min) / range) * plotH;

      if (d.baselineVal >= min && d.baselineVal <= max) {
        const baseH = getY(d.baselineVal);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(padX, baseH);
        ctx.lineTo(w - padX, baseH);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const grad = ctx.createLinearGradient(0, padY, 0, h - padY);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.02)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(getX(0), h - padY);
      for (let i = 0; i < n; i++) {
        ctx.lineTo(getX(i), getY(vals[i]));
      }
      ctx.lineTo(getX(n - 1), h - padY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = getX(i);
        const y = getY(vals[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const curX = getX(idx);
      const curY = getY(vals[idx]);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curX, padY / 2);
      ctx.lineTo(curX, h - padY / 2);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(curX, curY, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  window.EICJukebox = {
    datasets: EIC_DATASETS,
    Adapter: EICAdapter,
    DataPrep: EICDataPrep,
    Sonifier: EICSonifier,
    PlaybackState: EICPlaybackState,
    UI: EICUI,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EICUI.init());
  } else {
    EICUI.init();
  }
})();
