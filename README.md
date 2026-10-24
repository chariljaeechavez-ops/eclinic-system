# eClinic: School Clinic Management System

A responsive web application for managing a school clinic serving Senior High School and College students. eClinic is built with React 19, Vite, Tailwind CSS 4, and Supabase, using PostgreSQL for data storage and Supabase Auth and Row Level Security (RLS) for authentication and authorization.

The application runs in a web browser and supports desktop, tablet, and mobile screen sizes. It is not a native mobile application and does not support offline operation.

> **Production readiness:** eClinic is not yet approved for production use until the security review, acceptance testing, and data-privacy sign-off described in `docs/DEPLOYMENT.md` have been completed. Refer to `docs/STATUS.md` for completed work, pending tasks, and assumptions that require clinic validation.

## Features

eClinic includes the following modules:

- **Dashboard** — Displays clinic-related summaries and key information.
- **Student Records** — Manages Senior High School and College student information. Records are archived instead of permanently deleted.
- **Clinic Visits** — Records and manages student clinic visits.
- **Medicine and Supply Inventory** — Tracks medicine and supply items, stock balances, and inventory transactions.
- **Reports** — Provides printable reports and CSV exports.
- **User Management** — Supports Administrator and Clinic Staff roles.
- **Audit Logs** — Records relevant database activities for accountability and review.

The application is designed to support organized clinic recordkeeping and inventory management. It is not a substitute for professional medical judgment or a clinical decision-support system.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19 |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | PostgreSQL Row Level Security (RLS) and database privileges |
| Database Functions | PostgreSQL functions and triggers |
| Routing | React Router |
| Icons | Lucide React |
| Testing and Quality Checks | ESLint, automated scripts, and browser-based layout checks |

## User Roles

### Administrator

The Administrator is responsible for authorized administrative tasks, including user management, access oversight, and reviewing audit logs.

### Clinic Staff

Clinic Staff use the system to perform permitted clinic operations, such as managing student records, recording clinic visits, and handling inventory.

Access to database records and operations must be enforced by database permissions and RLS policies, not only by hiding interface elements.

## Quick Start

### Prerequisites

- Node.js and npm compatible with the project's dependencies
- A Supabase project
- Git, if you plan to clone the repository

### 1. Configure Supabase

Create a Supabase project and follow the instructions in `supabase/SETUP.md`.

Run database migrations `001` through `005` in the documented order and create the initial Administrator account according to the setup instructions.

### 2. Install Dependencies

Clone the repository or open the project directory, then run:

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file using `.env.example` as a reference.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_DEMO_MODE=false
```

Use the exact variable names expected by the application.

**Security requirements:**

- Use only the Supabase publishable key or legacy anon key intended for frontend use.
- Never place a Supabase `service_role` key or secret key in frontend code or frontend environment variables.
- Keep `.env` out of version control.
- Keep public user registration disabled unless an explicitly reviewed and secure registration workflow requires it.
- Configure and verify RLS policies and database permissions before allowing access to real student information.

### 4. Start the Development Server

Run:

```bash
npm run dev
```

Open the local URL displayed in the terminal. Sign in using the Administrator account created during Supabase setup.

## Demo Mode

eClinic provides a development preview mode that can be enabled through the environment variable:

```env
VITE_DEMO_MODE=true
```

When supported by the current development configuration, demo mode allows the interface to be previewed without connecting to the database or signing in.

Demo mode is intended for interface demonstration only. Database-dependent features may display a database-not-connected message or remain unavailable.

Never enter real student information or actual clinic health records in demo mode.

The production build is designed to disable demo mode. Verify the production configuration before deployment.

## Available Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the local development server |
| `npm run lint` | Runs ESLint checks |
| `npm run build` | Creates the production build in `dist/` |
| `npm run preview` | Previews the production build locally |

Before deployment, run the lint and build commands and address any errors.

## Project Structure

```text
src/
├── components/    Reusable interface components
├── layouts/       Application layouts and navigation
├── pages/         Dashboard, Students, StudentProfile,
│                  Visits, Inventory, Reports, Users,
│                  AuditLogs, and Login
├── services/      Supabase queries and application services
├── hooks/         Authentication and asynchronous hooks
└── utils/         Validation, CSV, dashboard/date,
                   and inventory alert utilities

