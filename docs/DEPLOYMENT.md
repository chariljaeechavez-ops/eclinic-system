# Deployment and backup checklist

## Before go-live
- [ ] Clinic staff reviewed the fields, workflows, and reports (see assumptions in `docs/STATUS.md`).
- [ ] School data protection officer approved data collected, access rules, exports, and retention (Philippine Data Privacy Act of 2012 and school policy). This project does not claim legal compliance.
- [ ] A security review of the RLS policies and functions was done by someone other than the developer.
- [ ] Acceptance testing (`docs/TEST_CASES.md`) passed on staging with fictional data, including real phones.
- [ ] No real student data was used in testing or demo mode.

## Supabase
- [ ] Production project created; region chosen with the school's policy in mind.
- [ ] Migrations `001` to `005` run in order; first admin created and promoted.
- [ ] Authentication: public signup OFF; email confirmation ON; strong password policy; set Site URL and redirect URLs to the production address.
- [ ] Only the anon key is used by the app; the service_role key is stored nowhere in the repo or the front end.
- [ ] Backups: enable the plan's automated daily backups (or scheduled `pg_dump` to encrypted storage). Perform a test restore into a separate project and record how long it took.
- [ ] Decide who holds the database password and dashboard access (at least two trusted people).

## Frontend hosting (any static host, e.g. Netlify, Vercel, Cloudflare Pages)
1. Build command `npm run build`, output folder `dist`.
2. Set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's settings. Leave `VITE_DEMO_MODE` unset.
3. Add a single-page-app rewrite so every path serves `index.html`.
4. Serve over HTTPS only.

## After go-live
- [ ] Sign in as admin and staff on a phone and a computer.
- [ ] Review the audit log weekly for unexpected changes.
- [ ] Deactivate accounts of people who leave.
- [ ] Review backups monthly; repeat a test restore each term.
- [ ] Agree and document retention and deletion rules. Until decided, nothing is deleted automatically.
- [ ] Rotate the admin password if shared access was ever used.
