# Internal Guide: Admin Operator Instructions

## 1. What This Feature Is Supposed To Do
This guide is for **us** (the operators) to manage the platform.
- **Why it exists**: To handle support requests, fix stuck accounts, and manage the waitlist.
- **When to use it**: When a user says "I can't log in" or "My plan didn't upgrade".

## 2. Managing the Waitlist
- **Workflow**: 
  1. Check `prisma.waitlistEntry` for new signups.
  2. Approve entries by setting `status = APPROVED`.
  3. This triggers the invitation email.
- **Troubleshooting**: If an invite isn't used, check `inviteExpiresAt`.

## 3. Handling Billing Issues
- **Workflow**:
  1. Check the **Razorpay Dashboard** for the `subscriptionId`.
  2. Cross-reference with `prisma.workspace.plan`.
  3. If a user paid but the plan is `HOBBY`, manually update the `plan` field in the database and trigger a cache clear.

## 4. Operational "Truths"
- **API Limits**: Hardcoded in the middleware. If a user hits a limit, they get a `429`. We must manually override this in the `Workspace` model if they are a "VVIP" user.
- **Media Storage**: Currently stored in S3/R2. If an image won't load, check the CORS settings on the bucket.

## 5. What Should Be Simplified (Internal Tools)
- **The "Admin Panel"**: We don't have one. We are running Prisma Studio for everything. We need a `/admin` dashboard to:
  - Approve users.
  - See global usage.
  - Impersonate a workspace to debug their schema.
- **Log Visibility**: We have to check Vercel/Sentry logs. We need a "Global Audit Log" in the dashboard.
