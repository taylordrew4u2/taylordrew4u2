# Taylor Drew

### iOS & Full-Stack Developer · New York City

I build production software for creative work that happens in real time —
native iOS apps, full-stack web products, and tools that run live comedy shows
and film shoots while they are happening.

[Email](mailto:taylordrew4u@gmail.com) ·
[The Bit Binder on the App Store](https://apps.apple.com/us/app/the-bitbinder/id6756085897) ·
[Role-Call](https://rolecall.space) ·
[Bill Spilt](https://billspilt.com) ·
[Showrunner](https://icanrunashow.com)

---

## The code in this repository

[![CI](https://github.com/taylordrew4u2/taylordrew4u2/actions/workflows/ci.yml/badge.svg)](https://github.com/taylordrew4u2/taylordrew4u2/actions/workflows/ci.yml)

This repo is both my profile and a working product:
**[pinsandneedlescomedy.com](https://pinsandneedlescomedy.com)**, the site for a
live stand-up show in Ridgewood, Queens, and the admin its producers use to run
it. Next.js 16, React 19, TypeScript, Tailwind 4 — **and no database.**

It is worth a look because the constraints are real rather than illustrative:
the people editing it are comedians on a phone, the audience hits it forty at a
time during one bar hour, and it has to cost nothing to run.

- **Content is one JSON document merged over compiled-in defaults**, so a new
  field ships without a migration and a fresh deploy is already a finished site.
  Three interchangeable storage drivers — local filesystem, a private GitHub
  repo via the Contents API, or Vercel Blob — selected by which secrets exist.
- **Audience submissions are one file each.** Forty people scanning the same QR
  code in the same minute would lose writes against a shared array, so there is
  nothing to contend over.
- **The live count is a directory listing, not a read of every file.** The first
  version would have exhausted GitHub's hourly API limit inside the first minute
  of a show. Ids carry a sortable timestamp, so counting is one call at any pile
  size.
- **Show times are New York wall-clock**, resolved against the zone's real
  offset for the date, so the DST changeover needs no maintenance.
- **The admin fails closed.** Credential policy lives in a module with no
  framework imports — so it is tested directly — and without both secrets set in
  production, every login is refused and every cookie stops verifying.
- **129 tests on the Node test runner.** No test framework and no transpile
  step, because the logic worth testing lives in plain modules. CI runs lint,
  typecheck, tests and a production build on every pull request.

**→ [Read the architecture notes](docs/ARCHITECTURE.md)** for the decisions and
what each one cost. [Deployment guide](docs/DEPLOYMENT.md).

---

## Other work

### [The Bit Binder](https://github.com/taylordrew4u2/The-Bit-Binder) · [App Store](https://apps.apple.com/us/app/the-bitbinder/id6756085897)

Native iOS app for stand-up comedians to capture, organize, record, transcribe
and refine material. SwiftUI, SwiftData, CloudKit, on-device transcription.

### [Showrunner](https://github.com/taylordrew4u2/Showrunner-ICanRunAShow)

Production tool used during live shows: builds lineups, imports schedules from
photos with AI, and runs a full-screen show mode with cue timers and walk-on
music. React and TypeScript.

### [Role-Call](https://github.com/taylordrew4u2/Role-Call)

End-to-end film-production planner for crew roles, cast, scripts, shot lists and
schedules. Next.js, TypeScript, Clerk, Drizzle.

### [The Trip Handler](https://github.com/taylordrew4u2/the-trip-handler)

Group-trip organizer with private invites, applications and approvals, shared
itineraries, expense tracking and Stripe payments.

### [Bill Spilt](https://github.com/taylordrew4u2/Bill-Spilt)

Full-stack tool for splitting household bills and keeping shared expenses
organized.

---

## Stack

- **iOS** — Swift, SwiftUI, SwiftData, CloudKit, on-device transcription and AI
- **Web** — Next.js, React, TypeScript, Tailwind CSS, PWAs
- **Backend** — Node.js, REST APIs, PostgreSQL, Turso, Prisma, Drizzle
- **Engineering** — authentication and session security, client-side encryption,
  offline sync, payments, testing, CI/CD, technical writing

## How I work

I try to write software that is still legible a year after launch, and to be
specific in the code about *why* something is the way it is — the storage
layout, the failure direction of an auth check, the option that was rejected and
what it would have cost. Most of the work I enjoy is turning a messy operational
process into a tool someone can trust while they are in the middle of using it.

---

Open to iOS and full-stack engineering roles, contract work, and interesting
product problems — New York City or remote.

**[taylordrew4u@gmail.com](mailto:taylordrew4u@gmail.com)**
