# GeoStory — Setup Instructions

## Before the map will work

Open `stories/iran-strikes/index.html` in VS Code and find this line:

  mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';

Replace `YOUR_MAPBOX_TOKEN_HERE` with your actual Mapbox token.

Get your token at: https://mapbox.com → log in → your account dashboard → "Default public token"
It starts with "pk."


## Previewing locally

1. Open the `geostory` folder in VS Code (File → Open Folder)
2. Install the "Live Server" extension if you haven't (search it in the Extensions panel)
3. Right-click `index.html` in the file panel → "Open with Live Server"
4. Your site opens in the browser at http://127.0.0.1:5500


## Adding real data

Edit `stories/iran-strikes/data.geojson` to replace the placeholder points
with real strike locations.

The easiest way to get real coordinates:
1. Go to https://geojson.io
2. Click the point tool and click your location on the map
3. Fill in the properties on the right (title, description, date, monthcode, magnitude)
4. Export → copy the GeoJSON and paste into data.geojson

The monthcode format is YYYYMM — so January 2025 = 202501, March 2025 = 202503, etc.


## Adding a new story

1. Create a new folder inside `stories/` (e.g. `stories/gulf-oil-flows/`)
2. Copy `index.html` and `data.geojson` from `iran-strikes/` into it
3. Edit the HTML content and replace the GeoJSON data
4. Add a new story card to the root `index.html`


## Putting it on GitHub Pages

1. Create a free account at github.com
2. Create a new repository (name it anything)
3. Upload all these files, or use Git from the terminal:

   git init
   git add .
   git commit -m "initial site"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main

4. In your GitHub repo: Settings → Pages → Source: Deploy from branch → main → Save
5. Your site will be live at: https://YOUR-USERNAME.github.io/YOUR-REPO/
