---
layout: story.njk
title: "The August 2026 Eclipse: A Shadow's Path From the Arctic to a Spanish Sunset"
region: "Europe"
type: "geography"
byline: "Eclipse preview · Published 9 August 2026"
coordinates: [-16.0, 55.0]
zoom: 3.0
projection: "mercator"
sidebarInclude: "sidebar-august-2026-eclipse.njk"
mapLayers: |
  map.addLayer({ id:'band-fill', type:'fill', source:'story-data',
    filter:['==',['get','type'],'band'],
    paint:{'fill-color':'#e8c87a','fill-opacity':0.10}
  });
  map.addLayer({ id:'band-outline', type:'line', source:'story-data',
    filter:['==',['get','type'],'band'],
    paint:{'line-color':'#e8c87a','line-width':1,'line-opacity':0.35}
  });
  map.addLayer({ id:'centerline-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'centerline'],
    paint:{'line-color':'#e8c87a','line-width':3,'line-opacity':0.85,'line-dasharray':[4,2]}
  });
  map.addLayer({ id:'greatest-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'greatest'],
    paint:{'circle-radius':16,'circle-color':'#e8c87a','circle-opacity':0.16}
  });
  map.addLayer({ id:'greatest-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'greatest'],
    paint:{'circle-radius':6,'circle-color':'#e8c87a','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
  });
  map.addLayer({ id:'totality-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'totality'],
    paint:{'circle-radius':6,'circle-color':'#3ecfb2','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
  });
  map.addLayer({ id:'edge-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'edge'],
    paint:{'circle-radius':6,'circle-color':'#5b9bd5','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
  });
  map.addLayer({ id:'miss-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'miss'],
    paint:{'circle-radius':14,'circle-color':'#e05a4e','circle-opacity':0.14}
  });
  map.addLayer({ id:'miss-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'miss'],
    paint:{'circle-radius':6,'circle-color':'#e05a4e','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
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

  ['centerline-layer','greatest-layer','totality-layer','edge-layer','miss-layer'].forEach(id => {
    map.on('click', id, showPopup);
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor='pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor=''; });
  });
mapEvents: |
  document.getElementById('toggle-path').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['band-fill','band-outline','centerline-layer','greatest-layer','greatest-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-totality').addEventListener('change', (e) => {
    map.setLayoutProperty('totality-layer','visibility', e.target.checked ? 'visible' : 'none');
  });
  document.getElementById('toggle-edge').addEventListener('change', (e) => {
    map.setLayoutProperty('edge-layer','visibility', e.target.checked ? 'visible' : 'none');
  });
  document.getElementById('toggle-miss').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['miss-layer','miss-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
---

On 12 August 2026 the Moon's shadow sweeps across the top of the world and down
onto Europe <sup class="cite"><a href="./sources/#C1">1</a></sup> — and where it lands is a strip barely 294 kilometres
wide. <sup class="cite"><a href="./sources/#C3">3</a></sup> Inside that band the Sun disappears completely; a step outside it and
you get a partial eclipse and nothing more. Everything comes down to which side
of the line you stand on. <sup class="cite"><a href="./sources/#C16">16</a></sup> The path crosses eastern Greenland, clips
western Iceland, runs down the North Atlantic, and makes landfall over northern
Spain. <sup class="cite"><a href="./sources/#C1">1</a></sup>

The shadow moves fast and totality is short. At the point of greatest eclipse,
out in the Atlantic west of Iceland, it lasts 2 minutes and 18 seconds <sup class="cite"><a href="./sources/#C2">2</a></sup>;
almost everywhere else in the path, under two minutes. <sup class="cite"><a href="./sources/#C4">4</a></sup> Greenland and
Iceland catch it in the late afternoon; by the time it reaches Spain the Sun is
near setting. <sup class="cite"><a href="./sources/#C5">5</a></sup> A partial eclipse, however deep, is a different thing
entirely — the Sun is bitten into but never covered, so it never goes dark and
the corona never shows. <sup class="cite"><a href="./sources/#C15">15</a></sup>

Spain is where the eclipse meets the most people, and it meets them at sunset.
When the shadow reaches Galicia around 20:26 local time, the Sun sits just 11
degrees above the western horizon <sup class="cite"><a href="./sources/#C6">6</a></sup> — low enough that clear air out toward
the setting Sun matters more than the sky overhead. <sup class="cite"><a href="./sources/#C14">14</a></sup> It is the first total
eclipse over mainland Spain since 1905 <sup class="cite"><a href="./sources/#C10">10</a></sup>, and the first of three in three
years: 2026, 2027, 2028. <sup class="cite"><a href="./sources/#C12">12</a></sup>

The near-misses are the story. Bilbao, on the edge of the path, gets about 29
seconds. <sup class="cite"><a href="./sources/#C11">11</a></sup> Reykjavík, also near the boundary, about 59 — and the centerline
misses Icelandic land altogether. <sup class="cite"><a href="./sources/#C7">7</a></sup> Madrid and Barcelona, the country's two
biggest cities, will watch the Sun go 99.9% dark and still miss totality: 99.9%,
and on the wrong side of the line. <sup class="cite"><a href="./sources/#C9">9</a></sup> A Coruña, Oviedo, León, Burgos,
Zaragoza, Valencia and Palma fall inside it. <sup class="cite"><a href="./sources/#C8">8</a></sup>

The map traces the shadow from the Arctic to that Spanish sunset. The gold
dashed line is the centerline and the gold dot marks greatest eclipse; teal
points are cities inside totality, blue are the edge towns that barely make it,
and red are Madrid and Barcelona, just outside. Toggle the layers to see how
narrow the margin really is.
