---
layout: story.njk
title: "Gulf State Relations: The Regional Power Balance"
region: "Middle East"
type: "news"
byline: "Reference map · Updated March 2026"
coordinates: [46.0, 28.0]
zoom: 4.2
projection: "mercator"
sidebarInclude: "sidebar-gulf.njk"
related:
  - tag: "Middle East · Military"
    title: "Strikes on Iran: From the Twelve-Day War to the 2026 Conflict"
    url: "/stories/iran-strikes/"
  - tag: "Middle East · Economics"
    title: "The Strait of Hormuz: Oil's Most Critical Passage"
    url: "/stories/strait-of-hormuz/"
mapLayers: |
  const stanceColors = {
    opposed:'#e05a4e', neutral:'#888888',
    mediator:'#3ecfb2', aligned:'#e8c87a', iran:'#cc4400'
  };
  const colorExpr = ['match',['get','stance'],
    'opposed',stanceColors.opposed,'neutral',stanceColors.neutral,
    'mediator',stanceColors.mediator,'aligned',stanceColors.aligned,
    'iran',stanceColors.iran,'#888'
  ];

  map.addLayer({ id:'states-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'state'],
    paint:{'circle-radius':18,'circle-opacity':0.12,'circle-color':colorExpr}
  });
  map.addLayer({ id:'states-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'state'],
    paint:{'circle-radius':9,'circle-opacity':0.9,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.12)',
      'circle-color':colorExpr}
  });
  map.addLayer({ id:'proxies-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'proxy'],
    paint:{'circle-radius':13,'circle-color':stanceColors.aligned,'circle-opacity':0.1}
  });
  map.addLayer({ id:'proxies-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'proxy'],
    paint:{'circle-radius':6,'circle-color':stanceColors.aligned,'circle-opacity':0.75,
      'circle-stroke-width':1.5,'circle-stroke-color':stanceColors.aligned,'circle-stroke-opacity':0.4}
  });
  map.addLayer({ id:'bases-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'usbase'],
    paint:{'circle-radius':12,'circle-color':'#5b9bd5','circle-opacity':0.15}
  });
  map.addLayer({ id:'bases-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'usbase'],
    paint:{'circle-radius':5,'circle-color':'#5b9bd5','circle-opacity':0.9,
      'circle-stroke-width':2,'circle-stroke-color':'#5b9bd5','circle-stroke-opacity':0.5}
  });

  const popup = new mapboxgl.Popup({ closeButton:true, maxWidth:'310px', offset:14 });
  const stanceLabels = {
    opposed:'Opposed to Iran', neutral:'Neutral / hedging',
    mediator:'Mediator', aligned:'Iranian-aligned', iran:'Iran'
  };

  ['states-layer','proxies-layer','bases-layer'].forEach(id => {
    map.on('click', id, (e) => {
      const p = e.features[0].properties;
      const color = stanceColors[p.stance] || '#5b9bd5';
      const stanceHtml = p.stance
        ? `<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${color};margin-bottom:5px;font-family:Arial,sans-serif;font-weight:bold;">${stanceLabels[p.stance]||p.stance}</div>`
        : `<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#5b9bd5;margin-bottom:5px;font-family:Arial,sans-serif;font-weight:bold;">US military base</div>`;
      const statsHtml = p.gdp
        ? `<div style="display:flex;gap:10px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e0ddd8;">
            <div style="font-size:10px;color:#666;font-family:Arial,sans-serif;"><span style="display:block;color:#333;font-weight:bold;margin-bottom:1px;">GDP</span>${p.gdp}</div>
            <div style="font-size:10px;color:#666;font-family:Arial,sans-serif;"><span style="display:block;color:#333;font-weight:bold;margin-bottom:1px;">Military</span>${p.military}</div>
          </div>` : '';
      popup.setLngLat(e.features[0].geometry.coordinates.slice()).setHTML(`
        <div class="popup-inner">
          ${stanceHtml}
          <div class="popup-title">${p.title}</div>
          ${statsHtml}
          <div class="popup-desc">${p.description}</div>
        </div>
      `).addTo(map);
    });
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor='pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor=''; });
  });
mapEvents: |
  document.getElementById('toggle-states').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['states-layer','states-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-proxies').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['proxies-layer','proxies-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-bases').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['bases-layer','bases-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
---

The Middle East's geopolitical landscape is defined by a fundamental
tension between Iran and a coalition of Arab Gulf states, with the
United States as the dominant external power and a network of proxies
extending the conflict across the wider region.

Click any country or base marker for a full profile. Toggle layers to
isolate specific dimensions of the regional picture.
