# CVRESPORTSOFF

## Current State
The app has a GameRegister page with a registration form (player name, UID, in-game name, custom questions) and a PAY & REGISTER button that attempted Stripe checkout. Admin can view registrations and toggle payment status. The backend has a Registration type with `paymentStatus` and `answers` fields.

## Requested Changes (Diff)

### Add
- UPI QR code section in the registration payment area (uses uploaded QR image: `/assets/uploads/img_20260326_210909-019d2ace-0eb6-7209-a8d0-c203669da276-1.jpg`)
- Admin setting to upload/update the UPI QR code image (stored in localStorage `cvr_upi_qr`)
- Payment screenshot upload slot in the registration form using blob-storage
- `paymentScreenshotUrl` optional field on `Registration` backend type (stored as `?Text`)
- Admin registrations table shows the payment screenshot (clickable thumbnail to view full image)

### Modify
- GameRegister page: after form fields, show a payment section with UPI QR code, instructions to pay, then upload screenshot field; submit button becomes "SUBMIT REGISTRATION" (no Stripe)
- Registration submit flow: upload screenshot to blob-storage first, then submit registration with the screenshot URL
- Admin.tsx: registrations table row shows a small screenshot thumbnail; clicking it opens full view

### Remove
- Stripe checkout flow from GameRegister (replaced by UPI + screenshot upload)

## Implementation Plan
1. Regenerate backend with `paymentScreenshotUrl: ?Text` on Registration
2. Update GameRegister.tsx: show QR code + payment instructions, add screenshot file upload, submit with screenshotUrl via StorageClient
3. Update Admin.tsx: add UPI QR code upload in Settings, show screenshot thumbnail in registrations table
