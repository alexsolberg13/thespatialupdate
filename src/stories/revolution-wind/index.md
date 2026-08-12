---
layout: story.njk
title: "Revolution Wind: The Lease Line a Stop-Work Order Couldn't Erase"
region: "Americas"
type: "geography"
byline: "Updated August 2026 · Data: BOEM, federal court filings, Ørsted and Skyborn Renewables"
coordinates: [-71.06998, 41.14994]
zoom: 8.0
projection: "mercator"
sidebarInclude: "sidebar-revolution-wind.njk"
mapLayers: |
  map.addLayer({ id: 'lease-fill', type: 'fill', source: 'story-data',
    filter: ['==', ['get', 'type'], 'lease'],
    paint: { 'fill-color': '#5b9bd5', 'fill-opacity': 0.1 }
  });
  map.addLayer({ id: 'lease-outline', type: 'line', source: 'story-data',
    filter: ['==', ['get', 'type'], 'lease'],
    paint: { 'line-color': '#5b9bd5', 'line-width': 1.5, 'line-opacity': 0.8 }
  });
  map.addLayer({ id: 'turbine-layer', type: 'circle', source: 'story-data',
    filter: ['==', ['get', 'type'], 'turbine'],
    paint: { 'circle-radius': 3.5, 'circle-color': '#e8c87a', 'circle-opacity': 0.9,
      'circle-stroke-width': 1, 'circle-stroke-color': 'rgba(255,255,255,0.15)' }
  });
  map.addLayer({ id: 'substation-glow', type: 'circle', source: 'story-data',
    filter: ['==', ['get', 'type'], 'substation'],
    paint: { 'circle-radius': 14, 'circle-color': '#3ecfb2', 'circle-opacity': 0.16 }
  });
  map.addLayer({ id: 'substation-point', type: 'circle', source: 'story-data',
    filter: ['==', ['get', 'type'], 'substation'],
    paint: { 'circle-radius': 7, 'circle-color': '#3ecfb2', 'circle-opacity': 0.95,
      'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255,255,255,0.3)' }
  });
  map.addLayer({ id: 'cable-layer', type: 'line', source: 'story-data',
    filter: ['==', ['get', 'type'], 'cable'],
    paint: { 'line-color': '#3ecfb2', 'line-width': 2, 'line-opacity': 0.75, 'line-dasharray': [2, 1.5] }
  });
  map.addLayer({ id: 'landfall-glow', type: 'circle', source: 'story-data',
    filter: ['==', ['get', 'type'], 'landfall'],
    paint: { 'circle-radius': 14, 'circle-color': '#3ecfb2', 'circle-opacity': 0.14 }
  });
  map.addLayer({ id: 'landfall-point', type: 'circle', source: 'story-data',
    filter: ['==', ['get', 'type'], 'landfall'],
    paint: { 'circle-radius': 6, 'circle-color': '#3ecfb2', 'circle-opacity': 0.95,
      'circle-stroke-width': 1.5, 'circle-stroke-color': 'rgba(255,255,255,0.15)' }
  });

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  const storyPopup = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px', offset: 12 });

  function showStoryPopup(e) {
    const p = e.features[0].properties || {};
    const coords = e.features[0].geometry.type === 'Point'
      ? e.features[0].geometry.coordinates.slice() : e.lngLat;
    const tagHtml = p.stat ? '<div class="popup-tag">' + escapeHtml(p.stat) + '</div>' : '';
    storyPopup.setLngLat(coords).setHTML(
      '<div class="popup-inner">' +
        tagHtml +
        '<div class="popup-title">' + escapeHtml(p.title || 'Untitled') + '</div>' +
        '<div class="popup-desc">' + escapeHtml(p.description || '') + '</div>' +
      '</div>'
    ).addTo(map);
  }

  ['lease-fill', 'turbine-layer', 'substation-point', 'cable-layer', 'landfall-point'].forEach(function (id) {
    map.on('click', id, showStoryPopup);
    map.on('mouseenter', id, function () { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, function () { map.getCanvas().style.cursor = ''; });
  });
mapEvents: |
  const toggleLease = document.getElementById('toggle-lease');
  if (toggleLease) {
    toggleLease.addEventListener('change', function (e) {
      const v = e.target.checked ? 'visible' : 'none';
      ['lease-fill', 'lease-outline'].forEach(function (id) { map.setLayoutProperty(id, 'visibility', v); });
    });
  }
  const toggleTurbines = document.getElementById('toggle-turbines');
  if (toggleTurbines) {
    toggleTurbines.addEventListener('change', function (e) {
      map.setLayoutProperty('turbine-layer', 'visibility', e.target.checked ? 'visible' : 'none');
    });
  }
  const toggleCable = document.getElementById('toggle-cable');
  if (toggleCable) {
    toggleCable.addEventListener('change', function (e) {
      const v = e.target.checked ? 'visible' : 'none';
      ['substation-glow', 'substation-point', 'cable-layer', 'landfall-glow', 'landfall-point'].forEach(function (id) { map.setLayoutProperty(id, 'visibility', v); });
    });
  }
---

Roughly 13 nautical miles southeast of the Rhode Island coast, the federal government drew a line on a nautical chart it calls lease OCS-A 0486. [C1] Sixty-five wind turbines now stand inside that line, most of them already installed. [C2][C15] The project, Revolution Wind, is a 704-megawatt offshore wind farm split 400 megawatts to Rhode Island and 304 to Connecticut — enough electricity for more than 350,000 homes in the two states. [C3]

Ørsted and Global Infrastructure Partners' Skyborn Renewables are building it as a 50/50 joint venture. Eversource Energy, an original co-developer, sold its stake in 2024. [C5] The export cables come ashore at Quonset Point in North Kingstown, Rhode Island, and run about a mile underground to a newly built substation. [C4]

By last August the farm was roughly 80 percent built when the Department of the Interior ordered it to stop work, citing national security. [C6] A federal court let construction resume within weeks. [C7] Four months later, in December 2025, Interior tried again — this time folding Revolution Wind into a broader halt on every large offshore wind project still under construction, citing a classified Department of Defense assessment that the turbines could interfere with military radar. [C8][C11] Interior Secretary Doug Burgum defended the order: "The prime duty of the United States government is to protect the American people." [C12]

Revolution Wind was one of five East Coast wind farms hit with that December order, alongside Coastal Virginia Offshore Wind, Empire Wind, Sunrise Wind, and Vineyard Wind. [C18] Revolution Wind sued, and in January 2026 a federal judge granted a preliminary injunction, finding the company likely to win on the merits and likely to suffer irreparable harm if the order stood. [C9][C10] The court found Interior had failed to explain its abrupt reversal, and suggested the security rationale may have been pretextual. [C13] By early February, courts had struck down the stop-work order against all five projects. [C18]

Construction resumed again, and by March 2026 Revolution Wind was feeding electricity into the New England grid for the first time, with full commercial operation expected later this year. [C14][C16] Eversource, no longer an owner but still tied to the project's history, has booked tens of millions of dollars in charges linked to the two stop-work fights. [C17]

What the map shows is the gap between two versions of the same project: a federal lease boundary that exists on paper, and, inside it, a wind farm that exists in steel — and the five months in which a single federal agency tried to erase the second by rewriting the first, before courts said no, twice. [C19]
