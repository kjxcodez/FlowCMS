# FLOWCMS AUTH SYSTEM — FINAL IMPLEMENTATION PLAN (SOURCE VERIFIED)

This document outlines the source-verified architecture for FlowCMS authentication, moving away from fragile hook-only validation to a robust **Three-Layer Auth Protection Model**.

## PART 1 — SOURCE-VERIFIED ARCHITECTURAL DIAGNOSIS

The current implementation in `src/lib/auth.ts` uses `throw new Error()` inside `databaseHooks.user.create.before`. This is fundamentally incompatible with custom error handling in Better Auth v1.6.10 because:

1.  **Internal Catching**: Better Auth catches any error thrown inside `createWithHooks()` and converts it to a generic `unable_to_create_user` error.
2.  **Forced Redirect**: This failure path always redirects to `/api/auth/error`, bypassing custom logic.
3.  **UX Decay**: Landing on `/api/auth/error` destroys the premium Meridian experience and leaves users stranded.
4.  **Hook Limitations**: Relying solely on hooks for UX redirection is "too late" in the lifecycle for proper failure handling.

The **Three-Layer Model** fixes this by preventing Better Auth from owning the failure experience while maintaining hard security at the database level.

---

## PART 2 — STEP 0 (GLOBAL SAFETY NET)

Implement the global redirect override to ensure that even unhandled Better Auth failures (like OAuth provider errors) land on our branded page.

### [MODIFY] [auth.ts](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/lib/auth.ts)

```ts
export const auth = betterAuth({
  // ... other config
  onAPIError: {
    errorURL: "/auth/error",
  },
  // ...
});
```

- **Why**: This makes `/api/auth/error` redirect to `/auth/error`.
- **Mandatory**: This is the baseline safety net.

---

## PART 3 — CHECKPOINT 1 (PRE-AUTH ROUTES)

Create secure entry points that validate the environment *before* Better Auth starts its flow. This is the **UX Layer**.

### [NEW] [/register/google/route.ts](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/app/register/google/route.ts)
### [NEW] [/register/email/route.ts](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/app/register/email/route.ts)

**Logic Flow:**
1.  **Invite Lookup**: Extract `token` and `email` from query params.
2.  **Validation**:
    - Verify token exists in `WaitlistEntry`.
    - Verify token is not expired (`inviteExpiresAt`).
    - Verify token is not already used (`status !== "JOINED"`).
3.  **Failure**: If any check fails, redirect immediately to `/auth/error?code=INVITE_INVALID`.
4.  **Secure Handoff**:
    - Set `pending_invite` cookie: `HttpOnly: true, Secure: true, SameSite: Lax, Path: /, MaxAge: 600`.
    - **Crucial**: Do NOT use `SameSite: Strict` as it breaks OAuth callbacks.
5.  **Redirect**: Hand off to Better Auth social sign-in or credentials sign-up.

---

## PART 4 — CHECKPOINT 2 (DATABASE HOOKS)

Implement hard security enforcement at the database level using Better Auth hooks. This is the **Security Layer**.

### [MODIFY] [auth.ts](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/lib/auth.ts)

**Implementation for `databaseHooks.user.create.before`:**
- **Context Access**: Use the second argument `ctx` to read `ctx.getCookie("pending_invite")`.
- **Atomic Consumption**:
  - Perform a transaction to find the invite and mark it as `JOINED` atomically.
  - **Replay Prevention**: Ensure the same token cannot be used twice in a race condition.
- **Email Validation**: For Social Auth, verify that the email provided by the provider matches the invite email.
- **Security Logic**: If validation fails, `return false` or `throw` — Layer 1 will catch this and send the user to `/auth/error`.

---

## PART 5 — LOGIN FLOW ENFORCEMENT

Protect against bypasses from suspended or revoked users across all login methods.

### [MODIFY] [auth.ts](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/lib/auth.ts)
**Implementation for `databaseHooks.session.create.before`:**
- Check user status (e.g., `suspended`, `revoked`).
- Block session creation if user is not authorized.

### [MODIFY] [middleware.ts](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/middleware.ts)
- Implement real-time session validation.
- Forced logout flow if user status changes (e.g., subscription revoked).

---

## PART 6 — CUSTOM AUTH ERROR SYSTEM

A premium, Meridian-themed error handler that provides clarity and recovery paths.

### [NEW] [/auth/error/page.tsx](file:///c:/Users/91637/Desktop/Business%20Project/flowcms/src/app/auth/error/page.tsx)

- **Input**: Handles `?code=` (our custom codes) and `?error=` (Better Auth codes).
- **Design**: Industrial-editorial style, consistent with the landing page.
- **Recovery**: "Back to Waitlist", "Contact Support", "Try different email".
- **Logging**: Automatically log the error to Sentry with the provided code.

---

## PART 7 — SECURITY + FAILURE PROTECTION

- **Replay Prevention**: Atomic invite usage in `databaseHooks`.
- **Invite Abuse**: Rate limiting on `/register/*` routes.
- **Direct API Protection**: Even if a user hits `/api/auth/sign-up` directly, Checkpoint 2 (Hooks) will block them because they won't have the `pending_invite` cookie.
- **Founder Debugging**: Log detailed failure reasons to the console/Sentry (e.g., "Invite mismatch: expected {{exp}}, got {{got}}").

---

## PART 8 — VALIDATION CHECKLIST

### Automated/Manual Tests
- [ ] **Valid Invite**: Credential signup works, cookie set/read correctly.
- [ ] **Expired Invite**: Redirects to `/auth/error?code=INVITE_EXPIRED` at Checkpoint 1.
- [ ] **Used Invite**: Redirects to `/auth/error?code=INVITE_USED` at Checkpoint 1.
- [ ] **OAuth Failure**: Google signup with wrong email triggers redirect to `/auth/error` via Layer 1.
- [ ] **Bypass Attempt**: Direct POST to `/api/auth/sign-up` without cookie fails at Checkpoint 2.
- [ ] **Race Condition**: Multiple simultaneous requests with same token only result in one user.
- [ ] **Suspended Login**: Suspended user cannot create a session via `databaseHooks.session.create.before`.
- [ ] **Cookie Rules**: Verify `pending_invite` cookie has `SameSite=Lax`.

### Success Criteria
- [ ] No user ever lands on `/api/auth/error`.
- [ ] All auth failures result in the Meridian `/auth/error` page.
- [ ] Database state is always atomic and consistent.
