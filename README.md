Talentbank Event Calendar

A career fair event calendar built for Talentbank's 3-Day Prototype Challenge (AI & Automation Engineer track). It has two parts: a public calendar for browsing career fairs, and an admin panel that lets a non-technical events team member add, edit, or cancel events without touching code.

Live demo: talentbank-planer-harvind.vercel.app Admin panel: talentbank-planer-harvind.vercel.app/admin

The Challenge

Build a simple back end so a non-technical person, like someone on our events team, can add, edit, or move event dates without ever touching code. Think through what happens when events clash, get cancelled, or fill up.

Features

Public calendar

Interactive month calendar with color-coded dots marking dates that have events
Click a date to filter the list to that day
Filter by state, field, and year
Live "in X days" countdown per event
Automatic "Fully booked" state when capacity is reached

Admin panel

Add, edit, and cancel events through plain forms — no code required
Dependent State → Location dropdowns to keep data consistent
Clash detection: creating or editing an event checks for any other active event on the same date and blocks the save with a warning if one exists
Cancellation is non-destructive: cancelling sets a status field to cancelled instead of deleting the row, preserving history
Capacity tracking: each event tracks capacity vs registered_count, with a badge showing seats remaining or "Fully booked"
Search, filter, and sort the event list
Tech Stack
Next.js (App Router) — frontend and backend (API routes) in one project
Supabase (Postgres) — database and data access
Vercel — deployment, auto-redeploys on every push to main
Project Structure
app/
  page.tsx              # Public calendar
  admin/page.tsx         # Admin panel
  api/events/route.ts    # GET (list) and POST (create, with clash check)
  api/events/[id]/route.ts  # PUT (edit, with clash check) and DELETE (soft-cancel)
lib/
  supabase.ts             # Shared Supabase client
Running Locally
bash
git clone https://github.com/PookieChipss/talentbank_planer_harvind.git
cd talentbank_planer_harvind
npm install

Create a .env.local file with your own Supabase project credentials:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Then run the dev server:

bash
npm run dev

Open http://localhost:3000 for the public calendar, or http://localhost:3000/admin for the admin panel.

Database setup

The events table schema (run in Supabase's SQL Editor):

sql
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  location text,
  state text,
  field text,
  capacity integer,
  registered_count integer default 0,
  status text default 'active' check (status in ('active', 'cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
Scope Decisions

Built within a 3-day window, so a few things were deliberately left out:

No live location API — locations use a curated static list per state rather than a paid geolocation service, to avoid API key/billing setup for a prototype.
No public registration flow — capacity and "fully booked" state are modeled and displayed, but the actual multi-step registration form wasn't built, since the brief's core ask was the admin backend.
No authentication — the admin panel currently has open write access. A production version would lock writes to authenticated admin accounts via Supabase Row Level Security.

Built by Harvind Selvam for Talentbank's Junior AI & Automation Engineer prototype challenge.