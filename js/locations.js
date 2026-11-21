// Predefined location data for MessHunt (West Medinipur focus)
// Maintainable list: add new locations here. Available even without DB records.
(function () {
  const PREDEFINED_LOCATIONS = [
    { name: 'Midnapore (Medinipur)', district: 'Paschim Medinipur', type: 'main', lat: 22.4235, lng: 87.3210 },
    { name: 'Kharagpur', district: 'Paschim Medinipur', type: 'main', lat: 22.3397, lng: 87.3250 },
    { name: 'Tantigeria', district: 'Midnapore • Near Vidyasagar University', type: 'locality', lat: 22.4304, lng: 87.3025 },
    { name: 'Rangamati', district: 'Midnapore • Near Paramedical College & V.U.', type: 'locality', lat: 22.4292, lng: 87.2998 },
    { name: 'Raja Bazar', district: 'Midnapore • Near Midnapore College', type: 'locality', lat: 22.4216, lng: 87.3258 },
    { name: 'Ashok Nagar', district: 'Midnapore • Central Town', type: 'locality', lat: 22.4192, lng: 87.3178 },
    { name: 'Saratpally', district: 'Midnapore • Residential Area', type: 'locality', lat: 22.4198, lng: 87.3138 },
    { name: 'Mahatabpur', district: 'Midnapore • Near Judges Court', type: 'locality', lat: 22.4158, lng: 87.3195 },
    { name: 'Boxibazar', district: 'Midnapore • Patnabazar Area', type: 'locality', lat: 22.4172, lng: 87.3282 },
    { name: 'Baisakhipally', district: 'Midnapore • V.U. Road', type: 'locality', lat: 22.4322, lng: 87.3012 },
    { name: 'Inda', district: 'Kharagpur • Near Kharagpur College', type: 'locality', lat: 22.3485, lng: 87.3348 },
    { name: 'Puratan Bazar', district: 'Kharagpur • Near Station Road', type: 'locality', lat: 22.3432, lng: 87.3280 },
    { name: 'Vidyasagarpur', district: 'Kharagpur • Panchberia Road', type: 'locality', lat: 22.3542, lng: 87.3312 },
    { name: 'Subhaspally', district: 'Kharagpur • Near Kharagpur Junction', type: 'locality', lat: 22.3375, lng: 87.3295 },
    { name: 'Rabindrapally', district: 'Kharagpur • Near IIT Bypass Road', type: 'locality', lat: 22.3240, lng: 87.3170 },
    { name: 'Ghatal', district: 'Paschim Medinipur', type: 'main', lat: 22.6675, lng: 87.7347 },
    { name: 'Chandrakona', district: 'Paschim Medinipur', type: 'main', lat: 22.7336, lng: 87.5150 },
    { name: 'Debra', district: 'Paschim Medinipur', type: 'main', lat: 22.3833, lng: 87.5500 },
    { name: 'Garbeta', district: 'Paschim Medinipur', type: 'main', lat: 22.8631, lng: 87.3586 },
    { name: 'Salboni', district: 'Paschim Medinipur', type: 'main', lat: 22.6428, lng: 87.3275 },
    { name: 'Keshpur', district: 'Paschim Medinipur', type: 'main', lat: 22.5539, lng: 87.4667 },
    { name: 'Dantan', district: 'Paschim Medinipur', type: 'main', lat: 21.9461, lng: 87.2708 },
    { name: 'Pingla', district: 'Paschim Medinipur', type: 'main', lat: 22.2736, lng: 87.5861 },
    { name: 'Narayangarh', district: 'Paschim Medinipur', type: 'main', lat: 22.1528, lng: 87.3917 },
    { name: 'Jhargram', district: 'Jhargram (nearby regional)', type: 'nearby-regional', note: 'Nearby regional location, not part of Paschim Medinipur.', lat: 22.4550, lng: 86.9974 },
  ];

  function getLocationNames() {
    return PREDEFINED_LOCATIONS.map(l => l.name);
  }

  function searchLocations(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return PREDEFINED_LOCATIONS.slice(0, 10);
    return PREDEFINED_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.district || '').toLowerCase().includes(q)
    );
  }

  function inferCoordinates(text) {
    const q = String(text || '').toLowerCase();
    for (const loc of PREDEFINED_LOCATIONS) {
      const cleanName = loc.name.split('(')[0].trim().toLowerCase();
      if (cleanName && q.includes(cleanName)) {
        return { lat: loc.lat, lng: loc.lng };
      }
    }
    if (q.includes('medinipur') || q.includes('midnapore')) return { lat: 22.4235, lng: 87.3210 };
    if (q.includes('kharagpur') || q.includes('kgp')) return { lat: 22.3397, lng: 87.3250 };
    return { lat: 22.4235, lng: 87.3210 };
  }

  window.MHLocations = { PREDEFINED_LOCATIONS, getLocationNames, searchLocations, inferCoordinates };
})();
