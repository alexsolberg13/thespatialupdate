---
layout: story.njk
title: "The Red Sea Crisis: Trade Reroutes Around a War Zone"
region: "Middle East"
type: "economy"
byline: "Reference map · Updated July 2026"
coordinates: [43.4, 14.5]
zoom: 4.3
projection: "mercator"
sidebarInclude: "sidebar-red-sea.njk"
related:
  - tag: "Gulf · Economics"
    title: "The Strait of Hormuz: Oil's Most Critical Passage"
    url: "/stories/strait-of-hormuz/"
  - tag: "Iran · Military"
    title: "Strikes on Iran: From the Twelve-Day War to the 2026 Conflict"
    url: "/stories/iran-strikes/"
mapLayers: |
  map.addLayer({ id:'threatzone-fill', type:'fill', source:'story-data',
    filter:['==',['get','type'],'threatzone'],
    paint:{'fill-color':'#e05a4e','fill-opacity':0.1}
  });
  map.addLayer({ id:'threatzone-outline', type:'line', source:'story-data',
    filter:['==',['get','type'],'threatzone'],
    paint:{'line-color':'#e05a4e','line-width':1,'line-opacity':0.5,'line-dasharray':[2,2]}
  });
  map.addLayer({ id:'routes-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'route'],
    paint:{'line-color':'#5b9bd5','line-width':2,'line-opacity':0.7,'line-dasharray':[4,2]}
  });
  map.addLayer({ id:'diversion-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'diversion'],
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
  map.addLayer({ id:'attacks-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'attack'],
    paint:{'circle-radius':14,'circle-color':'#e05a4e','circle-opacity':0.14}
  });
  map.addLayer({ id:'attacks-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'attack'],
    paint:{'circle-radius':6,'circle-color':'#e05a4e','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
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

  ['chokepoint-layer','ports-layer','attacks-layer','routes-layer','diversion-layer'].forEach(id => {
    map.on('click', id, showPopup);
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor='pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor=''; });
  });
mapEvents: |
  document.getElementById('toggle-routes').addEventListener('change', (e) => {
    map.setLayoutProperty('routes-layer','visibility', e.target.checked ? 'visible' : 'none');
  });
  document.getElementById('toggle-diversion').addEventListener('change', (e) => {
    map.setLayoutProperty('diversion-layer','visibility', e.target.checked ? 'visible' : 'none');
  });
  document.getElementById('toggle-ports').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['ports-layer','ports-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-attacks').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['attacks-layer','attacks-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-threat').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['threatzone-fill','threatzone-outline'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
---

At its southern end the Red Sea narrows to the Bab-el-Mandeb — the
"Gate of Grief" — a strait barely 26 kilometres wide between Yemen and
the Horn of Africa. Above it lies the Suez Canal. Together they form the
shortest sea route between Asia and Europe, and in normal times carry
close to 12% of all global trade.

Since late 2023, Yemen's Houthi movement has used missiles, drones, and
small boats to attack merchant ships passing through the strait and the
Gulf of Aden, framing the campaign as pressure over the war in Gaza. The
result has been the largest disruption to global shipping since the
pandemic: most container lines abandoned the Red Sea altogether and now
send vessels the long way around the Cape of Good Hope — adding roughly
ten days and thousands of kilometres to every Asia–Europe voyage.

The map traces the geography of that decision. The blue line is the
route ships are avoiding; the gold line is the detour they take instead.
Click any marker for detail, and toggle the layers to isolate the ports,
the attack zone, or individual incidents.
