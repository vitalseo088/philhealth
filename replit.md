# PhilHealth Guide

## Project overview

PhilHealth Guide is an independent, static HTML/CSS/JavaScript information resource. It is intentionally not an official PhilHealth site and does not access private member records. The app runs with a static server and uses a shared renderer in `assets/js/app.js`.

## Run locally

```bash
python3 -m http.server 5000
```

Open `index.html` through the server. The Replit preview workflow uses the same command on port 5000.

## Updating data

The local data layer is in `data/site-data.js`. Add a record only after checking the current official source, and preserve its `status`, `source`, source URL, effective/review date and explanatory fields. Keep uncertain facts as `needs-review`; do not present invented rates, benefit amounts, facilities, addresses, phone numbers or hours as verified. When no verified local record is available, the UI should link to the official directory instead of showing a sample row.

## Adding pages and tools

Static route files live at the URL they serve, especially under `tools/` and `guides/`. Add a thin HTML entry file that loads `/assets/css/styles.css`, `/data/site-data.js`, and `/assets/js/app.js`, then add the route renderer and navigation/search links in `assets/js/app.js`. Keep calculations and filters local, explain the result, and include a source/status panel.

## User preferences

- Prefer plain HTML5, CSS3 and vanilla JavaScript.
- Keep the experience editorial, trustworthy, accessible and mobile-friendly.
- Never imply official PhilHealth ownership, affiliation, endorsement or access to private records.