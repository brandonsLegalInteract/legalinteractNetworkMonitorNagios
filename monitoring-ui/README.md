# Availability Monitor (monitoring-ui)

A monitoring interface for **devices, applications and services**: point at an
address, choose what to check, and see — at a glance — whether it's available.
Nagios Core is the check engine; this app is the operator surface. It reads
availability through Nagios's JSON CGIs and renders the target registry into
real Nagios object configuration.

- React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4
- shadcn-style primitives (hand-authored, semantic colour tokens)
- Dark/light themes, keyboard-reachable controls, colour + text statuses

## Quick start

Requires Node.js ≥ 20 (developed on Node 24).

```bash
npm install
npm run dev        # open http://localhost:5173
npm run test       # unit + end-to-end component tests (runs in jsdom)
npm run typecheck
npm run build      # tsc --noEmit && vite build → dist/
```

### Simulated vs live

- **No base URL configured** → the app uses the built-in simulator
  (header badge: *Simulated data*). Choose a scenario in **Settings**
  (`mixed`, `all available`, `one outage`) to rehearse an incident.
- **Base URL `/`** → same-origin mode for Docker: the nginx proxy forwards
  `/cgi-bin/` to the Nagios container, and the browser authenticates with the
  credentials from Settings. This is what the Docker image bakes in via
  `VITE_DEFAULT_BASE_URL=/`.
- **Base URL `http://host:port`** → dev mode: the Vite dev server proxies
  `/cgi-bin/` (set `VITE_NAGIOS_TARGET` in `.env.local`), or the browser goes
  direct if the CGI path is publicly reachable (CORS permitting).

Credentials live in `sessionStorage` only — never written to disk.

## The target model

A **target** is one thing the operator cares about:

| Field | Meaning |
| --- | --- |
| `name` | Operator-facing name → Nagios `service_description` |
| `kind` | `device` \| `application` \| `service` |
| `address` | Hostname or IP → Nagios host (`host_name` is the slugified address) |
| `check` | `ping` \| `tcp` \| `http` \| `dns` |
| `port` / `path` / `secure` / `expectStatus` / `dnsRecordType` / `expectValue` | Check specifics |
| `checkIntervalMinutes` / `retryIntervalMinutes` / `maxAttempts` | Nagios scheduling |
| `enabled` | Excluded from exports and figures when off |

Availability is one combined severity — **available / degraded / unavailable /
unknown / pending** — so hosts and services read the same everywhere.

Hosts are **deduplicated by address** (`10.20.0.1` once, however many services
sit on it); the mapping is computed in one place (`domain/topology.ts`) and
used by both the config generator and the UI, so the two can never disagree.

## Export workflow

`Targets → Deploy configuration` renders the registry as `hosts.cfg` +
`services.cfg`:

```
define host {
    use          monitor-host
    host_name    10-20-3-20
    address      10.20.3.20
    hostgroups   monitoring-services
}

define service {
    use                  monitor-service
    host_name           10-20-3-20
    service_description Primary PostgreSQL
    check_command       monitor-tcp!5432
    ...
}
```

Copy/download the files, drop them into `monitoring/nagios/objects/generated/`,
validate (`nagios -v`) and reload. Rules guaranteed by tests: one service per
enabled target, disabled targets excluded, operator text scrubbed of `!` and
`;`, host groups per kind, slug collisions resolved deterministically.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with `/cgi-bin/` proxy |
| `npm run test` | Vitest: domain units + jsdom app smoke suite |
| `npm run typecheck` | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`) |
| `npm run build` | Typecheck + production build |

## Structure

```
src/domain/        types, status vocabulary, target model, host topology,
                   Nagios config generator (pure — fully unit tested)
src/data/          JSON CGI client (contract verified against this repo's source),
                   simulator, source selection
src/hooks/         settings/target registry (localStorage), polling, theme
src/features/      overview · targets · target detail · settings
src/components/    layout, primitives, status badges, availability bar
```

## Notes

- State is stored in the browser (localStorage); JSON backup/restore lives in
  the Deploy dialog. Server-side persistence is a tracked follow-up.
- The JSON CGI contract (`formatoptions=enumerate`, `details=true`, envelope
  `result.type_code === 0`) was verified directly against `cgi/statusjson.c`
  and `cgi/jsonutils.c` in the Nagios 4.5.14 source at the repository root.