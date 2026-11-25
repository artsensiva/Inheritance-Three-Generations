import type { EventDef } from '../engine/types'

/** Delayed-consequence chains. Many span generations. */
export const EVENTS_B: EventDef[] = [
  // ===== chain: education + selling the workshop =====
  {
    id: 'school_fees', title: 'Master Pell’s Fees', art: 'book', phase: ['prime'], gens: [1, 2], weight: 7, theme: 'education', chain: 'schooling', when: { prop: ['workshop'] },
    text: 'Master Pell of the town school will take one child from every street. He says yours reads as if the words were sweet. Fees are four coin a year; the workshop bench could use another pair of hands.',
    options: [
      { id: 'a', label: 'Sell the workshop to fund the school', hint: 'A child educated. The trade leaves the family.', req: { prop: ['workshop'] }, fx: { lose: ['workshop'], m: 1, flags: ['child_schooled', 'sold_workshop'], sched: [{ ev: 'hollow_bench', gen: 1, delay: 1 }, { ev: 'letter_from_capital', gen: 1, delay: 3 }] }, result: 'The dyers buy the bench and the sign. Pell takes the child on the first of the month, and the house is quieter.', key: true },
      { id: 'b', label: 'Pay the fees out of pocket', hint: 'Costs 3 coin. The workshop stays.', fx: { m: -3, flags: ['child_schooled'], sched: [{ ev: 'letter_from_capital', gen: 1, delay: 3 }] }, result: 'You count the fees onto Pell’s desk in small coins. The workshop stays yours.', key: true },
      { id: 'c', label: 'Teach the child your own work', hint: 'The skill stays in the family.', fx: { flags: ['child_apprenticed_best'], b: 1 }, result: 'Small hands learn your habits faster than words. The house fills with the sound of work.' },
    ],
  },
  {
    id: 'school_fees_plain', title: 'Master Pell’s Fees', art: 'book', phase: ['prime'], gens: [1, 2], weight: 7, theme: 'education', chain: 'schooling', when: { noProp: ['workshop'] },
    text: 'Master Pell of the town school will take one child from every street. He says yours reads as if the words were sweet. Fees are four coin a year; everyone at home is needed for the work.',
    options: [
      { id: 'a', label: 'Borrow the fees from the Lantern Bank', hint: 'A child educated. Veck is paid first.', fx: { m: 0, debt: 3, flags: ['child_schooled', 'loan_taken'], sched: [{ ev: 'letter_from_capital', gen: 1, delay: 3 }, { ev: 'collector_calls', delay: 2 }] }, result: 'Veck’s clerk draws up the loan in a hand like a ribbon. Pell’s fees are paid in full, in advance.', key: true },
      { id: 'b', label: 'Pay the fees from savings', hint: 'Costs 3 coin.', fx: { m: -3, flags: ['child_schooled'], sched: [{ ev: 'letter_from_capital', gen: 1, delay: 3 }] }, result: 'The fees go over in three dull handfuls. Nobody eats well that week.', key: true },
      { id: 'c', label: 'Teach the child your own work', hint: 'The skill stays in the family.', fx: { flags: ['child_apprenticed_best'], b: 1 }, result: 'The child learns by working alongside you. The days are longer and the evenings closer.' },
    ],
  },
  {
    id: 'hollow_bench', title: 'The Hollow Bench', art: 'hammer', phase: ['prime'], gens: [2], weight: 1, theme: 'work', chain: 'schooling', chainOnly: true, cause: 'flag:sold_workshop',
    text: 'The old workshop is a dyer’s shop now. {name} knows barrels only from the bits of stave kept in a drawer, and the guild remembers the name.',
    callbacks: [{ if: { skill: { letters: 1 } }, text: 'The letters your parent paid for open a different door from the one that was sold.' }],
    options: [
      { id: 'a', label: 'Rent a bench from the guild', hint: 'Learn the trade from scratch.', req: { flags: ['guild_member'] }, fx: { m: -1, skill: { craft: 1 }, obl: ['guild_dues'] }, result: 'A rented bench, a borrowed adze. The guild’s old men eye the name on your apron.' },
      { id: 'b', label: 'Take a clerk’s desk with the letters you have', hint: 'Needs real learning.', req: { k: 3 }, fx: { m: 2, skill: { letters: 1 }, k: 1 }, result: 'The grain office needs someone to read bills of lading. The school’s fees pay out in careful columns.', key: true },
      { id: 'c', label: 'Work the docks until something opens', hint: 'Immediate coin; the family sees little of you.', fx: { m: 1, b: -1 }, result: 'Eight hours of sacks a day. The dockmaster calls you by the wrong name.' },
    ],
  },
  {
    id: 'letter_from_capital', title: 'A Letter from the Capital', art: 'scroll', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'education', chain: 'schooling', chainOnly: true, cause: 'flag:child_schooled',
    text: 'A sealed letter with a ministry crest. A school fellow of your parent’s remembers the family — and has an opening in the registry.',
    callbacks: [
      { if: { flags: ['sold_workshop'] }, cause: 'flag:sold_workshop', text: 'With no workshop to go back to, the offer weighs differently than it would have.' },
      { if: { flags: ['loan_taken'] }, cause: 'flag:loan_taken', text: 'A salaried post would settle the old loan, if you can bear to leave.' },
    ],
    options: [
      { id: 'a', label: 'Take the post in the capital', hint: 'Salary and standing; the family stays behind.', req: { k: 3 }, fx: { m: 3, b: -2, skill: { letters: 1 }, flags: ['city_post'] }, result: 'The registry pays more in a season than the old bench in a year. The letters home grow shorter.', key: true },
      { id: 'b', label: 'Send a younger cousin instead; stay and manage', hint: 'The family gains a foothold.', fx: { b: 1, k: 1, flags: ['cousin_in_capital'] }, result: 'Your cousin goes in your place. A cousin in the capital is worth more than a coin in the house.' },
      { id: 'c', label: 'Decline; the house comes first', hint: 'Stability over opportunity.', fx: { b: 1, m: 1 }, result: 'You write a courteous refusal. The letter stays in the drawer, in case.' },
    ],
  },

  // ===== chain: the loan =====
  {
    id: 'lender_offer', title: 'Lender’s Terms', art: 'coin', phase: ['prime'], gens: [1, 2, 3], weight: 5, theme: 'money', chain: 'loan', when: { mMax: 4, debtMax: 6 },
    text: 'Veck’s clerk is handing out cards in the market. Coin today, repaid in two seasons, with a small friend’s fee. The card is tidy; the interest is not.',
    options: [
      { id: 'a', label: 'Borrow 4 coin', hint: 'A real cushion. A real debt.', fx: { m: 4, debt: 3, flags: ['loan_taken'], sched: [{ ev: 'collector_calls', delay: 2 }] }, result: 'Four coins, three on paper. The clerk blots the card and bows.', key: true },
      { id: 'b', label: 'Borrow a little — 2 coin', hint: 'A small cushion, a smaller debt.', fx: { m: 2, debt: 2, flags: ['loan_taken'], sched: [{ ev: 'collector_calls', delay: 2 }] }, result: 'Two coins, two on paper. It is easier to forget than to repay.', key: true },
      { id: 'c', label: 'Decline and stretch what you have', hint: 'Cautious. Teaches thrift.', fx: { b: 1, skill: { trade: 1 } }, result: 'You work out what the household really costs. It is less than you feared and more than you wanted.' },
    ],
  },
  {
    id: 'collector_calls', title: 'The Collector Calls', art: 'bell', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 1, theme: 'money', chain: 'loan', chainOnly: true, cause: 'flag:loan_taken',
    text: 'Veck’s collector knocks on the first of the month, polite as a drawn blade. The loan is due, interest on top.',
    callbacks: [
      { if: { flags: ['cellar_pledged'] }, cause: 'flag:cellar_pledged', text: 'The cellar you pledged is written into the page he is holding.' },
      { if: { flags: ['sold_workshop'] }, cause: 'flag:sold_workshop', text: 'He remarks that the workshop would have covered it.' },
    ],
    options: [
      { id: 'a', label: 'Pay in full', hint: 'Clear the debt now. Costs 3 coin.', fx: { m: -3, debt: -3, clear: ['loan_taken'] }, result: 'The collector crosses the line out with a flourish. The room feels larger.', key: true },
      { id: 'b', label: 'Plead for more time', hint: 'Free today. The debt grows; the family frets.', fx: { debt: 1, b: -1 }, result: 'The collector adds a season’s interest to the principal. His smile does not move.' },
      { id: 'c', label: 'Work a season in Veck’s warehouse', hint: 'Repay in labour. Health suffers.', fx: { h: -2, debt: -2, flags: ['owes_veck'] }, result: 'You spend a season stacking Veck’s crates. The debt shrinks; so does your back.', key: true },
    ],
  },
  // ===== chain: marriage alliance =====
  {
    id: 'match_offered', title: 'A Proposal Across the Canal', art: 'heart', phase: ['prime'], gens: [1, 2], weight: 5, theme: 'family', chain: 'alliance',
    text: 'The Ashdowns — mill owners with deep pockets and long opinions — suggest a match. A boatman’s daughter has been waiting at the lock for a year with a different proposal.',
    options: [
      { id: 'a', label: 'Accept the Ashdown alliance', hint: 'Money now; duties to in-laws for years.', fx: { m: 3, obl: ['in_laws'], flags: ['alliance'], sched: [{ ev: 'inlaws_dispute', gen: 1, delay: 2 }] }, result: 'The mill’s account opens in your favour. The mill’s family opens its expectations.', key: true },
      { id: 'b', label: 'Marry for love', hint: 'A warm house; less cushion.', fx: { b: 2, m: -1, flags: ['love_match'] }, result: 'A supper of boiled fish and no speeches. The house laughs more than it used to.' },
      { id: 'c', label: 'Delay and keep both doors open', hint: 'Time to learn who everyone is.', fx: { k: 1, skill: { civic: 1 } }, result: 'You learn what the Ashdowns want, what the boatman’s daughter fears, and that you are not ready for either.' },
    ],
  },
  {
    id: 'inlaws_dispute', title: 'The Mill’s Share', art: 'scroll', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'family', chain: 'alliance', chainOnly: true, cause: 'flag:alliance',
    text: 'The Ashdowns’ lawyer arrives with a grandparent’s will and questions about who owes what to whom. The family smiles stiffly at the table.',
    options: [
      { id: 'a', label: 'Pay out the claim', hint: 'Ends the duty. Costs 3 coin.', fx: { m: -3, free: ['in_laws'] }, result: 'You settle the claim and shake hands. The duties to in-laws end on the signing.', key: true },
      { id: 'b', label: 'Contest it', hint: 'Risky. A win ends it; a loss leaves a feud.', risk: { p: 0.55, fail: { m: -3, b: -2, flags: ['feud'], obl: ['feud'] }, failResult: 'The magistrate sides with the mill. The Ashdowns will not be spoken of at the table.', failHint: 'Lose 3 coin, bonds fall, a feud begins.' }, fx: { m: 1, b: -1, free: ['in_laws'] }, result: 'The magistrate finds for you on a technicality. The claim lapses, and so do invitations.', key: true },
      { id: 'c', label: 'Accept mediation from a respected elder', hint: 'Needs strong family bonds.', req: { b: 6 }, fx: { b: 1, m: -1, free: ['in_laws'] }, result: 'Old Mrs Hale hears both sides over tea. The claim dissolves into a handshake and a pie.' },
    ],
  },

  // ===== chain: damp house → family cough =====
  {
    id: 'damp_season', title: 'The Damp Season', art: 'water', phase: ['prime'], gens: [1, 2, 3], weight: 5, theme: 'health', chain: 'cough', when: { anyProp: ['cottage', 'inn', 'workshop'] },
    text: 'Mould blooms in the corners of the house, and a cough that will not leave has settled in the children’s chests.',
    options: [
      { id: 'a', label: 'Repair the roof and drains', hint: 'Costs 2 coin. A dry house for good.', fx: { m: -2, h: 1, flags: ['dry_house'] }, result: 'A mason, two roofers, a week of rain. The corners are dry by spring.', key: true },
      { id: 'b', label: 'Patch what you can', hint: 'Costs 1 coin. Half a fix.', fx: { m: -1, flags: ['damp_patched'] }, result: 'You stuff the worst gaps with tar and moss. It holds until it does not.' },
      { id: 'c', label: 'Make do; there is no coin for it', hint: 'No cost now. The cough stays in the house.', fx: { h: 0, flags: ['family_cough'], sched: [{ ev: 'the_cough', gen: 1, delay: 2 }] }, result: 'You live with the damp. The children’s cough becomes a family sound, like a clock.', key: true },
    ],
  },
  {
    id: 'the_cough', title: 'The Family Cough', art: 'water', phase: ['prime'], gens: [2, 3], weight: 1, theme: 'health', chain: 'cough', chainOnly: true, cause: 'flag:family_cough',
    text: '{name} wakes with the same rattling breath that has followed the household for years. It is not a curse; it is a damp house.',
    options: [
      { id: 'a', label: 'Pay the town physician', hint: 'Costs 2 coin. Clears the cough for good.', fx: { m: -2, h: 1, clear: ['family_cough'] }, result: 'The physician dries the lungs and the walls both, with a lecture and a salve.', key: true },
      { id: 'b', label: 'Learn the old herb remedies', hint: 'Needs Healing skill.', req: { skill: { healing: 1 } }, fx: { skill: { healing: 1 }, clear: ['family_cough'] }, result: 'Thyme, honey and a steam bath. The cough lifts and the herbs go on the lintel.' },
      { id: 'c', label: 'Rest, broth and patience', hint: 'Free. The cough stays.', fx: { b: 1 }, result: 'Everyone takes a turn at the bedside. The cough eases but does not leave.' },
    ],
  },

  // ===== chain: land → boundary → neighbours =====
  {
    id: 'plot_for_sale', title: 'Four Acres by the North Road', art: 'wheat', phase: ['prime'], gens: [1, 2, 3], weight: 6, theme: 'land', chain: 'land', when: { noProp: ['plot'] },
    text: 'Old Marden is selling up. The soil is tired but honest, and the price is higher than it should be. A plot is a thing that cannot be taken in a bad year.',
    options: [
      { id: 'a', label: 'Buy the plot', hint: 'Costs 4 coin. Land of your own.', fx: { m: -4, gain: ['plot'], flags: ['plot_buyer'], sched: [{ ev: 'boundary_stone', delay: 2 }] }, result: 'You sign the deed with a shaking hand. For the first time, the earth under you is yours.', key: true },
      { id: 'b', label: 'Lease half of it', hint: 'Costs 1 coin. Learn the land.', fx: { m: -1, skill: { husbandry: 1 }, flags: ['plot_leased'] }, result: 'Half a lease, half the worry. You turn the soil twice and learn what it likes.' },
      { id: 'c', label: 'Pass', hint: 'Keep your coin; keep your options.', fx: {}, result: 'Someone from the next village buys it by Thursday.' },
    ],
  },
  {
    id: 'landlord_sells', title: 'First Refusal', art: 'wheat', phase: ['prime'], gens: [1, 2], weight: 1, theme: 'land', chain: 'tenancy', chainOnly: true, cause: 'flag:tenant_union',
    text: 'The landlord’s steward is selling the north road land in lots. Tenants who signed the letter get first refusal. The price is steep, and the offer will not last.',
    options: [
      { id: 'a', label: 'Buy your plot', hint: 'Costs 3 coin. Ends the rent forever.', req: { obl: ['rent'] }, fx: { m: -3, gain: ['plot'], free: ['rent'], flags: ['plot_buyer'] }, result: 'The steward hands over the deed with obvious displeasure. You no longer rent from anyone.', key: true },
      { id: 'b', label: 'Buy together with the other tenants', hint: 'Costs 1 coin. Shared deed.', fx: { m: -1, b: 1, skill: { civic: 1 }, flags: ['tenant_cooperative'] }, result: 'Four families sign one deed. Each owns a fifth and answers to the other four.' },
      { id: 'c', label: 'Pass; rents are bearable', hint: 'Keep your coin.', fx: { b: 1 }, result: 'The lots go to a dealer. The rent next year is higher, but the fields are the same.' },
    ],
  },
  {
    id: 'boundary_stone', title: 'The Boundary Stone', art: 'wheat', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 1, theme: 'land', chain: 'land', chainOnly: true, cause: 'flag:plot_buyer',
    text: 'Your neighbour Aldous has moved the boundary stone in the night — a foot, maybe two. He has not said a word, and he is watching from his window.',
    options: [
      { id: 'a', label: 'Share a drink and split the difference', hint: 'Cheap peace.', fx: { b: 1, flags: ['neighbor_friend'], sched: [{ ev: 'neighbor_returns', gen: 1, delay: 2 }] }, result: 'You drink his cider, he moves the stone half back. He tells his sons you are decent.', key: true },
      { id: 'b', label: 'Take it to the town court', hint: 'Needs book learning. A coin-flip.', req: { k: 4 }, risk: { p: 0.6, fail: { m: -2, flags: ['feud'], obl: ['feud'] }, failResult: 'The clerk finds a flaw in your deed. Aldous grins at the gate for years.', failHint: 'Lose 2 coin; a feud begins.' }, fx: { m: 1, skill: { civic: 1 }, flags: ['won_boundary'] }, result: 'The magistrate reads the deed twice and moves the stone back. Aldous does not wave again.' },
      { id: 'c', label: 'Build a wall right on your line', hint: 'Firm, final, unfriendly.', fx: { m: -1, flags: ['feud'], obl: ['feud'] }, result: 'Stone by stone, you mark the line. The wall is straight and no one mentions it.', key: true },
    ],
  },
  {
    id: 'neighbor_returns', title: 'Aldous’s Grandson', art: 'wheat', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'land', chain: 'land', chainOnly: true, cause: 'flag:neighbor_friend',
    text: 'A boy with Aldous’s squint stands at the gate with a spade and a proposal. His family remembers how your parent settled the boundary.',
    options: [
      { id: 'a', label: 'Share the work and split the harvest', hint: 'Long days; a good harvest.', fx: { m: 2, h: -1, skill: { husbandry: 1 }, b: 1 }, result: 'Two families, one season. The harvest comes in a week early and the barn is full.', key: true },
      { id: 'b', label: 'Sell him the east strip', hint: 'Cash now, land later.', req: { prop: ['plot'] }, fx: { m: 3, b: 1 }, result: 'A strip of earth changes hands and a handshake lasts a generation.' },
      { id: 'c', label: 'Thank him; do nothing', hint: 'Keep it simple.', fx: { b: 1 }, result: 'You walk him to the gate. He leaves with a basket of eggs.' },
    ],
  },
  {
    id: 'feud_flares', title: 'Old Bad Blood', art: 'bell', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 8, theme: 'family', chain: 'feud', when: { obl: ['feud'] },
    text: 'The feud has outlasted its cause. The two families nod curtly at the pump and carry on in their own ways.',
    options: [
      { id: 'a', label: 'Offer peace with a gift', hint: 'Costs 2 coin. Ends the feud.', fx: { m: -2, free: ['feud'], clear: ['feud'], b: 1 }, result: 'A ham, a cheese and a long supper. When you leave, nobody is quite angry.', key: true },
      { id: 'b', label: 'Keep your pride', hint: 'Free. The feud grinds on.', fx: { b: -1, m: 1 }, result: 'You hold the gate and your tongue. The coin you saved is cold.' },
      { id: 'c', label: 'Take it to the elders', hint: 'Needs Civic sense.', req: { skill: { civic: 1 } }, fx: { free: ['feud'], clear: ['feud'] }, result: 'Three elders hear it in an hour. The matter is closed by supper, and nobody gets what they wanted.' },
    ],
  },

  // ===== chain: apprentice =====
  {
    id: 'stray_apprentice', title: 'The Boy at the Door', art: 'heart', phase: ['prime'], gens: [1, 2], weight: 5, theme: 'people', chain: 'apprentice',
    text: 'A canal orphan asks for a bed and a task. He is clever in a way that costs money if you are not careful, and he has looked at every wall twice.',
    options: [
      { id: 'a', label: 'Take him in as an apprentice', hint: 'Costs 1 coin. A debt of kindness.', fx: { m: -1, b: 1, flags: ['took_apprentice'], sched: [{ ev: 'apprentice_returns', gen: 1, delay: 2 }] }, result: 'Wick sleeps by the stove and eats like three. By midwinter he is the first awake.', key: true },
      { id: 'b', label: 'Hire him for the season', hint: 'Short term, short memory.', fx: { m: 1 }, result: 'He works for coin and leaves at the first thaw. You do not see him again.' },
    ],
  },
  {
    id: 'apprentice_returns', title: 'Master Wick', art: 'heart', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'people', chain: 'apprentice', chainOnly: true, cause: 'flag:took_apprentice',
    text: 'The boy you fed is a master now, with a shop of his own and a long memory. He says the family’s kindness is a story he has told every apprentice since.',
    options: [
      { id: 'a', label: 'Accept his partnership', hint: 'Income and a shared name.', fx: { m: 2, b: 1, flags: ['partner_wick'] }, result: 'Wick’s name goes over the door beside yours. The accounts are shared, and so are the opinions.', key: true },
      { id: 'b', label: 'Ask him to teach your child the finer work', hint: 'The skill passes on.', fx: { flags: ['child_apprenticed_best'], b: 1 }, result: 'Wick trains your child for a season, charging only in stories.' },
      { id: 'c', label: 'Thank him and let him go', hint: 'No obligation; his letters teach you.', fx: { b: 1, k: 1 }, result: 'He sends a brace of fowl at midwinter, every winter.' },
    ],
  },

  // ===== chain: the levee =====
  {
    id: 'levee_collection', title: 'Collection for the Millrace Levee', art: 'water', phase: ['prime'], gens: [1, 2], weight: 6, theme: 'town', chain: 'levee',
    text: 'The reeve goes door to door with a ledger. If spring floods are bad, the low houses go first, and everyone knows which houses those are.',
    options: [
      { id: 'a', label: 'Give generously — 3 coin', hint: 'A lasting mark on the town.', fx: { m: -3, b: 1, flags: ['mark_levee'], sched: [{ ev: 'spring_flood', delay: 2 }] }, result: 'The reeve writes your name on the levee’s ledger. It will be read on the day of the flood.', key: true },
      { id: 'b', label: 'Give a little — 1 coin', hint: 'Do your part, no more.', fx: { m: -1, flags: ['gave_little'], sched: [{ ev: 'spring_flood', delay: 2 }] }, result: 'The reeve nods and moves on. A coin is a coin.' },
      { id: 'c', label: 'Give nothing and trust the old banks', hint: 'Keep your coin. Hope for dry weather.', fx: { flags: ['no_levee'], sched: [{ ev: 'spring_flood', delay: 2 }] }, result: 'The reeve marks the door and says nothing. The old banks have held for forty years.', key: true },
    ],
  },
  {
    id: 'spring_flood', title: 'Spring Floods', art: 'water', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 1, theme: 'town', chain: 'levee', chainOnly: true,
    text: 'The Millrace rises in the night. Bells ring down Canal Row, and every door in the low streets opens at once.',
    callbacks: [
      { if: { flags: ['mark_levee'] }, cause: 'flag:mark_levee', text: 'The levee your family helped fund is holding, mostly — the water is up to its shoulders, not over.' },
      { if: { flags: ['no_levee'] }, cause: 'flag:no_levee', text: 'Without the levee’s money, the old bank is crumbling at the corner by your gate.' },
    ],
    options: [
      { id: 'a', label: 'Hold the line with the neighbours', hint: 'Only possible if the levee was built.', req: { flags: ['mark_levee'] }, fx: { b: 2 }, result: 'Forty people on one bank, passing sandbags. The levee holds, and the street remembers who dug.', key: true },
      { id: 'b', label: 'Save the stock and sell it at flood prices', hint: 'Gains 1 coin; costs some health.', fx: { m: 1, h: -1 }, result: 'You carry the stock up the hill and sell it dear to those who lost theirs. Your back remembers.' },
      { id: 'c', label: 'Open your upper floor to flooded neighbours', hint: 'Free. Bonds over coin.', fx: { b: 1 }, result: 'Eleven strangers sleep on your floor. By Sunday they are neighbours again.' },
    ],
  },

  // ===== chain: guild =====
  {
    id: 'guild_membership', title: 'The Guild Door', art: 'key', phase: ['prime'], gens: [1, 2], weight: 5, theme: 'guild', chain: 'guild', when: { no: ['guild_member'] },
    text: 'The Harrowmere Guild admits tradespeople who can pay the entry and stomach the oath. Members get contracts, vouching, and dues.',
    options: [
      { id: 'a', label: 'Join and swear the oath', hint: 'Costs 2 coin and dues forever.', fx: { m: -2, obl: ['guild_dues'], flags: ['guild_member'], skill: { trade: 1 } }, result: 'You raise your right hand and sign in a ledger that has your parents’ neighbours in it.', key: true },
      { id: 'b', label: 'Stay independent', hint: 'No dues, no protection.', fx: { flags: ['independent'], b: 1 }, result: 'You keep your freedom and your coin. The guild keeps its doors.' },
    ],
  },
  {
    id: 'guild_favor', title: 'A Favour From the Guild', art: 'key', phase: ['prime', 'late'], gens: [2, 3], weight: 6, theme: 'guild', chain: 'guild', when: { flags: ['guild_member'] }, cause: 'flag:guild_member',
    text: 'Your family’s name is still in the guild book. Old Ferrar remembers it and says there is a favour owed, if you care to claim it.',
    options: [
      { id: 'a', label: 'Claim a guild contract', hint: 'Steady income.', fx: { m: 3, flags: ['guild_contract'] }, result: 'Three months of guaranteed orders, signed on guild paper.', key: true },
      { id: 'b', label: 'Ask the guild to vouch for the debt', hint: 'Needs debt to ease.', req: { debt: 1 }, fx: { debt: -3, b: -1 }, result: 'The guild writes to the creditor. The debt shrinks; the family’s pride does too.' },
      { id: 'c', label: 'Let the favour sleep', hint: 'Keep it for a worse day.', fx: { b: 1 }, result: 'Ferrar nods. A favour kept is a favour that grows.' },
    ],
  },
  {
    id: 'guild_summons', title: 'Duty Days', art: 'bell', phase: ['late'], gens: [1, 2, 3], weight: 5, theme: 'guild', chain: 'guild', when: { flags: ['guild_member'] },
    text: 'The guild calls its members to guard the canal gates for three nights during the fair. Whoever does not serve pays or apologises.',
    options: [
      { id: 'a', label: 'Serve the three nights', hint: 'Costs health. Earns standing.', fx: { h: -1, b: 1 }, result: 'Three cold nights at the gate with a lantern and men you have known all your life.' },
      { id: 'b', label: 'Pay for a substitute — 2 coin', hint: 'Cost, no fuss.', fx: { m: -2 }, result: 'A dock lad takes your lantern, and the guild takes your coin.' },
      { id: 'c', label: 'Send an apology and accept the fine', hint: 'Free, but the guild frowns.', fx: { b: -1 }, result: 'A polite note, a polite reply, a fine you have not yet paid.' },
    ],
  },

  // ===== chain: siblings =====
  {
    id: 'siblings_claim', title: 'A Brother’s Portion', art: 'heart', phase: ['late'], gens: [1, 2], weight: 5, theme: 'family', chain: 'sibling', when: { b: 2 },
    text: 'Your brother Alder has come home with his accounts and a grievance: the house was never fully yours.',
    options: [
      { id: 'a', label: 'Give him a share and a handshake', hint: 'Costs 2 coin. Heals the family.', fx: { m: -2, b: 2, flags: ['sibling_trust'], sched: [{ ev: 'sibling_return', gen: 1, delay: 1 }] }, result: 'Alder weighs the coins and then your face. By midnight the lamp is still burning in the kitchen.', key: true },
      { id: 'b', label: 'Refuse and cite the will', hint: 'Keeps the coin. Costs the peace.', fx: { b: -2, flags: ['estranged'], sched: [{ ev: 'sibling_return', gen: 1, delay: 1 }] }, result: 'He leaves by the morning ferry. The kitchen lamp goes out early that night.', key: true },
      { id: 'c', label: 'Agree to pay in instalments', hint: 'Standing payment, easier peace.', fx: { obl: ['sibling_share'], b: 1 }, result: 'A paper, a signature and a coin a season. Alder visits at the festival.' },
    ],
  },
  {
    id: 'sibling_return', title: 'A Cousin Returns', art: 'heart', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'family', chain: 'sibling', chainOnly: true,
    callbacks: [
      { if: { flags: ['sibling_trust'] }, cause: 'flag:sibling_trust', text: 'The cousin carries your uncle’s old pocket watch. The family settled well, and the story is still told.' },
      { if: { flags: ['estranged'] }, cause: 'flag:estranged', text: 'The cousin comes warily. The family on that side of the canal still remembers the refusal.' },
    ],
    text: 'A relative from the far side of the family steps off the ferry with a bag and a reason.',
    options: [
      { id: 'a', label: 'Take them in for the winter', hint: 'Free. A warm welcome.', fx: { b: 1 }, result: 'An extra bed, an extra voice, an extra pair of hands for the hay.' },
      { id: 'b', label: 'Hear them out over supper', hint: 'Needs the old trust.', req: { flags: ['sibling_trust'] }, fx: { b: 1, m: 2 }, result: 'They bring savings and a small loan. Old kindness comes back with a clasp.', key: true },
      { id: 'c', label: 'Settle the old grievance', hint: 'Costs 2 coin. Ends the estrangement.', req: { flags: ['estranged'] }, fx: { m: -2, clear: ['estranged'], b: 2 }, result: 'A long supper, a coin and a straight conversation. The estrangement ends.', key: true },
    ],
  },

  // ===== chain: books =====
  {
    id: 'book_auction', title: 'The Book Auction', art: 'book', phase: ['prime'], gens: [1, 2, 3], weight: 5, theme: 'education', chain: 'books', when: { noProp: ['library'] },
    text: 'Doctor Aubrey’s shelves go under the hammer: a hundred volumes of law, herbs, ships and unfortunate poetry. The auctioneer gives the whole lot a cheerful price.',
    options: [
      { id: 'a', label: 'Buy the whole library — 3 coin', hint: 'A Book room for the house.', fx: { m: -3, gain: ['library'], k: 1, sched: [{ ev: 'books_in_hand', gen: 1, delay: 1 }] }, result: 'Four carts of books arrive. The house smells like old paper for a month.', key: true },
      { id: 'b', label: 'Bid only for the herbs and law volumes', hint: 'Costs 1 coin.', fx: { m: -1, k: 1, skill: { healing: 1 } }, result: 'Eleven volumes, a bundle of dried notes. You read at night and recognise plants in the lane.' },
      { id: 'c', label: 'Watch from the back', hint: 'Keep your coin.', fx: {}, result: 'A bookseller from the capital buys most of it for less than your fortune.' },
    ],
  },
  {
    id: 'books_in_hand', title: 'The Book Room', art: 'book', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'education', chain: 'books', chainOnly: true, cause: 'prop:library', when: { prop: ['library'] },
    text: 'The shelves have outlasted their buyer. {name} knows where everything is, and neighbours have started to knock to ask.',
    options: [
      { id: 'a', label: 'Open it to the town on Saturdays', hint: 'A lasting mark; no income.', fx: { b: 1, flags: ['mark_school'], k: 1 }, result: 'Saturday readers fill the room. A shopkeeper’s son finds his trade in a ledger.', key: true },
      { id: 'b', label: 'Sell the best volumes', hint: 'Cash now, shelves bare.', fx: { lose: ['library'], m: 3 }, result: 'A dealer pays in gold for the best forty. The shelves look surprised.', key: true },
      { id: 'c', label: 'Read through the long winter', hint: 'Free. Knowledge for yourself.', fx: { k: 2 }, result: 'A winter by the stove with Doctor Aubrey’s opinions and your own.' },
    ],
  },

  // ===== chain: fire =====
  {
    id: 'chimney_warning', title: 'A Cracked Chimney', art: 'flame', phase: ['prime'], gens: [1, 2, 3], weight: 5, theme: 'home', chain: 'fire', when: { anyProp: ['cottage', 'inn', 'workshop'] },
    text: 'The mason says the flue is cracked from top to hearth. Winter will tell. The stove has never been so loud.',
    options: [
      { id: 'a', label: 'Rebuild it properly — 2 coin', hint: 'No fire risk.', fx: { m: -2, flags: ['chimney_sound'] }, result: 'A week of soot and a clean white flue. The chimney draws like a trumpet.' },
      { id: 'b', label: 'Patch it with clay — 1 coin', hint: 'Cheaper. A risk remains.', fx: { m: -1, flags: ['weak_chimney'], sched: [{ ev: 'night_fire', delay: 2 }] }, result: 'Clay and a prayer. The stove draws better than it did.', key: true },
      { id: 'c', label: 'Ignore it until spring', hint: 'Free. The risk is yours.', fx: { flags: ['weak_chimney'], sched: [{ ev: 'night_fire', delay: 2 }] }, result: 'You will see to it in spring. You mean it.', key: true },
    ],
  },
  {
    id: 'night_fire', title: 'Fire in the Night', art: 'flame', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 1, theme: 'home', chain: 'fire', chainOnly: true, cause: 'flag:weak_chimney',
    text: 'Smoke in the rafters, and the bells are ringing — for you. The flue you did not fix has done what flues do.',
    options: [
      { id: 'a', label: 'Fight it from the roof', hint: 'A risky save.', fx: { h: -1, m: -1 }, risk: { p: 0.6, fail: { h: -3, m: -3, b: -1 }, failResult: 'The beam goes before the buckets arrive. You come off the roof burned and bareheaded.', failHint: 'Lose 3 health and 3 coin.' }, result: 'Bucket by bucket and blanket by blanket, the roof holds. The flue is the only casualty.' },
      { id: 'b', label: 'Save the tools and papers; let the roof go', hint: 'Free, but the family watches the roof burn.', fx: { b: -1, flags: ['rebuilding'] }, result: 'You carry the ledgers and tools into the lane. The roof gives up an hour later, and the family stands in the street.' },
      { id: 'c', label: 'Call the street’s bucket line', hint: 'Needs strong neighbourly bonds.', req: { b: 5 }, fx: { b: 1, m: -1 }, result: 'Sixty people form a line from the canal. The fire is out before the cock crows.', key: true },
    ],
  },

  // ===== chain: the brewery journeyman =====
  {
    id: 'journeyman_leaves', title: 'The Journeyman Wants More', art: 'hammer', phase: ['prime', 'late'], gens: [1], weight: 1, theme: 'work', chain: 'brewery', chainOnly: true, cause: 'flag:hired_journeyman',
    text: 'Rook has learned your joints, your price lists and your customers’ names. He asks, politely, for a share of the work he has been doing.',
    options: [
      { id: 'a', label: 'Offer him a partnership', hint: 'Costs 1 coin. Loyalty, shared profit.', fx: { m: -1, b: 1, flags: ['partner_rook'], skill: { trade: 1 } }, result: 'Rook’s name goes up beside yours. He works like it is his own, because it is.', key: true },
      { id: 'b', label: 'Let him go and keep your secrets', hint: 'No cost now. A rival in the making.', fx: { flags: ['rook_rival'], sched: [{ ev: 'rival_undercuts', gen: 1, delay: 2 }] }, result: 'Rook leaves with a handshake. Half a year later you see a barrel with his mark.', key: true },
      { id: 'c', label: 'Tie him with a contract', hint: 'Keeps the work; sours the bench.', fx: { m: 1, b: -1 }, result: 'He signs. The bench is quieter, and the work is done without him looking up.' },
    ],
  },
  {
    id: 'rival_undercuts', title: 'Rook & Sons', art: 'hammer', phase: ['prime', 'late'], gens: [2, 3], weight: 1, theme: 'work', chain: 'brewery', chainOnly: true, cause: 'flag:rook_rival',
    text: 'The man your parent let go has a shop, three sons and a price list thinner than yours. The brewery’s buyer has noticed the difference.',
    options: [
      { id: 'a', label: 'Ride out the season', hint: 'Free. Customers drift away.', fx: { b: -1 }, result: 'Prices hold, orders thin. You lose a few regulars to the thinner list.' },
      { id: 'b', label: 'Specialise in fine work they cannot match', hint: 'Needs Craft.', req: { skill: { craft: 1 } }, fx: { m: 1, skill: { craft: 1 } }, result: 'A cask that sings when you tap it. The brewery pays for the sound.', key: true },
      { id: 'c', label: 'Buy the rival’s stall in the market', hint: 'Costs 5 coin. A new asset.', fx: { m: -5, gain: ['stall'] }, result: 'Rook sells you his stall with a long face and a short speech.' },
    ],
  },
]
