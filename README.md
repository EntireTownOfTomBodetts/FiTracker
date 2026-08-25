# Balanced Growth Tracker

A standalone household finance tracker \u2014 net worth, spending, investments, real estate, and a FIRE-style retirement projection. Built with React, Vite, Tailwind, and Recharts.

## Run it locally

1. Install [Node.js](https://nodejs.org) 18 or later if you don't have it.
2. In this folder:
   ```
   npm install
   npm run dev
   ```
3. Open the local URL it prints (usually `http://localhost:5173`).

## Build for production / host anywhere

```
npm run build
```

This outputs a static site to `dist/`. Drag that folder onto Netlify, deploy it to Vercel or GitHub Pages, or upload it to any static host \u2014 it's plain HTML/CSS/JS with no server required. `npm run preview` lets you test the production build locally first.

## Data & backups

All data is stored in your browser's `localStorage`, on this device only \u2014 nothing is sent anywhere. That means:

- It won't follow you to a different browser or computer automatically.
- Clearing your browser's site data will erase it.

Use the **Export data** button (Insights tab) periodically to download a `.json` backup, and **Import data** to restore it (same browser or a new one).

## Notes

- Fonts (Fraunces, IBM Plex Mono, Inter) load from Google Fonts at runtime; offline, it falls back to system fonts.
- The retirement projection is a simplified estimate based on your logged trajectory and the assumptions you set \u2014 not financial advice.
