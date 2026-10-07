# Monitoring stack — local test, then Docker deploy

This directory holds everything that turns the downloaded Nagios Core 4.5.14
source into a working availability monitor, plus the Docker deployment:

```
┌──────────────────────┐      ┌───────────────────────────────────────────┐
│ browser:  available  │      │  nginx (ui)                               │
│ monitoring interface │─────▶│  /  → SPA (React)                         │
│ (port 8090)          │      │  /cgi-bin/ → proxy → nagios container     │
└──────────────────────┘      └───────────────┬───────────────────────────┘
                                              ▼
                              ┌───────────────────────────────────────────┐
                              │  Nagios Core 4.5.14 (built from THIS src) │
                              │  Apache + JSON CGIs (port 8080)            │
                              │  objects/generated/  ← exports land here  │
                              └───────────────────────────────────────────┘
```

Nagios Core is the check engine and alerting authority. The monitoring
interface (`../monitoring-ui`) is the operator surface: it renders targets as
Nagios objects, and reads availability back through `statusjson.cgi` /
`objectjson.cgi`.

---

## 1. Test locally (no Docker, no Linux needed)

The interface ships a **simulated monitor source** that needs no Nagios at all,
so the whole product can be tested on a Windows workstation today:

```bash
cd monitoring-ui
npm install
npm run dev        # http://localhost:5173, simulated mode
npm run test       # 34 unit + end-to-end component tests
npm run build      # production bundle + typecheck
```

In simulated mode the header shows **“Simulated data”**. The Settings screen
lets you switch scenarios (mixed / all-up / outage) so you can rehearse an
incident before a real one.

To test against a *real* Nagios without Docker, point the dev server's proxy at
a Nagios host:

```bash
# monitoring-ui/.env.local
VITE_NAGIOS_TARGET=http://<nagios-host>:8080
```

then set Base URL in Settings. For the Docker UI the base URL is `/` (the
nginx proxy), pre-set at build time via `VITE_DEFAULT_BASE_URL`.

---

## 2. Deploy with Docker

Requires Docker with BuildKit (Docker Desktop on Windows). The Nagios image
compiles Core 4.5.14 from this repository's source tree — what you downloaded
is exactly what runs.

```bash
# one-time: set a real admin password for anything beyond local use
export NAGIOS_ADMIN_PASSWORD='change-me-to-something-real'

docker compose -f monitoring/docker-compose.yml up --build -d
```

| Service       | URL                          | Notes                              |
| ------------- | ---------------------------- | ---------------------------------- |
| UI            | http://localhost:8090        | monitoring interface (nginx proxy) |
| Classic Nagios UI | http://localhost:8080/nagios | user `nagiosadmin`                 |
| Nagios CGI API    | http://localhost:8080/cgi-bin/statusjson.cgi | JSON API          |

First start creates `/usr/local/nagios/etc/htpasswd.users` with `nagiosadmin`
and the password from `NAGIOS_ADMIN_PASSWORD`. The entrypoint runs
`nagios -v` and **refuses to start** on invalid configuration.

### Apply monitored targets

1. In the UI: **Targets → Deploy configuration** → copy or download
   `hosts.cfg` and `services.cfg`.
2. Save them into `monitoring/nagios/objects/generated/` (on the host).
3. Validate and reload:

```bash
docker compose -f monitoring/docker-compose.yml exec nagios \
    /usr/local/nagios/bin/apply-generated.sh
```

`targets.cfg` in the generated directory documents this workflow. Disabled
targets are excluded from exports and shown as comments.

---

## 2b. Deploy on Railway

Railway's default builder (Railpack) cannot build this repository — it sees an
autotools C source tree with no `start.sh` and gives up. Each service must be
switched to the **Dockerfile** builder.

This is configured **in the Railway dashboard, not in a config file.** Railway
deprecated Config-as-Code: services that have never used it cannot opt in, so a
committed `railway.json` is silently ignored. Settings below are the source of
truth; keep this table in step with the dashboard by hand.

Two services, mirroring the compose stack:

### nagios service — the check engine

| Setting | Value |
| ------- | ----- |
| Source → Root Directory | *(empty — the Dockerfile copies the whole source tree)* |
| Build → Builder | `Dockerfile` |
| Build → Dockerfile Path | `/monitoring/docker/Dockerfile.nagios` |
| Deploy → Healthcheck Path | `/healthz` |
| Variable `NAGIOS_ADMIN_PASSWORD` | **required** — the entrypoint refuses to start without it |
| Variable `PORT` | `8080` — pin it so the ui service has a fixed address to target |

A clean start logs `Total Errors: 0`, `Starting Apache on port 8080...`, then
`Nagios 4.5.14 starting... (PID=1)`.

Optional, and skipped on a proof of concept: a volume at
`/usr/local/nagios/var`. Without one, every redeploy discards status, retention
and logs. Add it before the deployment is worth keeping history for.

