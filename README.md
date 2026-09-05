# Transport Schedule

Web app for transport scheduling, orders, and origin/destination confirmations.

## Phase 1

- Role-based login and access control
- Schedule list scoped by user hub
- Multi-SJ order creation per schedule
- Printable order PDF (21 cm × 11 cm, landscape)
- Confirmation workflow for origin departure and destination arrival
- Order history
- Super User master-data management (CSV or single record)
- 90-day data retention cleanup
- Browser state/cache with a maximum 1-hour TTL

## Planned stack

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL + RLS
- Tailwind CSS
- Browser local storage/session state for short-lived UI cache
