# Equinox Notes

Equinox Notes is a September-inspired, local-first notebook that pairs a cozy writing experience with weather-aware moods. A TypeScript Express edge issues stateless JWTs, while the Vite + React client keeps notes in `localStorage`, animates falling leaves, and shifts its gradient theme based on the forecast.

## Screenshots

_Place screenshots of the warm and chilly themes here once the foliage is camera-ready._

## Quick start

```bash
# install workspace dependencies
npm install

# run the Express auth edge (5174) and the Vite client (5173)
npm run dev
```

### Available scripts

| Location | Command | Description |
| --- | --- | --- |
| root | `npm run dev` | Starts server & client concurrently. |
| root | `npm run build` | Builds server then client bundles. |
| root | `npm run lint` | Runs the client ESLint configuration. |
| server | `npm run dev` | Watches and restarts the Express server with `tsx`. |
| server | `npm run build` | Compiles TypeScript to `dist`. |
| server | `npm start` | Launches the compiled server. |
| client | `npm run dev` | Starts the Vite + React dev server. |
| client | `npm run build` | Builds the production bundle. |
| client | `npm run test` | Executes Vitest unit tests for utilities. |

## Environment variables

Create `server/.env` (or copy `server/.env.example`) with:

```bash
PORT=5174
JWT_SECRET="dev-secret-change-me"
CLIENT_ORIGIN="http://localhost:5173"
```

The client proxies `/auth/*` to `http://localhost:5174`, so no further configuration is required for local development.

## Architecture overview

- **Server** (`/server`): Node 20+, Express, and Zod validate credentials, sign HS256 JWTs (`aud: "equinox"`, `iss: "equinox-server"`, `exp: 7d`), and expose `/auth/register`, `/auth/login`, and `/auth/me`. Helmet, CORS, and morgan provide security headers, origin filtering, and request logging.
- **Client** (`/client`): React + Vite with Tailwind, Framer Motion, and Zustand. Auth state persists in-memory and to `localStorage` (`equinox:auth`), notes live at `equinox:data:<userId>:notes`, and the UI animates 18 SVG leaves while respecting reduced-motion preferences.
- **Weather**: Uses Open-Meteo (`current_weather=true`) with geolocation (fallback to Pristina) to determine `{ tempC, mood, partOfDay }`. Mood selects the gradient (`warm` or `chilly`), and part of day colours the copy.
- **Notes**: Searchable, local-first CRUD with keyboard shortcuts (Ctrl+N, Ctrl+S, `/`), Markdown preview, and import/export JSON helpers.

## How authentication works

The server validates `{ username, password }` (3–24 characters, alphanumeric/underscore usernames; 8–72 character passwords) but stores nothing. It derives a stable user ID from `sha256(username).slice(0, 16)` and signs a JWT containing `{ sub, username, aud, iss }`. The client stores `{ token, user }` in a Zustand store and `localStorage`, verifies tokens on boot via `/auth/me`, and clears state on logout.

## Copilot usage

GitHub Copilot assisted with Tailwind class composition and TypeScript scaffolding, but credential validation, JWT handling, and UI structure were written and reviewed manually to stay aligned with the specification.

## What I learned

- Aligning a local-first experience with a stateless authentication edge while keeping the monorepo tooling simple.
- Mixing Tailwind utility design with handcrafted glassmorphism to achieve a cozy September aesthetic.
- Respecting accessibility preferences (reduced motion) and keyboard shortcuts while persisting data entirely in the browser.
