# Design notes

## Core loop
1. See the stakes (event card, with "Because…" lines when an earlier choice has caught up).
2. Choose among 2–3 options. Each shows its numeric effects, risk percentage if any, and whether it may come back.
3. See the result and the exact deltas.
4. The ledger runs after decision 3 and decision 7 of each generation.
5. After decision 7 the family decides how the estate passes on (Steward / Scholar / Share).
6. The next generation begins with an explanation of how its health, knowledge and skills were derived.
7. After generation III: ending, family tree, threads of cause, legacy card.

## Ledger
Per run of the ledger: each property earns its yield (+1 with the matching skill at level 1+; the inn is 2); duties apply their per-ledger cost (coin, bonds); interest on debt is `ceil(debt / 3)`; every household loses 1 bond to busy lives. A coin shortfall is borrowed (`ceil(shortfall / 2)` added to debt). Coin above 12 is spent on the household. Health from the ledger never drops below 1.

## Inheritance (at the end of generation 1 and 2)
* **Steward** — everything passes on; bonds −1 (min 2).
* **Scholar** — available with knowledge peak 5+, a schooled child, or 5 coin. Sells non-home property, repays debt first, remaining proceeds become coin. Heir gets +2 knowledge and Letters +1. Duties stay.
* **Share** — available with bonds 4+. Debt halves (rounded up); for the next generation the estate's income is halved; bonds +1.
* Health: 7 baseline, +1 coin ≥ 7, −1 coin ≤ 1, −1 family cough, +1 well, −1 hard winter, −1 orphaned; clamped 4–9.
* Knowledge: 1 baseline, +2 schooled, +1 Book room, +1 reader parent (peak ≥ 6), +1 school bench, +2 Scholar path; clamped 0–7.

## Early death
Health only reaches 0 through a failed risk (fever, fire, etc.). The generation ends immediately, the heir is flagged orphaned (−1 health) and opens with *The Empty Chair*. If it happens in generation III the run ends with *The Candle Burned Short*. It occurs in about 1 % of bot runs.

## Chains (delayed consequences)
60 events; 14 delayed-consequence chains plus two themed groups. In 900 bot runs all 2,144 consequences that could be scheduled actually arrived.

| Chain | Trigger → consequence | Spans generations |
|---|---|---|
| Schooling | *Master Pell’s Fees* (sell workshop / pay / borrow) → *The Hollow Bench*, *A Letter from the Capital* | yes |
| Loan | *The Creditor’s Chair*, *Lender’s Terms*, borrowed fees → *The Collector Calls*; unpaid → *The Ledger Is Read* callbacks | yes |
| Alliance | *A Proposal Across the Canal* → *The Mill’s Share* | yes |
| Cough | *The Damp Season* (ignore) → *The Family Cough* (and the heir’s health) | yes |
| Land | *Four Acres…* → *The Boundary Stone* → *Aldous’s Grandson* or *Old Bad Blood* | yes |
| Tenancy | *Rent Day* (organise) → *First Refusal* | no |
| Apprentice | *The Boy at the Door* → *Master Wick* | yes |
| Levee | *Collection for the Millrace Levee* → *Spring Floods* (levee unlocks an option) | no |
| Guild | *The Guild Door* → *A Favour From the Guild*, *Duty Days* | yes |
| Siblings | *A Brother’s Portion* → *A Cousin Returns* | yes |
| Books | *The Book Auction* → *The Book Room* | yes |
| Fire | *A Cracked Chimney* → *Fire in the Night* | no |
| Journeyman | *Forty Casks…* (hire) → *The Journeyman Wants More* → *Rook & Sons* | yes |
| Marks | wells, bridge, lanterns, school bench (feed *A Name the Town Knows*) | — |
| Learning | *The Night Class*, *A Lecturer From the Capital* (feed *The Open Book*) | — |

## Balance notes from simulation
* Bonds were too easy at first (random play reached 7+ in 76 % of runs). A per-ledger drift of −1 and a debt ≤ 2 condition for *A Full Table* fixed that.
* *A Roof That Stays* was trivial for the Cooperage (two starting properties); it now requires one more property than the family began with.
* Options that were strictly dominated by an always-available option were rebalanced (`scripts/dominance.ts` reports none now).
* Knowledge ambition target lowered from 7 to 6 in two generations after the oracle bot reached it only 12 % of the time.
