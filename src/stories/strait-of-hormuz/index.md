---
layout: story.njk
title: "The Strait of Hormuz: Oil's Most Critical Passage"
region: "Middle East"
type: "economy"
byline: "Reference map · Updated March 2026"
coordinates: [54.0, 26.0]
zoom: 5.5
projection: "mercator"
sidebarInclude: "sidebar-hormuz.njk"
related:
  - tag: "Middle East · Military"
    title: "Strikes on Iran: From the Twelve-Day War to the 2026 Conflict"
    url: "/stories/iran-strikes/"
  - tag: "Middle East · Geopolitics"
    title: "Gulf State Relations: The Regional Power Balance"
    url: "/stories/gulf-state-relations/"
mapLayers: |
  map.addLayer({ id:'zone-fill', type:'fill', source:'story-data',
    filter:['==',['get','type'],'zone'],
    paint:{'fill-color':'#5b9bd5','fill-opacity':0.08}
  });
  map.addLayer({ id:'iranzone-fill', type:'fill', source:'story-data',
    filter:['==',['get','type'],'iranzone'],
    paint:{'fill-color':'#e05a4e','fill-opacity':0.1}
  });
  map.addLayer({ id:'iranzone-outline', type:'line', source:'story-data',
    filter:['==',['get','type'],'iranzone'],
    paint:{'line-color':'#e05a4e','line-width':1,'line-opacity':0.5,'line-dasharray':[2,2]}
  });
  map.addLayer({ id:'routes-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'route'],
    paint:{'line-color':'#5b9bd5','line-width':2,'line-opacity':0.7,'line-dasharray':[4,2]}
  });
  map.addLayer({ id:'pipelines-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'pipeline'],
    paint:{'line-color':'#e8c87a','line-width':2.5,'line-opacity':0.8,'line-dasharray':[3,2]}
  });
  map.addLayer({ id:'ports-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'port'],
    paint:{'circle-radius':12,'circle-color':'#3ecfb2','circle-opacity':0.12}
  });
  map.addLayer({ id:'ports-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'port'],
    paint:{'circle-radius':6,'circle-color':'#3ecfb2','circle-opacity':0.9,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.1)'}
  });
  map.addLayer({ id:'chokepoint-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'chokepoint'],
    paint:{'circle-radius':18,'circle-color':'#e8c87a','circle-opacity':0.15}
  });
  map.addLayer({ id:'chokepoint-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'chokepoint'],
    paint:{'circle-radius':9,'circle-color':'#e8c87a','circle-opacity':1,
      'circle-stroke-width':2,'circle-stroke-color':'rgba(255,255,255,0.2)'}
  });

  const popup = new mapboxgl.Popup({ closeButton:true, maxWidth:'280px', offset:12 });

  function showPopup(e) {
    const p = e.features[0].properties;
    const coords = e.features[0].geometry.type === 'Point'
      ? e.features[0].geometry.coordinates.slice() : e.lngLat;
    const stat = p.stat
      ? `<div style="font-size:11px;color:#8a6b20;font-family:Arial,sans-serif;font-weight:bold;padding:0 0 8px;border-bottom:1px solid #e0ddd8;margin-bottom:8px;">${p.stat}</div>`
      : '';
    popup.setLngLat(coords).setHTML(`
      <div class="popup-inner">
        <div class="popup-title">${p.title}</div>
        ${stat}
        <div class="popup-desc">${p.description}</div>
      </div>
    `).addTo(map);
  }

  ['chokepoint-layer','ports-layer','routes-layer','pipelines-layer'].forEach(id => {
    map.on('click', id, showPopup);
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor='pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor=''; });
  });
mapEvents: |
  document.getElementById('toggle-routes').addEventListener('change', (e) => {
    map.setLayoutProperty('routes-layer','visibility', e.target.checked ? 'visible' : 'none');
  });
  document.getElementById('toggle-pipelines').addEventListener('change', (e) => {
    map.setLayoutProperty('pipelines-layer','visibility', e.target.checked ? 'visible' : 'none');
  });
  document.getElementById('toggle-ports').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['ports-layer','ports-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-zones').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['zone-fill','iranzone-fill','iranzone-outline'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
---

Every day, roughly 21 million barrels of oil — about one fifth of global
supply — pass through a corridor barely 3 kilometres wide at its narrowest
point. The Strait of Hormuz is the single most important chokepoint in
the world's energy system.

Iran's coastline runs along the entire northern shore. Any conflict
involving Iran immediately raises the question of whether traffic
through the Strait might be disrupted.

Click any marker or route for details. Toggle layers to focus on specific
dimensions of the picture. The dashed gold lines show bypass pipelines
built specifically so Gulf states can export without passing through the Strait.