supabase/
├── SETUP.md       Database setup instructions
└── migrations/    Database schema, RLS, functions,
                   and triggers

docs/
├── TEST_CASES.md  Test cases and testing evidence
├── DEPLOYMENT.md  Deployment, security, and readiness checks
└── STATUS.md      Project status and outstanding work
```

The structure above summarizes the documented project organization. Refer to the actual repository for the complete file list.

## Security and Data Protection

The documented security design includes the following controls:

- **Database authorization:** PostgreSQL RLS policies and database privileges are intended to enforce access permissions independently of the user interface.
- **Record retention:** Student records are archived instead of permanently deleted through the normal application workflow.
- **Audit logging:** Database triggers record relevant activities, including who performed an action and which fields were affected, without storing the old or new field values in the audit log.
- **Inventory integrity:** Inventory changes use a database function intended to prevent negative stock balances and duplicate submissions.
- **CSV data minimization:** CSV exports are designed to exclude student names and free-text health notes by default.
- **Credential protection:** Frontend configuration must never contain Supabase service-role or secret keys.

These describe the intended security design. They do not independently establish that every control has passed testing in the live Supabase project.

Before using eClinic with real student records, review database policies, role permissions, authentication settings, backup and restoration procedures, privacy requirements, and the school's approval process.

## Testing and Verification

Detailed test cases and evidence should be maintained in `docs/TEST_CASES.md`.

### Automated Checks

The project's documented automated checks include:

- ESLint code-quality checks
- Production build checks
- SQL and RLS behavior checks against an embedded PostgreSQL environment
- Validation and CSV logic scripts
- Responsive layout checks using headless Chromium at viewport widths of 360, 390, 768, 1024, and 1440 pixels, using a mocked API

These checks do not replace testing against the actual Supabase project or testing on physical devices.

### Manual Testing

**Student registration and database persistence:** Student registration through the eClinic interface was demonstrated. The application displayed a successful student-added message, and the corresponding student record was visible in the Supabase `students` table.

This provides evidence that the demonstrated student-registration workflow successfully saved a record to the database.

Other modules, including clinic visits, inventory transactions, reports, user management, audit logs, and role-based access, should be recorded as tested only when their results have been verified.

### Remaining Verification

Before production use, complete and document the following as applicable:

- Live Supabase integration testing for all modules
- Authentication and role-based authorization tests
- RLS and database permission tests
- Inventory transaction integrity and duplicate-submission tests
- Testing on physical mobile and desktop devices
- Backup and restoration verification
- Acceptance testing with authorized clinic personnel
- Security review and school data-privacy approval

Update the testing records and `docs/STATUS.md` as each item is completed.

## Deployment

The frontend can be built for static hosting platforms such as Netlify.

Recommended build settings for a standard Vite deployment:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |

Configure the required Supabase environment variables in the hosting provider's settings. If React Router uses client-side routes, configure the host's single-page application fallback.

After deployment, test the deployed application rather than assuming that a successful build guarantees correct operation.

Deployment for demonstration and testing does not constitute approval for production use. Use fictional records until the required security, acceptance, and data-privacy checks have been completed.

## Known Limitations

- eClinic is a browser-based application, not a native mobile application.
- Offline operation is not supported.
- Database-dependent features require a working Supabase connection.
- Live integration, physical-device testing, and production-readiness checks must be tracked according to their actual completion status.

## Project Documentation

Refer to the following files for more information:

- `supabase/SETUP.md` — Database setup and migrations
- `docs/TEST_CASES.md` — Test cases and evidence
- `docs/DEPLOYMENT.md` — Deployment and production-readiness requirements
- `docs/STATUS.md` — Completed work, pending tasks, and assumptions requiring validation

## License

Specify the project's license here if one has been selected. Do not assume that the project is open-source or assign a license without the project's owner's approval.
