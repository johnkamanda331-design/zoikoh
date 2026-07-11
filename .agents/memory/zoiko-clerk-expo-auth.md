---
name: ZOIKO Clerk Expo custom auth
description: How to build custom sign-in/sign-up screens against @clerk/expo v3.x's "Future" signals API in React Native/Metro.
---

`@clerk/expo` v3.x re-exports `useSignIn`/`useSignUp` from `@clerk/react`'s **default** export, which is the new
"Future" signals API — not the classic `{ isLoaded, signIn }` shape most Clerk docs/examples show.

- `useSignIn()` returns `{ errors, fetchStatus, signIn }`. `signIn` is a `SignInFutureResource` with methods:
  `create()`, `password({ password, identifier|emailAddress|phoneNumber })`, `signIn.status`, `signIn.finalize({ navigate })`.
- `useSignUp()` is analogous: `signUp.password({ password, emailAddress, ... })`, `signUp.verifications.sendEmailCode()`,
  `signUp.verifications.verifyEmailCode({ code })`, `signUp.status`, `signUp.finalize({ navigate })`.
- There *is* a classic-shaped `useSignIn`/`useSignUp` under `@clerk/react/legacy`, but Metro (Expo's bundler) fails to
  resolve that subpath export even though `tsc` resolves it fine — don't fight it, just build against the Future API directly.
- `@clerk/expo/web` does not exist for React Native — only use `SignIn`/`SignUp` prebuilt UI components on actual web builds.

**Why:** cost a full debugging pass (TS errors on `.setActive`/`.isLoaded`, then a Metro resolution failure) before finding
the correct API shape by reading `@clerk/shared`'s runtime `.d.ts` directly.

**How to apply:** when building any custom auth screen in `zoiko-mobile` (or any Expo + Clerk v3 app), reach for this file
first instead of re-deriving the API shape from scratch.
