# Volley Score Live App

Live volleyball scoreboard with:
- Required login for every viewer
- Admin-only score controls
- Real-time updates via Socket.IO
- Optional Redis adapter for horizontal scale

## Tech stack
- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- Auth: JWT

## Quick start
1. Install dependencies:
   - `npm install --workspaces`
2. Copy env templates:
   - `cp apps/server/.env.example apps/server/.env`
   - `cp apps/client/.env.example apps/client/.env`
3. Start backend:
   - `npm run dev:server`
4. Start frontend:
   - `npm run dev:client`

Client runs on http://localhost:5173 and server on http://localhost:4000.

## Production with Docker

### 1) Prepare environment
1. Create server env file:
   - `cp apps/server/.env.example apps/server/.env`
2. Set strong values in `apps/server/.env`:
   - `JWT_SECRET` must be changed.
   - `CLIENT_ORIGIN` should include your public frontend origin (for example `https://mojo-pravah.sa-fet.com`).
   - If you scale sockets across multiple server instances, set `USE_REDIS_ADAPTER=true` and verify `REDIS_URL`.

### 2) Build and start containers
- `docker compose build`
- `docker compose up -d`

Exposed ports:
- Frontend container: `localhost:4173`
- Backend container: `localhost:4000`

### 2.1) Caddy reverse proxy (two domains)
Use this Caddy configuration on your host:

```caddy
mojo-pravah.sa-fet.com {
   reverse_proxy localhost:4173
}

mojo-pravah-backend.sa-fet.com {
   reverse_proxy localhost:4000
}
```

The Docker client build is configured to call:
- API: `https://mojo-pravah-backend.sa-fet.com/api`
- Socket.IO: `https://mojo-pravah-backend.sa-fet.com`

### 3) Stop containers
- `docker compose down`

### Optional Redis profile
By default Redis is not started. To start Redis from compose as well:
- `docker compose --profile redis up -d`

When using Redis, set `USE_REDIS_ADAPTER=true` in `apps/server/.env`.

## Demo accounts
- Admin: admin@volley.local / Admin@123
- Viewer: viewer@volley.local / Viewer@123

Viewers can also register a new account from the login page.

## API summary
- POST /api/auth/register
- POST /api/auth/login
- GET /api/match/current (auth required)
- PATCH /api/match/score (admin only)
- PATCH /api/match/reset (admin only)

## Scale for 2000 concurrent users
This codebase is already prepared with Socket.IO and efficient event fan-out. For 2000 concurrent users in production, run this setup:

1. Deploy at least 2 backend instances behind a load balancer.
2. Enable WebSocket sticky sessions at the load balancer.
3. Set `USE_REDIS_ADAPTER=true` and provide `REDIS_URL`.
4. Put score state in a shared store (Redis or database) if you run multiple instances.
5. Add managed monitoring (latency, socket count, memory, CPU).
6. Add autoscaling rules and a rolling deployment strategy.

## Production hardening recommendations
- Move users and scores from memory to PostgreSQL/Redis.
- Rotate JWT secret and reduce token lifetime if needed.
- Add refresh tokens and logout invalidation.
- Add admin audit logs.
- Add integration/load tests (k6 or Artillery) with 2000 socket clients.