Give this service a public domain only if you want the classic UI and the JSON
API reachable directly. They are behind Basic Auth either way, but the intended
shape is that only the ui service is public.

### ui service — the operator surface

| Setting | Value |
| ------- | ----- |
| Source → Root Directory | `/monitoring-ui` |
| Build → Builder | `Dockerfile` |
| Build → Dockerfile Path | *(empty — `Dockerfile` at the root directory)* |
| Variable `NAGIOS_UPSTREAM` | `http://${{nagios.RAILWAY_PRIVATE_DOMAIN}}:8080` |
| Networking | generate a public domain |

`PORT` is injected by Railway and consumed by the nginx template; do not set it.
Replace `nagios` in the variable reference with that service's actual name.

Operators open the ui domain, and the browser is challenged for Basic Auth on
the first CGI call: `nagiosadmin` and `NAGIOS_ADMIN_PASSWORD`.

### What is still not protected

The SPA itself is served to anyone who reaches the public domain; only the
Nagios CGIs behind it require credentials. See section 5.

---

## 3. What's monitored

Targets are one of three kinds, each mapping to a Nagios host + one service:

| Kind        | Typical check  | Nagios command          |
| ----------- | -------------- | ----------------------- |
| Device      | ICMP reachability | `monitor-ping`       |
| Application | HTTP(S) endpoint (path + expected status) | `monitor-http` / `monitor-https` |
| Service     | TCP port       | `monitor-tcp`           |
| Service     | DNS resolution (optional expected answer) | `monitor-dns` / `monitor-dns-expected` |

Hosts are deduplicated per address; every enabled target contributes one
service on its address's host. Tuning (intervals, attempts, thresholds) lives
in `nagios/objects/templates.cfg` and `commands.cfg`.

---

## 4. Files

```
nagios/nagios.cfg, cgi.cfg, resource.cfg   main + CGI + plugin-path config
nagios/objects/commands.cfg                check + notify commands
nagios/objects/templates.cfg               monitor-host / monitor-service
nagios/objects/contacts.cfg, timeperiods.cfg
nagios/objects/generated/                  UI exports land here (apply + reload)
docker/Dockerfile.nagios                   builds Core 4.5.14 from this repo
docker/entrypoint.sh                       validate → apache → nagios (PID 1)
docker/apache-nagios.conf                  /cgi-bin/ and /nagios/ aliases
docker-compose.yml                         nagios + ui stack
scripts/apply-generated.sh                 validate + reload on the Nagios host
../monitoring-ui/                          the interface (see its README)
```

---

## 5. Security notes (read before exposing anything)

- **CGIs require authentication.** `cgi.cfg` sets `use_authentication=1` and
  `apache-nagios.conf` guards `/cgi-bin/` and `/nagios/` with Basic Auth
  against `htpasswd.users`; the interface forwards those credentials on every
  JSON request. Both halves are needed: the CGIs authorise on `REMOTE_USER`,
  which only Apache's `AuthType` sets. The local default password is
  `nagiosadmin` — change it via `NAGIOS_ADMIN_PASSWORD`, which is mandatory on
  Railway.
- **The UI itself has no auth yet.** The nginx container serves the SPA to
  anyone who can reach port 8090. Put a real edge (auth proxy, SSO) in front
  of it for shared deployments; UI-level auth is a tracked follow-up.
- **No TLS inside the stack.** Credentials travel in Basic Auth; terminate TLS
  at the proxy/edge.
- Notification delivery needs a mail transport (`/usr/bin/mail`); images do
  not bundle one, so silent-review or disable `enable_notifications` until you
  install one (or wire the notify commands to your gateway).

## 6. Tested here vs. pending

Verified on the Windows workstation: TypeScript typecheck, unit tests, the
full component-level end-to-end smoke suite, production build, dev server.

Verified on a Linux host with Docker (2026-10-07):

- Both images build from a clean context.
- `nagios` starts, validates its configuration with 0 warnings / 0 errors, and
  runs its first check against the `monitoring-self` host.
- `/healthz` 200 unauthenticated; `/cgi-bin/statusjson.cgi` 401 without
  credentials and 200 with them; the classic UI at `/nagios/` renders.
- `ui` renders its nginx template, serves the SPA, and proxies authenticated
  CGI calls through to `nagios` over a container network — the same shape as
  Railway private networking.
- `PORT` injection works on both images; the Nagios entrypoint refuses to start
  on a platform deployment with no `NAGIOS_ADMIN_PASSWORD`.

**Still not exercised**: a real Railway deployment, and checks against real
targets (only the self-check has run). Known follow-ups: the final image is
~960MB because the build toolchain lives in an earlier layer that the trailing
`apt-get purge` cannot reclaim — a multi-stage build would cut it sharply; and
the SPA itself still has no authentication (section 5).