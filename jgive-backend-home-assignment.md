# Backend Developer (Ruby on Rails) — Home Assignment

## Overview

Build a small Rails app that reproduces a specific Jgive campaign donation page — the part a
donor sees and interacts with, up to (but not including) payment.

Your reference is this live campaign: https://www.jgive.com/new/he/ils/donation-targets/159183

Aim to get the result close to the existing design — it doesn't need to be pixel-perfect, but it
should clearly resemble the original. If something in the current design strikes you as off, feel
free to improve it — just tell us what you changed and why.

## Time

Aim for roughly **4–6 hours**. We care far more about your judgment than about completeness. If
you run short, cut scope deliberately and tell us what you cut and why. Please don't polish
endlessly — a focused, well-reasoned submission beats a sprawling one.

## What to build (core)

A page for the campaign above that shows:

- **Campaign details, organized into tabs** (mirroring the tabs on the reference page): title,
  description / story, cover image, goal amount, amount raised, and progress toward the goal.
- **A donation form:** amount (a few preset options + a custom amount), one-time vs. recurring,
  donor display preference (full name / first name only / anonymous), and an optional
  dedication message.

Submitting the form should create a donation record in a `pending` state and update the
campaign's progress. **Do not implement payment / checkout.** Instead, in your README, briefly
describe how you'd wire in a real payment provider and move a donation from `pending` to
`paid`.

Seed the app with one or two campaigns and a handful of donations so the page isn't empty on
first load.

## Explicitly out of scope

- Payment processing / checkout
- User accounts, login, or admin
- Production hardening

## Deliverables

1. A public Git repo (or send us an invite). We'd love to see real commit history rather than a
   single squashed commit.
2. A deployed, live application (mandatory). Deploy the app and include a link where we can
   use it.
3. A README covering: how to run it locally, the key decisions and trade-offs you made, and
   what you'd do with more time.
4. The full chat transcript(s) with whatever LLM / coding assistant you used.
5. A few sentences on your setup and thought process — your tools, how you approached
   the problem, and where AI helped or got in your way.

## On using AI

Use whatever tools you normally use. We use AI heavily here, and we want to see how you work
with it — not whether you avoided it. Sharing your transcript helps us understand how you steer,
review, and decide what to keep. You should also be ready to walk us through your code and
extend it together in the next interview.

## Submitting

Send us the repo link, the live URL, and your transcript and notes. Questions are very welcome at
any point — just reach out.
