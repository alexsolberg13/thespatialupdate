---
layout: story.njk
title: "Operation Absolute Resolve: How the US Captured Nicolás Maduro"
region: "Americas"
type: "military"
byline: "Updated March 2026 · Data: Wikipedia, NBC News, CNN, AS/COA, Airwars, Just Security"
coordinates: [-68.0, 8.0]
zoom: 4
projection: "mercator"
sidebarInclude: "sidebar-venezuela.njk"
related:
  - tag: "Iran · Military"
    title: "Strikes on Iran: From the Twelve-Day War to the 2026 Conflict"
    url: "/stories/iran-strikes/"
  - tag: "Gulf · Geopolitics"
    title: "Gulf State Relations: The Regional Power Balance"
    url: "/stories/gulf-state-relations/"
mapLayers: |
  const typeColors = {
    strike_caribbean: '#e05a4e',
    strike_pacific:   '#e07a4e',
    military_asset:   '#5b9bd5',
    tanker_seizure:   '#e8c87a',
    strike_venezuela: '#cf3e3e',
    capture:          '#3ecfb2',
    transfer:         '#3ecfb2',
    context:          '#888888'
  };

  const allTypes = Object.keys(typeColors);

  allTypes.forEach(t => {
    map.addLayer({
      id: t + '-glow', type: 'circle', source: 'story-data',
      filter: ['==', ['get', 'type'], t],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 1, 12, 5, 28],
        'circle-color': typeColors[t],
        'circle-opacity': 0.13,
        'circle-stroke-width': 0
      }
    });
    map.addLayer({
      id: t + '-layer', type: 'circle', source: 'story-data',
      filter: ['==', ['get', 'type'], t],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 1, 5, 5, 13],
        'circle-color': typeColors[t],
        'circle-opacity': 0.92,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.13)'
      }
    });
  });

  const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: '320px', offset: 14 });

  allTypes.forEach(t => {
    map.on('click', t + '-layer', (e) => {
      const p = e.features[0].properties;
      const color = typeColors[p.type] || '#888';
      popup.setLngLat(e.features[0].geometry.coordinates.slice()).setHTML(`
        <div class="popup-inner">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${color};margin-bottom:5px;font-family:Arial,sans-serif;font-weight:bold;">${p.actor} · ${p.date}</div>
          <div class="popup-title">${p.title}</div>
          <div class="popup-date">${p.killed > 0 ? '<span style="color:#e05a4e;">&#x25CF;</span> ' + p.killed + ' killed' : ''}</div>
          <div class="popup-desc">${p.description}</div>
        </div>
      `).addTo(map);
    });
    map.on('mouseenter', t + '-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', t + '-layer', () => { map.getCanvas().style.cursor = ''; });
  });

  applyFilters();
mapEvents: |
  window.applyFilters = function() {
    const phase = typeof getActivePhase === 'function' ? getActivePhase() : 'all';
    const toggles = typeof getLayerToggles === 'function' ? getLayerToggles() : {};

    const allTypes = ['strike_caribbean','strike_pacific','military_asset','tanker_seizure','strike_venezuela','capture','transfer','context'];

    allTypes.forEach(t => {
      const layerVisible = toggles[t] !== false;
      const phaseFilter = phase === 'all'
        ? ['==', ['get', 'type'], t]
        : ['all', ['==', ['get', 'type'], t], ['==', ['get', 'phase'], phase]];

      const visibility = layerVisible ? 'visible' : 'none';
      if (map.getLayer(t + '-layer')) {
        map.setLayoutProperty(t + '-layer', 'visibility', visibility);
        map.setLayoutProperty(t + '-glow', 'visibility', visibility);
        if (layerVisible) {
          map.setFilter(t + '-layer', phaseFilter);
          map.setFilter(t + '-glow', phaseFilter);
        }
      }
    });
  };
---
