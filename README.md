# Worklo — Users Management

A small extension of the Worklo admin experience that adds a users management screen at `/admin/users`.

## What was implemented

- A users table showing each person’s name, email, avatar, and active roles
- Server-side search using the `/api/users` endpoint instead of client-side filtering
- Soft removal by updating `user_roles.removed_at` so the profile remains intact
- A confirmation dialog before removal, with optimistic UI updates and rollback on failure
- Permission protection using `Permission.MANAGE_USERS` and the existing guard workflow

## How to run

Requirements:
- Node.js 20.9+
- A Supabase project

```bash
npm install
cp .env.local.template .env.local
# Fill in your Supabase URL and keys in .env.local
# Run the SQL from supabase/schema.sql in your Supabase SQL editor
npm run dev
```

Then open http://localhost:3000 and sign in with a user that has the `manage_users` permission.

## Decisions and trade-offs

- I used the existing Supabase-backed API route pattern and server guards instead of introducing a separate backend service.
- Search is handled on the server to keep the implementation aligned with the assignment requirement and avoid sending unnecessary data to the client.
- Soft removal was implemented by updating the existing role-link rows rather than deleting profiles, which preserves audit history and user identity.
- The UI keeps the removal flow simple and reliable by using optimistic updates with a rollback path if the API call fails.

## What I would do with more time

- Add restore/remove toggling so an admin can undo a soft removal
- Improve pagination and loading states for larger organizations
- Add role-level actions such as reassigning or editing a user’s roles directly from the table
