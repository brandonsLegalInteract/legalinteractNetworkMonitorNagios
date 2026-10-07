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

- **CGIs require authentication.** `cgi.cfg` sets `use_authentication=1`; the
  interface forwards Basic Auth on every JSON request. The default password
  is `nagiosadmin` — change it via `NAGIOS_ADMIN_PASSWORD`.
- **The UI itself has no auth yet.** The nginx container serves the SPA to
  anyone who can reach port 8090. Put a real edge (auth proxy, SSO) in front
  of it for shared deployments; UI-level auth is a tracked follow-up.
- **No TLS inside the stack.** Credentials travel in Basic Auth; terminate TLS
  at the proxy/edge.
- Notification delivery needs a mail transport (`/usr/bin/mail`); images do
  not bundle one, so silent-review or disable `enable_notifications` until you
  install one (or wire the notify commands to your gateway).

## 6. Tested here vs. pending

Verified on this workstation (Windows, no Docker): TypeScript typecheck, unit
tests, the full component-level end-to-end smoke suite, production build, dev
server. **Not yet run**: the Docker build itself (no Docker on this machine)
and a live Nagios round trip — both are the first things to do on a host with
Docker, using the steps above. The plan file in `.project/project_plans/`
tracks both.