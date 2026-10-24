# Cost, price and profit estimate (rough, for planning only)

All numbers are estimates. USD/JPY = 157 (open.er-api.com, 2026-10-24). Prices below were checked on the day written; verify before relying on them.

## 1. Unit prices used

| Item | Price | Source / note |
|---|---|---|
| Google Places Nearby / Text Search (Pro) | $32 per 1,000 (first tier), 5,000 free per month | Google pricing page (via search) |
| Google Routes Compute Routes (Essentials) | $5 per 1,000, 10,000 free per month | third-party breakdown of Google's page |
| Google Maps JS map load | about $7 per 1,000 | **from memory, verify** |
| Google Geocoding | about $5 per 1,000 | **from memory, verify** |
| Claude Haiku 5.5 | $0.10 in / $0.50 out per million tokens (prompts up to 100K) | claude-api skill price table, cached 2026-10-06 |
| Claude Sonnet 5.5 | $2 in / $10 out per million tokens (cache reads $0.20) | same |
| Stripe Japan card fee | 3.6% | typical rate, verify |
| Consumption tax | 10% (prices shown tax-included) | |
| Free: Open-Meteo, exchange rates, holidays-jp, Wikimedia photos, OSM data | $0 | public servers have fair-use limits |

## 2. What one active user costs per month

Assumptions per month: Light = 6 sessions, 5 chat messages; Typical = 14 sessions, 30 messages, 10 menu photos, 3 trip plans; Heavy = 30 sessions, 100 messages, 25 menus, 6 plans.
Chat message = 600 tokens in, 250 out. Menu photo = 1,500 in, 400 out. Trip plan = 1,500 in, 1,500 out.
"As built" = the app today: about 9 Google Places calls per session (home strip 4, map taps 3, Nearby page about 3). "Optimized" = OpenStreetMap first, Google only on demand (about 75% fewer Google calls).

| User | As built, Haiku | Optimized, Haiku | Optimized, Sonnet |
|---|---|---|---|
| Light | $1.97 (¥310) | $0.58 (¥91) | $0.63 (¥98) |
| Typical | $4.58 (¥718) | $1.32 (¥207) | $1.54 (¥242) |
| Heavy | $9.79 (¥1,537) | $2.81 (¥441) | $3.43 (¥538) |

**The AI is cheap. The map is the cost.** Typical user: Haiku about 1 cent a month, Sonnet about 24 cents. Google Places is $4.5 of the $4.6.

## 3. Profit per paying user per month (¥, after tax and Stripe fee)

Columns: Light as-built / Light optimized / Typical as-built / Typical optimized / Heavy as-built / Heavy optimized (Haiku).

| Price (tax incl.) | L-now | L-opt | T-now | T-opt | H-now | H-opt |
|---|---|---|---|---|---|---|
| ¥380 | 22 | 241 | -387 | 125 | -1,206 | -109 |
| ¥580 | 196 | 416 | -212 | 300 | -1,031 | 66 |
| ¥780 | 371 | 590 | -37 | 474 | -856 | 240 |
| ¥980 | 546 | 765 | 137 | 649 | -682 | 415 |
| ¥1,480 | 982 | 1,202 | 574 | 1,085 | -245 | 851 |

As built, a typical user loses money below about ¥800 a month and a heavy user loses money at every price. After the optimization below, ¥580 already makes about ¥300 per typical user, and ¥980 about ¥650.

## 4. Business scenarios (optimized, Haiku, free users cost about ¥3, fixed ¥3,000 a month)

Monthly profit in yen, by monthly active users (MAU) and conversion to paid.

| MAU | Conversion | Price ¥580 | Price ¥980 |
|---|---|---|---|
| 1,000 | 2% | 53 | 7,038 |
| 1,000 | 4% | 6,107 | 20,076 |
| 1,000 | 8% | 18,213 | 46,152 |
| 10,000 | 2% | 27,533 | 97,380 |
| 10,000 | 4% | 88,065 | 227,760 |
| 10,000 | 8% | 209,130 | 488,519 |
| 100,000 | 4% | 907,652 | 2,304,597 |

Not included: your time, marketing, support, Apple/Google developer fees, accountant, and income tax. App store fees (15 to 30%) apply if sold as an app; a web app paid by card avoids them.

## 5. Recommended price plan

- **Free:** SOS, "I need help", phrases, show-to-staff, allergy card, offline mode. Almost no cost, and it is the part that earns trust.
- **Plus ¥980 per month** (or **Trip pass ¥680 for 7 days**): live nearby search, menu photo, real AI guide, trip plan with budget, address for police.
- Aim for 4% or more of users paying. Below 2%, the business is thin.

## 6. How to get from the "as built" cost to the "optimized" cost

1. **Use OpenStreetMap for the common places** (police, hospital, convenience stores, toilets, ATMs, trash, pharmacies). Load a Japan extract into your own storage; public Overpass and Nominatim servers are only for light use, so do not run a paid service on them.
2. **Call Google only on demand** (user taps a place for opening hours or photos), not for every category on the home screen.
3. **Do not cache Google Places results on your server** beyond what Google's terms allow (place IDs can be kept; other data only for a short time). Read the Maps Platform terms before building a shared cache.
4. **Put the AI behind your own server** (for example a Cloudflare Worker): the API key stays hidden, you can rate limit per user (for example 30 messages a day), and you can cache the system prompt.
5. Start with Haiku for chat and menu text. Use Sonnet only where Haiku fails in testing.
6. Set a budget alert in Google Cloud and a monthly spend limit in the Anthropic console.

## 7. Things this estimate does not know

- Real usage: sessions per user and conversion rates are guesses. Measure them with a few hundred real users first.
- Menu OCR runs on the phone today (free). If you move it to a server model, add the menu cost above.
- Selling to consumers in Japan from abroad can require consumption tax registration. Ask an accountant.
- Affiliate income (restaurant or ticket referrals) and ads are not counted; they could add to revenue.
