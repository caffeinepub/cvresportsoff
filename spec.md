# CVRESPORTSOFF

## Current State
The app has a sponsors section (admin adds images/videos) and photo question images (admin adds images to registration questions). Both are broken for cross-device visibility:
- **Sponsors**: Upload uses StorageClient (cloud) but the metadata list (name, URL, type) is only stored in localStorage. Other devices see nothing. Backend already has `addSponsor(name, url, mediaType)`, `getSponsors()`, `deleteSponsor(id)` methods.
- **Photo questions**: Image is read as base64 via FileReader and stored in localStorage under `cvr_qimg_<key>`. The key is embedded in the question text JSON. Other devices don't have the localStorage entry, so the image never shows.
- **Sponsor upload error**: The current sponsor upload creates a raw `HttpAgent` and calls `StorageClient` directly. This works for banners too, so the upload mechanism should work, but logging needs improvement.

## Requested Changes (Diff)

### Add
- In `Admin.tsx`: a `useSponsorsFromBackend()` hook that reads/writes sponsors via the actor (`addSponsor`, `getSponsors`, `deleteSponsor`) instead of localStorage.
- In `Home.tsx`: fetch sponsors from backend via actor using `getSponsors()`.
- Photo question image upload: after picking file, upload to cloud storage using `StorageClient` and store the resulting URL directly in the question text JSON as `imageUrl` (not `imageRef` with localStorage).

### Modify
- `Admin.tsx` `useSponsors` hook → replace with backend-backed version using actor methods.
- `Admin.tsx` sponsor upload handler: on successful cloud upload, call `actor.addSponsor(name, url, mediaType)` instead of `addSponsor()` from localStorage hook.
- `Admin.tsx` sponsor delete: call `actor.deleteSponsor(id)` instead of localStorage remove.
- `Admin.tsx` photo question image upload: replace FileReader base64 + localStorage with StorageClient upload → store URL in JSON.
- `Home.tsx` `loadSponsors()` / `SponsorsSection`: replace localStorage reads with `actor.getSponsors()` via useQuery.

### Remove
- `SPONSORS_KEY` localStorage constant and related localStorage reads/writes from both `Admin.tsx` and `Home.tsx`.
- `cvr_qimg_*` localStorage entries and `imageRef` pattern for photo questions.

## Implementation Plan
1. In `Home.tsx`: update `SponsorsSection` to fetch from backend `getSponsors()` via `createActorWithConfig`, display same slider UI.
2. In `Admin.tsx`: replace `useSponsors` with a hook that uses `createActorWithConfig` → `getSponsors` on load, `addSponsor` on add, `deleteSponsor` on remove.
3. In `Admin.tsx` sponsor upload handler: upload file to cloud, call `actor.addSponsor(name, url, mediaType)`, refetch list.
4. In `Admin.tsx` photo question upload: replace FileReader+localStorage with StorageClient upload → URL stored as `imageUrl` in the question text JSON. Remove the `imageRef` pattern.
5. Update `parseQText` / `encodeQText` to only use `imageUrl` (no `imageRef` lookup).
