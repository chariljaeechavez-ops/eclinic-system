# Supabase setup (new project)

1. Create a project at supabase.com. Save the database password somewhere safe.
2. Authentication > Providers > Email: turn OFF "Allow new users to sign up". Leave "Confirm email" on.
3. SQL Editor: run each file in `migrations/` in order, one at a time: 001, 002, 003, 004, 005.
4. Authentication > Users > Add user: create the first administrator (email + password). Copy that user's UUID.
5. Promote that user in the SQL Editor (replace the values):
   ```sql
   insert into public.profiles (id, full_name, role) values ('PASTE-UUID', 'Admin Full Name', 'admin');
   ```
6. Project Settings > API: copy the Project URL and the anon public key into `.env`. Never use the service_role key in the app.
7. Add more people in the app: create their login in Authentication > Users > Add user, then sign in as admin and use Users > Add account with the same email.

Known gaps: backups and record retention are not configured (see README checklist).
