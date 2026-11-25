# Inheritance: Three Generations

A single-player, turn-based card-strategy game about one family across three generations, set in the fictional canal town of Harrowmere in a fictional era.

> *Make a life for yourself. Discover what your children inherit from your choices.*

This is a **release candidate for external playtesting**. It has not been playtested by outside people, it has not been published anywhere, and nothing here shows that it will sell. See [Known issues](#known-issues-and-limitations).

## Run it

Requires Node 22.12+ (developed on Node 24, npm 11; see `.nvmrc`).

```bash
npm ci             # or npm install
npm run dev        # development server at http://localhost:5173
npm test           # 26 engine/content/save tests (about 20 s)
npm run simulate   # bot simulation across seeds (pass a number for runs per cell, default 300)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

The production build in `dist/` is a static site (about 349 KB JS, 13 KB CSS, no runtime network access, no remote fonts). Serve it with any static server. Opening `dist/index.html` directly with `file://` does not work in Chromium-based browsers because module scripts are blocked; use `npm run preview` or any static host.

## What the game is

* **Three generations**, 7 decisions each (21 per run), plus a household **ledger** twice per generation and a **heir decision** between generations.
* **Four resources.** Coin (household, 0–12), family bonds (household, 0–10), health (character, 0–10), knowledge (character, 0–10).
* **Three starting families:** the Marlow Cooperage (workshop and guild dues), the Tarn Tenancy (no property, rent due), the Gilded Hen inn (valuable, 4 debt).
* **Four ambitions** with explicit criteria: *A Roof That Stays*, *The Open Book*, *A Full Table*, *A Name the Town Knows*.
* **60 event definitions** (50–70 was the target), including **14 delayed-consequence chains** (12 scheduled by a choice, 2 triggered by standing state such as an unresolved feud or guild membership) and two themed groups (town marks, learning). Examples: sell the workshop to fund schooling → *The Hollow Bench* and *A Letter from the Capital* in the next generation; borrow from the Lantern Bank → *The Collector Calls* → the heir reads the debt in *The Ledger Is Read*; patch a chimney → *Fire in the Night*.
* **12 ending profiles** chosen from the final state, plus a per-run list of **threads of cause** and **facts**, generated only from the recorded history.
* A **family tree** that grows during play and a **legacy card** (SVG preview, PNG export) at the end.

## Who owns what (the state model)

| State | Belongs to | What happens at a generation change |
|---|---|---|
| Health | Current character | Never copied. The heir's health is rebuilt from a baseline of 7 plus explained upbringing modifiers (lean years, the family cough, clean water, orphaned young, hard winter). |
| Knowledge | Current character | Never copied. Heir starts at 1, plus schooling, a Book room, a reader parent, a school bench in town, or the Scholar path. Every modifier is shown on screen. |
| Skills (Craft, Letters, Trade, Husbandry, Healing, Civic sense; 0–3) | Current character | Levels 2–3 pass down one level lower; apprenticeship flags add +1. |
| Coin, family bonds | Household | Coin carries over. Bonds fade by 1 (Steward, Scholar) or rise by 1 (Share). |
| Property, debt, duties (obligations) | Household | **Inherited.** Steward takes everything; Scholar sells non-home property (proceeds repay debt first); Share halves debt (rounded up) and halves property income for the next generation. |
| Flags (consequences, "threads") | Household | Inherited. `child_*` upbringing flags are consumed at the transition and applied to the heir. |

## Architecture

```
src/engine/      pure simulation, no React, no I/O (seeded RNG, state, rules, endings, save format, bots)
src/content/     structured game data: catalog.ts (properties, duties, families, ambitions), events_a/b/c.ts, validate.ts
src/ui/          React interface (App, stages, parts, icons, legacy card generator, styles.css)
tests/           vitest suites
scripts/         simulate.ts (bot simulation), dominance.ts (static option-dominance check), transcript.ts (print a run)
docs/            DESIGN.md (rules in detail, chains, balance notes)
```

* The engine exposes pure functions: `newGame`, `choose`, `advance`, `chooseHeir`, `getEnding`. State is a plain JSON object and includes the RNG state, so a save resumes identically.
* Determinism: seeded mulberry32 PRNG. Same seed, family and choices give the same run (`Advanced` on the setup screen accepts a seed).
* The causal history records every decision and its effects. Scheduled consequences carry the id of the entry that caused them; later events and the ending quote those entries. The ending builder only emits titles and choice labels that exist in the history (a test enforces this).

## Editing content

Events are plain objects in `src/content/events_*.ts`. A minimal event:

```ts
{
  id: 'lantern_night', title: 'Lantern Night', art: 'candle',
  phase: ['late'], gens: [1, 2, 3], weight: 4, theme: 'town',
  when: { no: ['mark_lantern'] },                       // eligibility
  text: 'Harrowmere lights paper lanterns…',
  callbacks: [{ if: { flags: ['sold_workshop'] }, cause: 'flag:sold_workshop', text: '…' }],
  options: [
    { id: 'a', label: 'Host the lanterns — 1 coin', hint: 'A lasting mark on the town.',
      fx: { m: -1, b: 1, flags: ['mark_lantern'], sched: [{ ev: 'some_followup', gen: 1, delay: 1 }] },
      result: 'Two hundred lanterns on the black water.', key: true },
    { id: 'b', /* … */ risk: { p: 0.6, fail: { m: -3 }, failResult: '…', failHint: 'Lose 3 coin.' } },
  ],
}
```

* `fx` keys: `m` coin, `h` health, `k` knowledge, `b` bonds, `debt`, `flags`/`clear`, `gain`/`lose` (property), `skill`, `obl`/`free` (duties), `sched` (delayed events; `gen: 1` means the next generation).
* `chainOnly: true` keeps an event out of the random pool so it only appears when scheduled. `cause: 'flag:xyz'` shows a "Because of an earlier choice" box.
* Every event must have at least one option that is always selectable (no requirement, no cost). `npm test` fails otherwise. `npm run simulate` and `npx tsx scripts/dominance.ts` catch unreachable events and dominated options.
* Add a new property, duty, family or ambition in `src/content/catalog.ts`. Ambition and ending rules live in `src/engine/endings.ts`.

## Verification actually performed

* **Automated tests:** 26 pass (`npm test`): content validation and scope; no soft-locks at the worst resources for every event; determinism; resource bounds and termination across 240 random runs; inheritance rules (health not copied, steward/scholar/share, skills, upbringing flags, orphan opening after early death); delayed consequences naming their cause; ending explanations quote only recorded history; each ambition reachable from each start; random play cannot trivially win; save round-trip and continuation equivalence; corrupt, wrong-version, tampered and throwing storage.
* **Simulation** (`npm run simulate 120`, 10,080 bot runs): all runs terminated (max 50 steps); every one of the 60 events was reached; all 2,144 consequences that could be scheduled (target generation 1–3) arrived (a separate run of 900 bot runs). Ambition success rates by strategy (the "ambition" oracle bot): Roots 49 %, Open Book 43 %, Full Table 52 %, Town's Name 24 %; random play: 0–6 % on Roots/Open Book/Town's Name and 17 % on Full Table. Each greedy single-resource strategy (money, knowledge, bonds, health) reaches 40 % or more on at most one ambition. Early deaths occurred in 0.9 % of runs. These bots exercise the rules; they do **not** show that the game is fun.
* **Real browser (Chromium, built-in preview):** full runs played start to ending through the actual UI; new run, keyboard choice (key 2), save then reload then Continue (state identical), corrupted save handling (notice shown, bad save set aside), generation transition, ledger, heir choice, ending, PNG export (218 KB `image/png` produced), replay buttons; desktop and a 375 px mobile viewport (no horizontal scroll, sticky resource bar).
* **Accessibility:** automated axe-core scan on the title, setup, intro, event, result, ledger, heir, ending, history and how-to screens: 0 violations after fixes (the library was installed temporarily and removed). Not done: a manual screen-reader pass.
* **Estimated run length** (not measured with players): about 2,500 words are read per run, which is about 14 minutes of reading plus thinking time, so roughly 15–20 minutes.

## Known issues and limitations

* **No human playtest has been done.** Balance comes from bots; fun, clarity of wording and pacing are untested with people. The Tarn Tenancy is deliberately the hardest start and has the lowest ambition success rates.
* Writing is AI-assisted and was edited for consistency by reading full-run transcripts (`npx tsx scripts/transcript.ts <seed> <start> <ambition> <policy>` prints a full run), not tested across all combinations.
* Delayed consequences scheduled for "the next generation" by a generation-3 choice cannot occur (there is no generation 4); the choice chip still says it may come back. Several events share the same shape (pay coin, pay health, or take a free option).
* The ending profile and the ambition are judged separately, so a run can be called *The House Still Stands* while missing a "Roof That Stays" target that needs one more property than the family started with.
* English only. No audio (so there are no sound controls). No desktop packaging yet (the structure allows it: static build, no server).
* Chromium only was exercised. Firefox, Safari and real phones were not tested. The legacy card uses a serif system font stack, so its exact look differs by operating system.
* Saves live in one browser's local storage and are lost if site data is cleared.
* Not built, by design: accounts, payments, multiplayer, cloud saves, analytics, user-generated content, live AI generation.

## Remaining external-release steps (need your participation)

1. Outside playtesting (5–10 people, observed or recorded) and a revision pass on wording, balance and onboarding.
2. A decision on platform and distribution: web demo hosting, and/or itch.io / Steam (accounts, fees and store pages are yours to create).
3. Desktop packaging (for example Electron or Tauri) if a Steam release is wanted; this needs signing and store setup.
4. Art and audio pass if desired (all art here is simple original SVG; there is no audio).
5. Legal and tax setup for any paid release, a privacy statement (the game collects nothing today), and age rating forms.
6. Decide pricing and run the validation tests from the earlier decision memo before substantial additional production.

## Suggested commercial package (hypothesis only)

This is a hypothesis to test, not a forecast. No demand has been demonstrated.

* **Free web demo:** one starting family (the Marlow Cooperage), the first generation plus the heir decision, the family tree and the legacy card, with about 20 events and a few chains; a prompt to wish-list the full game.
* **Paid version:** all three families, three generations, four ambitions, 60 events, 12 endings, the legacy card, replay with other strategies. A low premium price on Steam or itch.io is the starting hypothesis; the price is a test variable.
* **Possible later content:** a second town or era with new events and chains, if the first release shows replay and word of mouth.
