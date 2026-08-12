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

The federal government drew a line on a nautical chart, about 13 miles off the Rhode Island coast, and called it lease OCS-A 0486. <sup class="cite"><a href="./sources/#C1">1</a></sup> Sixty-five wind turbines stand inside that line now — most of them already up. <sup class="cite"><a href="./sources/#C2">2</a>,<a href="./sources/#C15">15</a></sup> The project, Revolution Wind, is rated at 704 megawatts, split 400 to Rhode Island and 304 to Connecticut: enough for more than 350,000 homes. <sup class="cite"><a href="./sources/#C3">3</a></sup>

Ørsted and Global Infrastructure Partners' Skyborn Renewables are building it, a 50/50 joint venture. Eversource, an original partner, sold out its stake in 2024. <sup class="cite"><a href="./sources/#C5">5</a></sup> The cables come ashore at Quonset Point in North Kingstown and run underground about a mile to a new substation. <sup class="cite"><a href="./sources/#C4">4</a></sup>

Last August, with the farm roughly 80 percent built, the Department of the Interior ordered it stopped — national security, the agency said. <sup class="cite"><a href="./sources/#C6">6</a></sup> A federal court let work resume within weeks. <sup class="cite"><a href="./sources/#C7">7</a></sup> Four months later Interior tried again, this time folding Revolution Wind into a halt on every large offshore wind project still under construction, citing a classified Pentagon assessment that the turbines could interfere with military radar. <sup class="cite"><a href="./sources/#C8">8</a>,<a href="./sources/#C11">11</a></sup> Interior Secretary Doug Burgum framed it plainly: "The prime duty of the United States government is to protect the American people." <sup class="cite"><a href="./sources/#C12">12</a></sup>

It wasn't the only project caught in that order — Coastal Virginia Offshore Wind, Empire Wind, Sunrise Wind, and Vineyard Wind were hit too. <sup class="cite"><a href="./sources/#C18">18</a></sup> Revolution Wind sued. In January a federal judge granted a preliminary injunction, ruling the company was likely to win on the merits and likely to suffer real harm if the order stood — and found that Interior had never explained its own about-face, suggesting the security rationale might have been invented after the fact. <sup class="cite"><a href="./sources/#C9">9</a>,<a href="./sources/#C10">10</a>,<a href="./sources/#C13">13</a></sup> By early February, courts had struck the order down for all five projects. <sup class="cite"><a href="./sources/#C18">18</a></sup>

Construction picked back up, and by March Revolution Wind was sending power into the New England grid for the first time. Full commercial operation is expected later this year. <sup class="cite"><a href="./sources/#C14">14</a>,<a href="./sources/#C16">16</a></sup> Eversource — no longer an owner, but still on the hook for the history — has taken tens of millions of dollars in charges tied to the two stop-work fights. <sup class="cite"><a href="./sources/#C17">17</a></sup>

What the map is really showing is the gap between two versions of the same project: a lease boundary that exists on paper, and, inside it, a wind farm that exists in steel. For five months, one federal agency tried to erase the second by rewriting the first. Twice, the courts said no. <sup class="cite"><a href="./sources/#C19">19</a></sup>
