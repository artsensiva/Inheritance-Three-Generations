import type { EventDef } from '../engine/types'

/** Openers (generation 1) and generation-start "inheritance readings" (generations 2–3). */
export const EVENTS_A: EventDef[] = [
  // ---------------- generation 1 openers ----------------
  {
    id: 'cooper_open', title: 'Forty Casks by Midsummer', art: 'hammer', phase: ['youth'], gens: [1], weight: 1, theme: 'work', chain: 'brewery',
    text: 'Dawn at the {family} Cooperage. Hartwell’s brewery wants forty casks by midsummer — more than one bench can make in the hours a day has. The guild clerk is watching how you answer.',
    options: [
      { id: 'a', label: 'Take it all and work through the nights', hint: 'Fast money, hard on the body.', fx: { m: 3, h: -2, skill: { craft: 1 } }, result: 'Forty casks, delivered grey-faced. The brewery pays on the day, and your hands are quicker for it.', key: true },
      { id: 'b', label: 'Take it and hire a journeyman for the season', hint: 'Less money, a stranger learns your methods.', fx: { m: 2, flags: ['hired_journeyman'], sched: [{ ev: 'journeyman_leaves', delay: 3 }] }, result: 'Rook, a quick lad from the docks, joins the bench. The order lands on time, and Rook watches everything you do.', key: true },
      { id: 'c', label: 'Take only what the bench can bear', hint: 'Slow and steady; regulars stay loyal.', fx: { m: 1, b: 1, flags: ['loyal_customers'] }, result: 'You keep the old customers whole and let the brewery’s extra go to a rival. The street thanks you at the pump.' },
    ],
  },
  {
    id: 'tenant_open', title: 'Rent Day', art: 'wheat', phase: ['youth'], gens: [1], weight: 1, theme: 'land', chain: 'tenancy',
    text: 'The landlord’s agent rides out early with a new ledger. Rents on the north road are rising by a quarter, he says, because the canal has made the land valuable. Three other households stand in the lane, listening.',
    options: [
      { id: 'a', label: 'Pay the new rent and say nothing', hint: 'Safe today. The rent keeps rising.', fx: { m: -1 }, result: 'The agent nods and rides on. The coin is gone; so is the argument.' },
      { id: 'b', label: 'Organise the other tenants to answer together', hint: 'Risky: landlords punish ringleaders.', risk: { p: 0.7, fail: { m: -2, b: -1, flags: ['blacklisted'] }, failResult: 'The steward names you as ringleader. Your rent rises twice over and the other tenants stop meeting your eye.', failHint: 'Lose 2 coin; bonds fall.' }, fx: { b: 1, k: 1, skill: { civic: 1 }, flags: ['tenant_union'], sched: [{ ev: 'landlord_sells', delay: 2 }] }, result: 'Four households sign one letter. The agent is polite for the first time in years, and the landlord’s steward starts counting names.', key: true },
      { id: 'c', label: 'Work the landlord’s own fields to cover the rise', hint: 'Money-free, but it costs your back.', fx: { m: 1, h: -2 }, result: 'You trade a month of dawn-to-dark labour for a lighter rent. The landlord’s fields look better than yours.' },
    ],
  },
  {
    id: 'inn_open', title: 'The Creditor’s Chair', art: 'coin', phase: ['youth'], gens: [1], weight: 1, theme: 'money', chain: 'loan',
    text: 'Mr Veck of the Lantern Bank sits in your best chair and taps the ledger. Four crowns owed, interest due. The inn is full tonight, and he has noticed that too.',
    options: [
      { id: 'a', label: 'Pay what the till holds', hint: 'Shrinks the debt; the till is bare.', fx: { m: -2, debt: -1 }, result: 'Veck counts the coins twice, writes one line, and leaves the chair warm.' },
      { id: 'b', label: 'Throw a feast week to fill the till', hint: 'Needs stamina; everybody will see you try.', fx: { m: 2, h: -1, b: 1 }, result: 'Six nights of full rooms and sore feet. The inn’s name is on every tongue, and the till is heavier by morning.' },
      { id: 'c', label: 'Borrow two more against the cellar', hint: 'Immediate cash. Veck will return.', fx: { m: 2, debt: 2, flags: ['loan_taken', 'cellar_pledged'], sched: [{ ev: 'collector_calls', delay: 2 }] }, result: 'Veck smiles for the first time. The cellar is written into his ledger, next to your name.', key: true },
    ],
  },

  // ---------------- generation start: the inheritance is read ----------------
  {
    id: 'will_debt', title: 'The Ledger Is Read', art: 'scroll', phase: ['youth'], gens: [2, 3], weight: 10, theme: 'inheritance', when: { debt: 3 },
    text: '{name} sits in the back room while the family’s papers are opened. The debts are larger than anyone ever said out loud.',
    callbacks: [
      { if: { flags: ['loan_taken'] }, cause: 'flag:loan_taken', text: 'The lender’s loan from the previous generation is still on the page, with every season’s interest beside it.' },
      { if: { flags: ['owes_veck'] }, cause: 'flag:owes_veck', text: 'A line in the margin reads: “Season of labour, owed in kind.”' },
    ],
    options: [
      { id: 'a', label: 'Work the debt down with long hours', hint: 'Slow, certain, and exhausting.', fx: { h: -1, debt: -2 }, result: 'Two years of early starts. The figure shrinks, and so does the time for anyone to sit down.' },
      { id: 'b', label: 'Call on kin to share the burden', hint: 'Needs close family. They will remember it.', req: { b: 5 }, fx: { b: -1, debt: -3, flags: ['owes_kin'] }, result: 'Cousins pay what they can, and say they will not mention it. The family will mention it for years.' },
      { id: 'c', label: 'Read the small print and negotiate', hint: 'Needs a clear head for contracts.', req: { k: 4 }, fx: { debt: -3, skill: { civic: 1 } }, result: 'You find a clause everyone had stopped reading. The creditor, caught out, settles for less.' },
    ],
  },
  {
    id: 'will_property', title: 'Keys on the Table', art: 'house', phase: ['youth'], gens: [2, 3], weight: 8, theme: 'inheritance', when: { debtMax: 2, anyFlags: ['dir_steward', 'dir_share'], anyProp: ['workshop', 'plot', 'inn', 'cottage', 'stall', 'barge', 'library'] },
    text: 'The keys are laid out on the table: the {family} property is yours to run. Everyone at the table has an opinion about how.',
    callbacks: [
      { if: { flags: ['partner_rook'] }, cause: 'flag:partner_rook', text: 'Rook’s name is on the bench beside yours, from the partnership your parent agreed.' },
      { if: { flags: ['shared_estate'] }, cause: 'flag:shared_estate', text: 'Half of every ledger will go to your siblings this generation — that was the price of dividing fairly.' },
    ],
    options: [
      { id: 'a', label: 'Run it exactly as it was', hint: 'Everyone will approve. Nothing improves.', fx: { b: 1 }, result: 'The old ways hold. People are warmer toward you than toward anyone who changed things.' },
      { id: 'b', label: 'Rework it in your own way', hint: 'A small outlay; a cleverer routine.', fx: { m: -1, k: 1, skill: { trade: 1 }, flags: ['reworked'] }, result: 'Out go the old ledgers, in come yours. The first month is awkward and the second is better.' },
      { id: 'c', label: 'Rent out the spare rooms and sheds', hint: 'Immediate income. Strangers in the house.', fx: { m: 2, b: -1 }, result: 'Lodgers pay on the first of the month. The kitchen is quieter than it used to be.' },
    ],
  },
  {
    id: 'will_nothing', title: 'No Deeds to Read', art: 'scroll', phase: ['youth'], gens: [2, 3], weight: 9, theme: 'inheritance', when: { noProp: ['workshop', 'plot', 'inn', 'cottage', 'stall', 'barge', 'library'] },
    text: 'There is no deed to read. The family’s property is a short list: a few tools, a name, and each other.',
    callbacks: [
      { if: { flags: ['sold_workshop'] }, cause: 'flag:sold_workshop', text: 'A shadow on the wall shows where the workshop’s sign once hung.' },
      { if: { flags: ['dir_scholar'] }, cause: 'flag:dir_scholar', text: 'The sale that paid for your education left the house nearly bare.' },
    ],
    options: [
      { id: 'a', label: 'Take day work on the docks', hint: 'Money now, wear on the back.', fx: { m: 2, h: -1 }, result: 'You haul grain for coins and fall asleep in your boots.' },
      { id: 'b', label: 'Apprentice yourself to a craft', hint: 'Slow start; the skill is yours to keep.', fx: { m: -1, k: 1, skill: { craft: 1 } }, result: 'A joiner takes you for half-wages and a promise. The bench is yours by autumn.' },
      { id: 'c', label: 'Lean on the family’s name and the street’s goodwill', hint: 'Bonds do the work.', req: { b: 4 }, fx: { b: 1, m: 1 }, result: 'Neighbours send small jobs your way. You are paid in coin, bread and favours.' },
    ],
  },
  {
    id: 'orphaned', title: 'The Empty Chair', art: 'candle', phase: ['youth'], gens: [2, 3], weight: 30, theme: 'inheritance', when: { flags: ['early_orphan'] },
    cause: 'flag:early_orphan',
    text: 'Fever took the head of the household before the harvest. {name} is young for the keys, and the town has come to look at them.',
    options: [
      { id: 'a', label: 'Let an uncle take you in', hint: 'A roof and a guardian, at a price.', fx: { b: 1, m: -1 }, result: 'Uncle Joss sets a place at his table and a ledger beside it. You owe him, and he does not let you forget.' },
      { id: 'b', label: 'Take work and hold the house yourself', hint: 'Independence, early.', fx: { h: -1, m: 2, skill: { civic: 1 } }, result: 'You hold the keys at fifteen and learn quickly what everything costs.' },
      { id: 'c', label: 'Go to the guild’s school-house', hint: 'Books before bread.', fx: { k: 1, b: -1, skill: { letters: 1 } }, result: 'The guild school-house is cold and quiet. You learn to read the minutes.' },
    ],
  },
  {
    id: 'scholar_heir', title: 'Home From the City', art: 'book', phase: ['youth'], gens: [2, 3], weight: 20, theme: 'inheritance', when: { flags: ['dir_scholar'] },
    cause: 'flag:dir_scholar',
    text: 'Years of study taught {name} to read the world, and to be a little foreign at home. The family’s money paid for it; the town remembers.',
    options: [
      { id: 'a', label: 'Take a clerk’s desk in the capital', hint: 'Good pay, far from the family.', fx: { m: 3, b: -1, skill: { letters: 1 }, flags: ['city_post'] }, result: 'The ministry’s clerks wear grey and pay well. Every letter home is shorter than the last.', key: true },
      { id: 'b', label: 'Bring what you learned home', hint: 'Slow to pay; the family grows with you.', fx: { b: 1, skill: { civic: 1 }, k: 1 }, result: 'You draft the family’s letters, check its sums, and teach the cousins their numbers.' },
      { id: 'c', label: 'Teach the town’s children', hint: 'Little coin; a good name.', fx: { b: 1, flags: ['mark_school'] }, result: 'Master Pell lends you his Saturday room. Forty children learn from the family that sold its workshop to learn.', key: true },
    ],
  },
  {
    id: 'shared_house', title: 'A House Divided', art: 'house', phase: ['youth'], gens: [2, 3], weight: 20, theme: 'inheritance', when: { flags: ['dir_share'] },
    cause: 'flag:dir_share',
    text: 'Everyone’s share is on the table. So is everyone’s opinion. The estate pays only half what it used to, and the siblings are watching the books.',
    options: [
      { id: 'a', label: 'Run it as one joint household', hint: 'Peace now; shares stay tangled.', fx: { b: 1 }, result: 'Five elbows at one table. It works, mostly because nobody wants to be the one who walks out.' },
      { id: 'b', label: 'Buy your siblings out in instalments', hint: 'Frees the estate; a standing payment.', fx: { clear: ['shared_estate'], obl: ['sibling_share'] }, result: 'You sign a paper promising a coin a season. The estate is whole again, and so is the obligation.', key: true },
      { id: 'c', label: 'Let each sibling run their own half', hint: 'Less friction, a little cash.', fx: { m: 1 }, result: 'Each takes a corner of the work. The accounts are clearer, if smaller.' },
    ],
  },
  {
    id: 'will_plain', title: 'A New Generation at the Table', art: 'house', phase: ['youth'], gens: [2, 3], weight: 1, theme: 'inheritance',
    text: 'The family table has a new head. The house looks the same, but the weather in it is different.',
    options: [
      { id: 'a', label: 'Mend what is broken first', hint: 'Practical; a healthier house.', fx: { m: -1, h: 1, b: 1 }, result: 'A week with a hammer and a bucket. The house stops groaning.' },
      { id: 'b', label: 'Look for new work', hint: 'Slower start, wider choices.', fx: { k: 1, m: 1 }, result: 'You ask around at the pump and the guild door. Something will turn up.' },
      { id: 'c', label: 'Spend the first season with the family', hint: 'Nothing gained but each other.', fx: { b: 2 }, result: 'Nothing is accomplished, and everyone is glad you took the time.' },
    ],
  },
]
