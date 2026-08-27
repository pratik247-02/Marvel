# 0003 — JWT rotation with reuse detection

**Status:** accepted · 2026-08-22, revised 2026-08-26 for cross-site deployment

## Context

Admin writes need authentication. The common portfolio implementation — a
long-lived JWT in `localStorage` — is the exact thing interviewers probe,
because any XSS on the page can read it and there is no way to revoke it before
it expires.

## Decision

Two tokens with different lifetimes and different storage:

| | Lifetime | Where | Reachable by JS |
|---|---|---|---|
| Access | 15 min | memory only | yes, deliberately |
| Refresh | 7 days | httpOnly cookie, `path=/api/auth` | no |

Each refresh **rotates**: the old token is invalidated and a new one issued.
The user document carries `refreshTokenVersion`, embedded in every refresh
token. Presenting a token whose version does not match increments the version
again, which invalidates **every** outstanding session for that user.

## Why rotation with reuse detection

A refresh token that never rotates is a 7-day bearer credential. If it leaks,
the attacker has a week and nothing detects it.

With rotation, a leaked token is useful exactly once. When both the attacker
and the real user try to refresh, the second one presents a version that no
longer matches — and that mismatch is only possible if a token was used twice.
The response is to invalidate the whole family, which logs both parties out.
That is the correct outcome: it is better to make the real user sign in again
than to leave a thief with a valid session.

## Why the access token lives in memory

`localStorage` survives a page reload, which sounds convenient and is exactly
the problem — it is readable by any script that gets injected. Memory is wiped
on reload, and the refresh cookie restores the session on the next page load
without ever exposing a long-lived credential to JavaScript.

## The cross-site problem, and what it cost

The cookies were originally `sameSite: "strict"`. That is correct CSRF
protection when the frontend and API share an origin — which they do in
development, on `localhost`.

In production they do not: the frontend is on Vercel, the API on Render. A
browser **never sends a `strict` cookie cross-site**, so every refresh would
have failed in production while passing every local check.

Production now uses `sameSite: "none"` with `secure: true`. The CSRF protection
`strict` was providing is replaced by three other things rather than dropped:

- The refresh cookie is scoped to `path=/api/auth`, so it is not attached to
  ordinary API calls
- CORS names explicit origins; credentialed requests cannot use a wildcard
- The token rotates, so a replayed request invalidates the session

**The lesson worth recording:** this class of bug passes every test that runs
on one origin. It is only findable by deploying, or by reasoning about the
deployment topology before deploying.

## A companion cookie, and why it is not a security hole

The refresh cookie is `httpOnly`, so the frontend cannot tell whether a session
exists — meaning every anonymous visitor would POST `/auth/refresh` on load,
get a guaranteed 401, and (doubled by React StrictMode) trip the rate limiter.

A non-httpOnly `has_session` flag is set and cleared in lockstep with the real
cookie. It carries no token and no user data. Forging it grants nothing: the
refresh still fails without the httpOnly token. It only answers "is attempting
a restore worthwhile".

## What would change the answer

- **Public user accounts.** Admin-only means one account and a small blast
  radius; public signup changes the threat model and the rate-limiting story.
- **Multiple instances.** `refreshTokenVersion` lives in MongoDB and is
  therefore already shared, so this scales — but session revocation latency
  would need checking against any added caching.
- **A same-origin deployment** (API behind the frontend's domain) would let
  `sameSite: "strict"` come back, which is strictly better.
