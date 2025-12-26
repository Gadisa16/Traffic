Web Admin — Next.js + TypeScript + Tailwind scaffold

This scaffold provides a minimal, clean folder structure using the `pages` router:

- `pages/` — Next pages (index, login, vehicles)
- `components/` — reusable components (Layout, VehicleList)
- `styles/` — global Tailwind CSS
- `package.json` — scripts and deps

How to run

```bash
cd web-admin
npm install
npm run dev
```

Notes

- This is a scaffold; integrate API client and auth flows next.
- Tailwind is configured in `tailwind.config.cjs` and `postcss.config.cjs`.
  Web Admin — React.js (placeholder)

This folder will contain the React admin dashboard.

Suggested scaffold:

- `web-admin/package.json` and CRA or Vite scaffold
- Pages: login, vehicles list, vehicle detail, dashboard
- API client to call backend endpoints
