// Predefined location data for MessHunt (West Medinipur focus)
// Maintainable list: add new locations here. Available even without DB records.
(function () {
  const PREDEFINED_LOCATIONS = [
    { name: 'Midnapore (Medinipur)', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Ghatal', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Chandrakona', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Debra', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Kharagpur', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Garbeta', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Salboni', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Keshpur', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Dantan', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Pingla', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Narayangarh', district: 'Paschim Medinipur', type: 'main' },
    { name: 'Jhargram', district: 'Jhargram (nearby regional)', type: 'nearby-regional', note: 'Nearby regional location, not part of Paschim Medinipur.' },
  ];

  function getLocationNames() {
    return PREDEFINED_LOCATIONS.map(l => l.name);
  }

  function searchLocations(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return PREDEFINED_LOCATIONS.slice(0, 8);
    return PREDEFINED_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.district || '').toLowerCase().includes(q)
    );
  }

  window.MHLocations = { PREDEFINED_LOCATIONS, getLocationNames, searchLocations };
})();
