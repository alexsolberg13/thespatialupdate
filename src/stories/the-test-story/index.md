---
layout: story.njk
title: "The Test Story"
region: "Europe"
type: "economy"
byline: "Updated July 2026 · Data: add your sources here"
coordinates: [4.488773008816489, 47.660929965920836]
zoom: 10.0
projection: "mercator"
sidebarInclude: "sidebar-the-test-story.njk"
mapLayers: |
  map.addLayer({
    id: 'story-dot', type: 'circle', source: 'story-data',
    paint: {
      'circle-radius': 7,
      'circle-color': '#e8c87a',
      'circle-opacity': 0.92,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(255,255,255,0.15)'
    }
  });

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  const storyPopup = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px', offset: 12 });

  map.on('click', 'story-dot', function (e) {
    const p = e.features[0].properties || {};
    const tagHtml = p.stat ? '<div class="popup-tag">' + escapeHtml(p.stat) + '</div>' : '';
    storyPopup.setLngLat(e.features[0].geometry.coordinates.slice()).setHTML(
      '<div class="popup-inner">' +
        tagHtml +
        '<div class="popup-title">' + escapeHtml(p.title || 'Untitled') + '</div>' +
        '<div class="popup-desc">' + escapeHtml(p.description || '') + '</div>' +
      '</div>'
    ).addTo(map);
  });

  map.on('mouseenter', 'story-dot', function () { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'story-dot', function () { map.getCanvas().style.cursor = ''; });
mapEvents: |
  const togglePoints = document.getElementById('toggle-points');
  if (togglePoints) {
    togglePoints.addEventListener('change', function (e) {
      map.setLayoutProperty('story-dot', 'visibility', e.target.checked ? 'visible' : 'none');
    });
  }
---

Replace this paragraph with your opening: what happened, where, and why it matters.

Replace this paragraph with background and context. Keep it short -- readers can explore the map for the details.
