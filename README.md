# Table & Thyme

Table & Thyme is a restaurant discovery and reservation web app. Search restaurants by state and city, choose a date and time, and manage saved reservations.

## Features

- Browse available states and cities and search for restaurants.
- View restaurant details and ratings.
- Reserve a table for a date up to seven days ahead and choose from available time slots.
- View and remove reservations saved in your browser.

## Getting started

Install the dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |

## Data and storage

Restaurant locations and restaurant listings are loaded from the app's configured restaurant data API. The API must be reachable for location search and restaurant results to load.

Reservations are stored in the browser's `localStorage`; they are local to that browser and are not sent to the restaurant data API.
