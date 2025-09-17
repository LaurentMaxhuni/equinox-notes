# Equinox Notes

Equinox Notes is a September-inspired, local-first notebook that pairs a cozy writing experience with seasonal weather cues. The frontend blends React, Tailwind, and Framer Motion for the falling-leaves ambiance, while an Express edge service issues stateless JWTs for lightweight authentication.

## Screenshots

_Coming soon — once the foliage settles in, drop screenshots here to capture the warm and chilly themes._

## Quick start

```bash
# install workspace dependencies
npm install

# launch both the server (5174) and client (5173)
npm run dev
```

### Available scripts

| Location | Command | Description |
| --- | --- | --- |
| root | `npm run dev` | Runs server & client concurrently. |
| server | `npm run dev` | Starts Express with `tsx watch`. |
| server | `npm run build` | Compiles TypeScript to `dist`. |
| server | `npm start` | Runs the compiled server. |
| client | `npm run dev` | Starts Vite + React dev server. |
| client | `npm run build` | Builds the client bundle. |
| client | `npm run test` | Executes Vitest unit tests. |

## Environment variables

Create `server/.env` (or copy `server/.env.example`) and adjust as needed:

```bash
PORT=5174
JWT_SECRET="dev-secret-change-me"
CLIENT_ORIGIN="http://localhost:5173"
```

The client proxies `/auth/*` requests to `http://localhost:5174`, so no additional configuration is required for local development.

## Architecture overview

- **Server** (`/server`): TypeScript + Express, with Helmet, CORS, Morgan, and Zod validation. It exposes `/auth/register`, `/auth/login`, and `/auth/me`, returning stateless JWTs with a 7-day expiration. User IDs are derived deterministically from the username, and no data is persisted on the backend.
- **Client** (`/client`): React (Vite) with Tailwind for theming, Framer Motion for the leaf animations, and Zustand for auth state. Notes are stored per-user in `localStorage` (`equinox:data:<userId>:notes`) to honor the local-first requirement. Open-Meteo powers the weather panel, which influences the warm vs. chilly gradient.
- **State & persistence**: Auth tokens live in both memory (Zustand) and `localStorage` (`equinox:auth`). Notes CRUD happens entirely on the client, with debounced persistence through a custom `useLocalStore` hook.

## How authentication works

The server issues signed JWTs (`HS256`) with the payload `{ sub, username, aud: "equinox", iss: "equinox-server" }`. Registration and login only validate the input and return a token plus the computed user identity; they do not create records. The client stores the token locally and calls `/auth/me` on boot to verify it. Since everything is device-scoped, deleting `localStorage` resets the experience.

## Copilot usage

GitHub Copilot was used sparingly to scaffold repetitive TypeScript typings and Tailwind utility combinations. All security-sensitive logic (JWT shaping, validation, storage interactions) and the overall architecture were implemented and reviewed manually to match the prompt requirements.

## What I learned

- How to wire a local-first UX where the backend only handles authentication while the client owns persistence.
- Techniques for respecting accessibility preferences, such as disabling animations when `prefers-reduced-motion` is enabled.
- Managing shared theme state derived from external APIs (Open-Meteo) and reflecting it across layout, animations, and tone.
- Structuring a Vite/React monorepo with shared tooling (Vitest, Tailwind) while keeping server and client concerns cleanly separated.
