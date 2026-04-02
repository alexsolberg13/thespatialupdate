---
layout: story.njk
title: "Strikes on Iran: From the Twelve-Day War to the 2026 Conflict"
region: "Middle East"
type: "military"
byline: "Updated March 2026 · Data: Wikipedia, Britannica, JINSA, IAEA, Al Jazeera"
coordinates: [53.0, 32.5]
zoom: 5
projection: "mercator"
sidebarInclude: "sidebar-iran-strikes.njk"
related:
  - tag: "Middle East · Economics"
    title: "The Strait of Hormuz: Oil's Most Critical Passage"
    url: "/stories/strait-of-hormuz/"
  - tag: "Middle East · Geopolitics"
    title: "Gulf State Relations: The Regional Power Balance"
    url: "/stories/gulf-state-relations/"
mapLayers: |
  const actorColors = {
    strike_us:     '#5b9bd5',
    strike_israel: '#e8c87a',
    strike_iran:   '#e05a4e'
  };

  ['strike_us','strike_israel','strike_iran'].forEach(t => {
    map.addLayer({
      id: t+'-glow', type: 'circle', source: 'story-data',
      filter: ['==',['get','type'],t],
      paint: {
        'circle-radius': ['interpolate',['linear'],['get','magnitude'],1,10,5,22],
        'circle-color': actorColors[t], 'circle-opacity': 0.12
      }
    });
    map.addLayer({
      id: t+'-layer', type: 'circle', source: 'story-data',
      filter: ['==',['get','type'],t],
      paint: {
        'circle-radius': ['interpolate',['linear'],['get','magnitude'],1,5,5,12],
        'circle-color': actorColors[t], 'circle-opacity': 0.9,
        'circle-stroke-width': 1.5, 'circle-stroke-color': 'rgba(255,255,255,0.12)'
      }
    });
  });

  const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: '320px', offset: 14 });

  ['strike_us-layer','strike_israel-layer','strike_iran-layer'].forEach(id => {
    map.on('click', id, (e) => {
      const p = e.features[0].properties;
      const colors = { strike_us:'#5b9bd5', strike_israel:'#e8c87a', strike_iran:'#e05a4e' };
      popup.setLngLat(e.features[0].geometry.coordinates.slice()).setHTML(`
        <div class="popup-inner">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${colors[p.type]};margin-bottom:4px;font-family:Arial,sans-serif;font-weight:bold;">${p.actor} strike</div>
          <div class="popup-title">${p.title}</div>
          <div class="popup-date">${p.date}</div>
          <div class="popup-desc">${p.description}</div>
        </div>
      `).addTo(map);
    });
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  });

  applyFilters();
mapEvents: |
  const phases = {
    twelve_day: {
      steps: [
        { label:'Jun 13, 2025', code:2025061300 },
        { label:'Jun 14, 2025', code:2025061400 },
        { label:'Jun 15, 2025', code:2025061500 },
        { label:'Jun 17, 2025', code:2025061700 },
        { label:'Jun 19, 2025', code:2025061900 },
        { label:'Jun 21, 2025', code:2025062100 },
        { label:'Jun 22, 2025', code:2025062200 },
        { label:'Jun 23, 2025', code:2025062300 },
        { label:'Jun 24, 2025', code:2025062400 }
      ],
      phaseCode: 'twelve_day', center: [51.5, 32.5], zoom: 5
    },
    war_2026: {
      steps: [
        { label:'Feb 28, 2026', code:2026022800 },
        { label:'Mar 5, 2026',  code:2026030500 },
        { label:'Mar 15, 2026', code:2026031500 },
        { label:'Mar 25, 2026', code:2026032500 },
        { label:'Mar 31, 2026', code:2026033100 }
      ],
      phaseCode: 'war_2026', center: [50.0, 30.0], zoom: 4.5
    },
    all: {
      steps: [
        { label:'Jun 2025', code:2025062400 },
        { label:'Mar 2026', code:2026033100 }
      ],
      phaseCode: 'all', center: [50.0, 30.0], zoom: 4.5
    }
  };

  let currentPhase = 'twelve_day';
  let currentStepIndex = 8;

  function applyFilters() {
    const phase = phases[currentPhase];
    const step  = phase.steps[currentStepIndex];
    document.getElementById('date-display').textContent = step.label;

    const vis = {
      strike_us:     document.getElementById('toggle-us').checked,
      strike_israel: document.getElementById('toggle-israel').checked,
      strike_iran:   document.getElementById('toggle-iran').checked
    };

    ['strike_us','strike_israel','strike_iran'].forEach(t => {
      if (!map.getLayer(t+'-layer')) return;
      const filter = currentPhase === 'all'
        ? ['==',['get','type'],t]
        : ['all',['==',['get','type'],t],['==',['get','phase'],phase.phaseCode]];
      map.setFilter(t+'-layer', filter);
      map.setFilter(t+'-glow',  filter);
      const v = vis[t] ? 'visible' : 'none';
      map.setLayoutProperty(t+'-layer', 'visibility', v);
      map.setLayoutProperty(t+'-glow',  'visibility', v);
    });

    const total = Object.values(vis).filter(Boolean).length;
    document.getElementById('event-count').innerHTML =
      `<span>${total > 0 ? '—' : '0'}</span> events visible`;
  }

  function setPhase(phase) {
    currentPhase = phase;
    currentStepIndex = phases[phase].steps.length - 1;
    document.querySelectorAll('.phase-tab').forEach(t => t.classList.remove('active'));
    const tabId = phase === 'twelve_day' ? 'tab-twelve' : phase === 'war_2026' ? 'tab-2026' : 'tab-all';
    document.getElementById(tabId).classList.add('active');
    const slider = document.getElementById('time-slider');
    slider.max = phases[phase].steps.length - 1;
    slider.value = currentStepIndex;
    document.getElementById('slider-min').textContent = phases[phase].steps[0].label;
    document.getElementById('slider-max').textContent = phases[phase].steps[phases[phase].steps.length-1].label;
    map.flyTo({ center: phases[phase].center, zoom: phases[phase].zoom, duration: 1000 });
    applyFilters();
  }

  document.getElementById('time-slider').addEventListener('input', (e) => {
    currentStepIndex = parseInt(e.target.value);
    applyFilters();
  });

  ['toggle-us','toggle-israel','toggle-iran'].forEach(id => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  setPhase('twelve_day');
---

What began as a precise Israeli nuclear strike campaign in June 2025
has escalated into a wider regional war. This map traces every documented
major strike — who launched it, what was targeted, and when.

Use the phase tabs to switch between the Twelve-Day War and the ongoing
2026 conflict. Click any marker for full sourced details.
