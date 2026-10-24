# eClinic status

## Completed (implemented and checked as described)
- Branding, responsive layout, mobile drawer, reusable UI components.
- Login, protected routes, role-based pages, inactive-account blocking.
- Database: schema, indexes, RLS, privilege grants, audit triggers, stock function, report/dashboard functions, last-admin guard (migrations 001-005).
- Modules: Dashboard, Students (+profile), Clinic visits, Inventory, Reports (print + CSV), Users, Audit logs.
- Checks run: lint; production build; SQL and RLS behavior in an embedded PostgreSQL; validation, CSV, date and alert-rule scripts; headless Chromium checks at 360/390/768/1024/1440px on 8 routes with a mocked API (no horizontal overflow, controls at least 40px, correct menu/sidebar behavior).

## Not yet verified
- Anything against a live Supabase project (real auth, PostgREST queries, joins, row-level security through the API).
- Safari/iOS and real Android devices; actual printing; opening CSVs in Excel.
- Automated test suite (current tests are one-off scripts and the manual cases in `docs/TEST_CASES.md`).

## Pending features
- In-app password reset / forgot-password flow (admins can reset passwords in the Supabase dashboard).
- PDF and Excel export (print and CSV exist).
- Visit-record restrictions by individual staff member (currently all active staff see all records).
- Charts library and richer analytics (simple bar charts only).
- Backup automation, retention enforcement, and permanent-deletion procedure.
- Login rate-limiting beyond Supabase defaults; optional two-factor authentication.

## Assumptions that need clinic validation
1. Two roles only (Administrator, Clinic Staff); all active staff may view all students and visits.
2. Fields: grade/year, section/program, contact, and one emergency contact are enough; no medical history, allergies, or diagnoses are collected.
3. Visit reasons are free text with suggestions; reports group by normalized text.
4. Archive instead of delete; only reversible by archive/restore.
5. Dates and "today" use Philippine time (Asia/Manila).
6. Low-stock uses a per-item threshold; "expiring soon" means within 30 days.
7. CSV exports exclude names and health notes by default; admins may include identifiers.
8. Record retention period: unknown, to be set by school policy.
