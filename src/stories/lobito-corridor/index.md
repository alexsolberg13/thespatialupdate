---
layout: story.njk
title: "The Lobito Corridor: Which Ocean Africa's Copper Flows To"
region: "Africa"
type: "economy"
byline: "Reference map · Updated August 2026"
coordinates: [26.0, -11.0]
zoom: 3.8
projection: "mercator"
sidebarInclude: "sidebar-lobito-corridor.njk"
mapLayers: |
  map.addLayer({ id:'corridor-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'corridor'],
    paint:{'line-color':'#e8c87a','line-width':3,'line-opacity':0.9}
  });
  map.addLayer({ id:'extension-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'extension'],
    paint:{'line-color':'#e8c87a','line-width':2,'line-opacity':0.6,'line-dasharray':[3,2]}
  });
  map.addLayer({ id:'tazara-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'tazara'],
    paint:{'line-color':'#5b9bd5','line-width':2.5,'line-opacity':0.75,'line-dasharray':[4,2]}
  });
  map.addLayer({ id:'feeder-layer', type:'line', source:'story-data',
    filter:['==',['get','type'],'feeder'],
    paint:{'line-color':'#9a958c','line-width':1.8,'line-opacity':0.7,'line-dasharray':[2,2]}
  });
  map.addLayer({ id:'ports-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'port'],
    paint:{'circle-radius':14,'circle-color':'#3ecfb2','circle-opacity':0.13}
  });
  map.addLayer({ id:'ports-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'port'],
    paint:{'circle-radius':6,'circle-color':'#3ecfb2','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
  });
  map.addLayer({ id:'mines-glow', type:'circle', source:'story-data',
    filter:['==',['get','type'],'mine'],
    paint:{'circle-radius':13,'circle-color':'#e05a4e','circle-opacity':0.14}
  });
  map.addLayer({ id:'mines-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'mine'],
    paint:{'circle-radius':6,'circle-color':'#e05a4e','circle-opacity':0.95,
      'circle-stroke-width':1.5,'circle-stroke-color':'rgba(255,255,255,0.15)'}
  });
  map.addLayer({ id:'junction-layer', type:'circle', source:'story-data',
    filter:['==',['get','type'],'junction'],
    paint:{'circle-radius':5,'circle-color':'#9a958c','circle-opacity':0.95,
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

  ['corridor-layer','extension-layer','tazara-layer','feeder-layer','ports-layer','mines-layer','junction-layer'].forEach(id => {
    map.on('click', id, showPopup);
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor='pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor=''; });
  });
mapEvents: |
  document.getElementById('toggle-lobito').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['corridor-layer','extension-layer'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-tazara').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['tazara-layer','feeder-layer','junction-layer'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-ports').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['ports-layer','ports-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
  document.getElementById('toggle-mines').addEventListener('change', (e) => {
    const v = e.target.checked ? 'visible' : 'none';
    ['mines-layer','mines-glow'].forEach(id => map.setLayoutProperty(id,'visibility',v));
  });
---

The Central African Copperbelt holds one of the world's densest concentrations
of copper and cobalt, and the Democratic Republic of the Congo alone mines
roughly 72% of the world's cobalt. But the Copperbelt is landlocked,
and for decades its ore has left the continent mostly by heading east and south
— toward ports like Dar es Salaam on the Indian Ocean. The Lobito Corridor
is a bet that it can go the other way.

The corridor's spine is the Benguela Railway: a roughly 1,300-kilometre line
from the Atlantic port of Lobito, in Angola, running east to Luau on the DRC
border and on toward the mines around Kolwezi. A consortium of
Trafigura, Mota-Engil and Vecturis operates it under a 30-year concession Angola
awarded in 2022, taking the line over in 2024.

The financing agreements were signed in December 2025 and reached financial
close on 31 July 2026 at $786 million — of which $553 million comes from the
U.S. Development Finance Corporation and $200 million from the Development Bank
of Southern Africa. The money is meant to lift the port's
mineral-handling capacity roughly tenfold, to 4.6 million tonnes a year, and cut
the cost of moving critical minerals by up to 30%. Washington frames the
investment as "securing critical minerals for mutual U.S.–Africa benefit."

A second, harder project would extend the corridor with roughly 830 kilometres
of new track — across Angola from Luacano to the Zambian border at Jimbe, then
through Zambia to the Copperbelt town of Chingola. It is further off: the
line is still out to engineering-and-construction bidding, with groundbreaking
expected in late 2026 or early 2027 and its own financing not due to close until
2027.

Running the other way is TAZARA, the 1,860-kilometre railway China built in the
1970s to give Zambian copper an outlet at Dar es Salaam, bypassing white-ruled
Rhodesia and South Africa. In late 2025 China signed a roughly $1.4
billion deal to modernise it. The result is a map on which the same
landlocked ore can now be pulled toward either coast — west to the Atlantic on a
U.S.- and EU-backed line, or east to the Indian Ocean on a Chinese-backed one —
turning a single mineral belt into a contest between two oceans and two blocs.

The map shows both pulls: the gold line is the Lobito Corridor and its planned
Zambian extension; the blue line is TAZARA to Dar es Salaam. Toggle the layers
to isolate the mining hubs or either ocean's port.
