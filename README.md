# Equinox Notes

Equinox Notes is a September-inspired, local-first notebook that pairs a cozy writing experience with seasonal weather cues. The client is built with React, a handcrafted autumn palette, and Framer Motion-powered leaves, while a minimal Node edge service issues stateless JWTs for lightweight authentication.

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
| server | `npm run dev` | Starts the HTTP server with `tsx watch`. |
| server | `npm run build` | Compiles TypeScript to `dist`. |
| server | `npm start` | Runs the compiled server. |
| client | `npm run dev` | Starts the Vite + React dev server. |
| client | `npm run build` | Builds the client bundle. |
| client | `npm run test` | Placeholder that documents tests are currently disabled. |

## Environment variables

Create `server/.env` (or copy `server/.env.example`) and adjust as needed:

```bash
PORT=5174
JWT_SECRET="dev-secret-change-me"
CLIENT_ORIGIN="http://localhost:5173"
```

The client proxies `/auth/*` requests to `http://localhost:5174`, so no additional configuration is required for local development.

## Architecture overview

- **Server** (`/server`): A lightweight Node HTTP service written in TypeScript. It handles CORS, basic security headers, credential validation, and JWT issuance/verification (HS256) without relying on Express or external auth helpers. Routes available: `/auth/register`, `/auth/login`, and `/auth/me`.
- **Client** (`/client`): React (Vite) with Framer Motion for animation and a bespoke design system expressed in plain CSS. Auth state lives in a tiny custom store built on top of `useSyncExternalStore`, and notes persist per user in `localStorage` (`equinox:data:<userId>:notes`). Open-Meteo powers the weather panel, which nudges the warm vs. chilly gradient.
- **State & persistence**: Auth tokens are cached in both memory and `localStorage` (`equinox:auth`). Notes CRUD happens entirely on the client, with debounced persistence through a custom `useLocalStore` hook.

## How authentication works

The server issues signed JWTs (`HS256`) with the payload `{ sub, username, aud: "equinox", iss: "equinox-server" }`. Registration and login only validate the input and return a token plus the computed user identity; they do not create records. The client stores the token locally and calls `/auth/me` on boot to verify it. Since everything is device-scoped, deleting `localStorage` resets the experience.

## Copilot usage

GitHub Copilot assisted with small TypeScript snippets (for example, shaping reusable helpers), but all security-sensitive logic, validation, and UI structure were implemented and reviewed manually to stay aligned with the prompt.

## What I learned

- Building a local-first UX where the backend only handles authentication while the client owns persistence.
- Respecting accessibility preferences, such as disabling animations when `prefers-reduced-motion` is enabled.
- Crafting a cohesive seasonal theme without utility frameworks, and wiring Open-Meteo data into the visual mood of the app.
- Keeping a monorepo tidy when server and client share tooling but have very different runtime constraints.
