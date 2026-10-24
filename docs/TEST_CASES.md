# eClinic test cases

Run these against a staging Supabase project with fictional data only. Mark each Pass/Fail with the date and tester.

## A. Authentication and access
1. Sign in with a valid admin account: lands on the dashboard.
2. Wrong password: generic error, no account details revealed.
3. Open any page while signed out: redirected to login.
4. Deactivate a staff account, then reload their session: they lose access (empty data, sign-in refused).
5. Staff opens `/users` and `/audit-logs`: "no access" page; sidebar hides both.
6. Public signup attempt (Supabase auth API): refused.
7. Staff tries to change their own role via the API: no rows updated.

## B. Students
1. Add a student with all required fields: appears in the list.
2. Add a duplicate Student ID: "already exists" message.
3. Missing/invalid fields (ID with spaces, bad phone, no grade): inline errors, nothing saved.
4. Level change resets the grade/year options.
5. Search by partial name and by ID; filter by level; pagination at 10 per page.
6. Archive then restore; archived students are hidden unless "Show archived" is on; no delete option exists.

## C. Clinic visits
1. Record a visit for a student found through the picker; "Recorded by" shows the logged-in staff name.
2. Future date/time: rejected. Empty reason: rejected. Over 1000 characters: rejected.
3. Edit a visit: updated; audit log shows "Updated" with changed field names only.
4. Filter by date range and student name; reversed range shows an error.
5. Student profile shows full history; archived students have no "Record visit" button.

## D. Inventory
1. Add an item; balance starts at 0.
2. Stock in 10: balance 10. Stock out 4: balance 6.
3. Stock out more than the balance: rejected.
4. Double-click "Record" quickly: only one transaction is created.
5. Item expiring within 30 days shows "Expiring soon"; past expiry shows "Expired"; balance at or below threshold shows "Low stock".
6. History lists each transaction with user and time; no edit/delete controls.
7. Same name + expiry date twice: rejected.

## E. Dashboard and reports
1. Dashboard counts match the Students, Visits, and Inventory pages (spot-check by hand).
2. Visits near midnight (Philippine time) fall on the correct day.
3. Reports: daily/weekly/monthly grouping, empty period message, range over one year rejected.
4. CSV export: opens in a spreadsheet; no names or health notes unless an admin ticks the identifiable option; cells starting with `=` appear as text.
5. Print preview: sidebar and controls hidden, report title and period shown.

## F. Users and audit
1. Admin links a new login by email; a second attempt is refused; unknown email is refused.
2. The only active admin cannot be demoted or deactivated.
3. Audit log filters work; staff cannot read it; no entries can be edited or deleted (try via the API).

## G. Responsive layout (360, 390, 768, 1024, 1440 px; Chrome and Safari)
1. No horizontal scrolling on any page.
2. Below 1024px: hamburger menu opens and closes the drawer; at 1024px and up: fixed sidebar.
3. Tables become cards on narrow screens; all buttons and inputs are at least 44px tall.
4. Modals scroll within the screen and form fields are readable on a phone; the on-screen keyboard does not hide the Save button.
5. Test on a real Android phone and an iPhone, not only desktop emulation.
