# MDMS

Phase 1 of the Meter Data Management System is a read-only front end built with
Vite, React, TypeScript, React Router, Axios, Recharts, and JSON Server.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install

From the project directory (the folder containing `package.json`), install the
dependencies:

```bash
npm install
```

## Generate sample data

Generate and validate the sample database:

```bash
npm run seed
```

> **Warning:** seeding replaces `db.json` with the generated sample dataset.

## Run JSON Server

In a terminal, start the API:

```bash
npm run api
```

The API listens at `http://localhost:3001`.

## Run the web app

In a second terminal, start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite (normally
`http://localhost:5173`). The end-user dashboard is at
`http://localhost:5173/user/dashboard`.

## Other commands

```bash
npm run build  # Type-check and create a production build in dist/
npm run lint   # Run ESLint
npm run preview # Preview the production build locally
```

The login, password recovery, and dashboard screens are demonstration UI; no
authentication, payment, or write APIs are connected. Routes not implemented
yet display title-only placeholders.

## JSON Server query examples

This project uses `json-server@1.0.0-beta.15`. Filtering, sorting, and
pagination are performed by the API:

```text
# Exact filters
/meters?zoneId=zone-mangalore&status=active

# Conditions use field:operator=value
/bills?status:eq=overdue&amount:gte=500

# Case-insensitive substring search
/users?name:contains=an

# Sort ascending, or prefix a field with "-" for descending
/bills?_sort=issuedAt
/bills?_sort=-issuedAt,amount

# Filter, sort, and paginate together
/bills?ownerId=customer-001&_sort=-issuedAt&_page=1&_per_page=10
```

Supported condition operators include `eq`, `ne`, `lt`, `lte`, `gt`, `gte`,
`in`, `contains`, `startsWith`, and `endsWith`. Pagination uses `_page` and
`_per_page` and returns a `data` array with paging metadata.
