import type { EventDef } from '../engine/types'

/** Standalone events and town marks. */
export const EVENTS_C: EventDef[] = [
  {
    id: 'schoolmaster', title: 'The Night Class', art: 'book', phase: ['prime'], gens: [1, 2, 3], weight: 6, theme: 'education', chain: 'learning',
    text: 'Master Pell opens his study room after dark to anyone who can pay in coin or in candle ends. A clerk’s hand and a merchant’s head are both on offer.',
    options: [
      { id: 'a', label: 'Study properly — 3 coin', hint: 'Real learning; costs a season’s coin.', fx: { m: -3, k: 2, skill: { letters: 1 }, flags: ['scholar_path'] }, result: 'Pell’s long evenings reorder how you think about numbers, contracts and sentences.', key: true },
      { id: 'b', label: 'Study when you can spare the candles', hint: 'Slow; costs some sleep.', fx: { k: 1, h: -1 }, result: 'Two nights a week, a candle stub, a borrowed slate. It is slower than hoped.' },
      { id: 'c', label: 'Skip it; the day was long', hint: 'Keep what you earned.', fx: { m: 1 }, result: 'You earn a coin on the way home and do not think again about Pell’s lamp.' },
    ],
  },
  {
    id: 'harvest_glut', title: 'A Glut at the Market', art: 'wheat', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 5, theme: 'market',
    text: 'Barges of grain mean cheap bread for a week, and sellers weep. A careful buyer could store the surplus and sell in winter — if winter is cold.',
    options: [
      { id: 'a', label: 'Buy cheap, store and sell in winter', hint: 'Risky. Costs 2 coin up front.', req: { m: 2 }, risk: { p: 0.65, fail: { m: -2, b: -1 }, failResult: 'A mild winter. The grain sits, the rats feast, the money is gone.', failHint: 'Lose 2 coin.' }, fx: { m: 2, skill: { trade: 1 } }, result: 'A hard January empties every other barn. Your stored grain fetches a handsome price.' },
      { id: 'b', label: 'Sell your own at a small profit and buy bread', hint: 'Safe, small.', fx: { m: 1 }, result: 'Bread is cheap and the table is full. Nobody gets rich.' },
      { id: 'c', label: 'Feast the street', hint: 'A fine week; a thin purse.', fx: { b: 2, h: 1 }, result: 'Long tables on Canal Row. You eat better than you have in a year.' },
    ],
  },
  {
    id: 'tax_assessor', title: 'The Assessor’s Pen', art: 'scroll', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 5, theme: 'money',
    text: 'The town assessor has come around with a new schedule and an old suspicion. He counts the rooms, the tools and the faces at the table.',
    options: [
      { id: 'a', label: 'Pay the assessed sum', hint: 'Costs 2 coin. No trouble.', fx: { m: -2 }, result: 'He writes a receipt in a neat hand and tips his hat.' },
      { id: 'b', label: 'Contest it with documents', hint: 'Needs a clear head.', req: { k: 4 }, fx: { skill: { civic: 1 }, k: 1 }, result: 'You quote the schedule back at him. He recalculates, and the sum falls away.', key: true },
      { id: 'c', label: 'Hide a little and hope', hint: 'Free if it works.', risk: { p: 0.6, fail: { m: -3, b: -1 }, failResult: 'He finds the loft room. The fine is three times the tax.', failHint: 'Lose 3 coin, bonds fall.' }, fx: { m: 1 }, result: 'The assessor misses the loft. The tax is lighter than it has any right to be.' },
    ],
  },
  {
    id: 'canal_opening', title: 'The Canal Opens to the East', art: 'boat', phase: ['prime'], gens: [1, 2], weight: 5, theme: 'market', when: { noProp: ['barge'] },
    text: 'New barges, new customers, new competitors. A shipping partnership is selling shares in a shared barge.',
    options: [
      { id: 'a', label: 'Buy a share in a barge — 4 coin', hint: 'A new asset that pays each ledger.', fx: { m: -4, gain: ['barge'] }, result: 'Your name goes on the hull. The barge earns, and the eastern trade begins.', key: true },
      { id: 'b', label: 'Sell to the new customers from what you have', hint: 'A quick gain.', fx: { m: 2 }, result: 'The easterners pay in unfamiliar coins at the old prices.' },
      { id: 'c', label: 'Stay with local trade', hint: 'Safe, slow.', fx: { b: 1 }, result: 'The eastern barges are loud. The home customers stay, and are warmer.' },
    ],
  },
  {
    id: 'barge_trade', title: 'Cargo Dispute', art: 'boat', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 6, theme: 'market', when: { prop: ['barge'] },
    text: 'A coastal buyer offers a premium for a full load of local goods — if the barge can be there before the tide turns.',
    options: [
      { id: 'a', label: 'Rush it to the coast', hint: 'Risky, high reward.', risk: { p: 0.6, fail: { m: -3, h: -1 }, failResult: 'The tide turns early. The cargo is spoiled and the bargee blames you.', failHint: 'Lose 3 coin, 1 health.' }, fx: { m: 3, skill: { trade: 1 } }, result: 'The barge reaches the coast on the last slack water. The buyer pays in gold.', key: true },
      { id: 'b', label: 'Run local freight as usual', hint: 'Safe income.', fx: { m: 1 }, result: 'Nobody talks about it. The ledger is a little heavier.' },
      { id: 'c', label: 'Lend the barge to neighbours for the flood season', hint: 'Bonds over coin.', fx: { b: 2 }, result: 'The barge ferries a dozen households. The street does not forget.' },
    ],
  },
  {
    id: 'stranger_offer', title: 'A Stranger With a Sealed Box', art: 'key', phase: ['prime'], gens: [1, 2, 3], weight: 4, theme: 'people',
    text: 'A man in a fine coat sells a sealed box “worth ten”, for four. He smiles too long and asks you not to open it until he is gone.',
    options: [
      { id: 'a', label: 'Buy it', hint: 'A gamble. Costs 3 coin.', req: { m: 3 }, risk: { p: 0.4, fail: { m: -3 }, failResult: 'The box holds lead weights and a printed apology.', failHint: 'Lose 3 coin.' }, fx: { m: 3 }, result: 'The box holds a surveyor’s instruments worth far more than you paid.' },
      { id: 'b', label: 'Ask the constable to open it first', hint: 'Slow; a lesson in law.', fx: { skill: { civic: 1 } }, result: 'The man evaporates. The constable explains how it works, and why it works.' },
      { id: 'c', label: 'Refuse politely', hint: 'Keep your coin.', fx: {}, result: 'He is gone by the next street. His lack of surprise is memorable.' },
    ],
  },
  {
    id: 'bad_winter', title: 'The Long Frost', art: 'flame', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 5, theme: 'health',
    text: 'The canal ice thickens, coal prices climb and the neighbours’ chimneys go cold one by one.',
    options: [
      { id: 'a', label: 'Buy coal for the whole street — 3 coin', hint: 'A lasting kindness.', fx: { m: -3, b: 2 }, result: 'Eleven houses warm on your coin. The street adds your name to its Christmas prayers.', key: true },
      { id: 'b', label: 'Keep the family warm and the door shut', hint: 'Costs 1 coin. Sensible.', fx: { m: -1 }, result: 'You burn what you must. The children are warm; the street is not.' },
      { id: 'c', label: 'Burn the furniture and endure', hint: 'Free. The children suffer for it.', fx: { b: -1, flags: ['child_hardship'] }, result: 'The table burns by January. The children sleep in coats.' },
    ],
  },
  {
    id: 'wedding_feast', title: 'A Wedding in the Family', art: 'heart', phase: ['late'], gens: [1, 2, 3], weight: 4, theme: 'family',
    text: 'A cousin is marrying. The family expects a feast; the purse expects restraint.',
    options: [
      { id: 'a', label: 'Host a grand feast — 3 coin', hint: 'A day to remember.', fx: { m: -3, b: 2 }, result: 'Three hundred guests, four kinds of pie. The family’s name is warm on every tongue.' },
      { id: 'b', label: 'A modest supper — 1 coin', hint: 'Warm enough.', fx: { m: -1, b: 1 }, result: 'Long tables, simple food, a lot of laughter.' },
      { id: 'c', label: 'Send a gift only', hint: 'Free. Noted.', fx: { b: -1 }, result: 'A gift arrives on the wedding morning, not a guest with it. The couple writes a kind note.' },
    ],
  },
  {
    id: 'elder_winter', title: 'An Elder’s Last Winter', art: 'candle', phase: ['late'], gens: [1, 2], weight: 5, theme: 'family', when: { noObl: ['care_elder'] },
    text: 'Grandmother Edda cannot manage the stairs any more. The house has opinions about who ought to care for her.',
    options: [
      { id: 'a', label: 'Take her in and care for her', hint: 'A standing duty; a closer family.', fx: { obl: ['care_elder'], b: 2 }, result: 'Her bed goes in the kitchen. She tells the same four stories and the children learn all four.', key: true },
      { id: 'b', label: 'Pay for a place at the almshouse — 2 coin', hint: 'Clean, kind, distant.', fx: { m: -2 }, result: 'The almshouse is clean and the gardener is good. She forgives you and tells everyone.' },
      { id: 'c', label: 'Visit on Sundays', hint: 'Free. Not enough.', fx: { b: -1, h: 0 }, result: 'Weeks pass between visits. She never complains, which is worse.' },
    ],
  },
  {
    id: 'fair_day', title: 'Fair Day on Canal Row', art: 'coin', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 5, theme: 'market',
    text: 'The autumn fair fills Canal Row from the lock to the bridge. Sellers shout; buyers pretend not to hear.',
    options: [
      { id: 'a', label: 'Rent a good pitch — 2 coin', hint: 'Cost now; a name in the market.', fx: { m: -2, skill: { trade: 1 }, flags: ['good_pitch'] }, result: 'You sell out by noon. Everyone on the row learns your face.' },
      { id: 'b', label: 'Sell from a barrow', hint: 'Small, free.', fx: { m: 1 }, result: 'A barrow, a bundle, a few honest coins.' },
      { id: 'c', label: 'Spend the day with the children', hint: 'Free. Warm.', fx: { b: 1 }, result: 'Gingerbread, a ribbon, a short ride on the ferry. They remember it for decades.' },
    ],
  },
  {
    id: 'well_funding', title: 'A Well on Cross Street', art: 'water', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 4, theme: 'town', chain: 'marks', when: { no: ['mark_well'] },
    text: 'The water from the canal has a taste and a reputation. The reeve wants a proper well on Cross Street, if the street can pay for it.',
    options: [
      { id: 'a', label: 'Fund the well — 3 coin', hint: 'A lasting mark on the town.', fx: { m: -3, b: 1, flags: ['mark_well'] }, result: 'Stone, rope and a bucket that does not leak. The street’s children are healthier by spring.', key: true },
      { id: 'b', label: 'Haul stone with your cart for a week', hint: 'Costs health; the mark is the same.', fx: { h: -1, flags: ['mark_well'] }, result: 'A week of hauling. Your name goes on the stone beside the paid ones.' },
      { id: 'c', label: 'Leave it to the guild', hint: 'Free.', fx: {}, result: 'The guild does nothing for a decade.' },
    ],
  },
  {
    id: 'footbridge', title: 'The Footbridge at the Lock', art: 'boat', phase: ['prime', 'late'], gens: [2, 3], weight: 4, theme: 'town', chain: 'marks', when: { no: ['mark_bridge'] },
    text: 'The ferry fare has doubled again. The lock-keeper says a footbridge would cost less than a year of fares.',
    options: [
      { id: 'a', label: 'Pay for the planks — 2 coin', hint: 'A lasting mark on the town.', fx: { m: -2, flags: ['mark_bridge'], b: 1 }, result: 'The bridge opens on a Sunday. The ferryman retires to his garden.', key: true },
      { id: 'b', label: 'Build it yourself', hint: 'Needs Craft. Costs health.', req: { skill: { craft: 1 } }, fx: { h: -1, skill: { craft: 1 }, flags: ['mark_bridge'] }, result: 'Eight planks, forty nails and a very good sleep. The bridge is stubborn and straight.' },
      { id: 'c', label: 'Pay the ferry', hint: 'Free in effort.', fx: { b: 0, m: 0 }, result: 'You keep paying the ferry. It still floats.' },
    ],
  },
  {
    id: 'lantern_night', title: 'Lantern Night', art: 'candle', phase: ['late'], gens: [1, 2, 3], weight: 4, theme: 'town', chain: 'marks', when: { no: ['mark_lantern'] },
    text: 'Harrowmere lights paper lanterns for the dead on the canal each autumn. This year the reeve wants a house on the row to host the first lighting.',
    options: [
      { id: 'a', label: 'Host the lanterns at your house — 1 coin', hint: 'A lasting mark on the town.', fx: { m: -1, b: 1, flags: ['mark_lantern'] }, result: 'Two hundred lanterns on the black water. Your house is on the reeve’s list for every year after.', key: true },
      { id: 'b', label: 'Light one for your own, and go home', hint: 'Free. Quiet.', fx: { b: 1 }, result: 'One lantern, one name, a long walk home.' },
      { id: 'c', label: 'Sell lamp oil to the crowd', hint: 'Small income.', fx: { m: 2 }, result: 'The oil is gone by dusk. The crowd is kind about the price.' },
    ],
  },
  {
    id: 'school_bench', title: 'A Bench for the Town School', art: 'book', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 4, theme: 'town', chain: 'marks', when: { no: ['mark_school'] },
    text: 'Master Pell needs a longer bench and a shelf of reading books before the autumn term. The town’s children have outgrown the room.',
    options: [
      { id: 'a', label: 'Donate bench and books — 2 coin', hint: 'A lasting mark on the town.', fx: { m: -2, k: 1, flags: ['mark_school'] }, result: 'Eleven more children fit on the bench. One carves your family name under it.', key: true },
      { id: 'b', label: 'Teach a Saturday class', hint: 'Needs book learning.', req: { k: 4 }, fx: { b: 1, skill: { civic: 1 }, flags: ['mark_school'] }, result: 'Saturday mornings in Pell’s room. You teach arithmetic and learn patience.' },
      { id: 'c', label: 'Wish Pell well', hint: 'Free.', fx: {}, result: 'The new term is crowded and noisy.' },
    ],
  },
  {
    id: 'travelling_healer', title: 'The Travelling Healer', art: 'water', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 4, theme: 'health',
    text: 'A woman with a mule full of jars sets up beside the well. Her remedies smell like a hedge, and half the street has already queued.',
    options: [
      { id: 'a', label: 'Buy her remedies — 2 coin', hint: 'Healthier body, lighter purse.', fx: { m: -2, h: 1 }, result: 'Salve, tea and an instruction to sleep. You do, and wake better.' },
      { id: 'b', label: 'Spend a week learning her methods — 1 coin', hint: 'A lasting skill.', fx: { m: -1, skill: { healing: 1 }, k: 1 }, result: 'Roots, leaves and the names they answer to. She sells you a book of her own notes.' },
      { id: 'c', label: 'Invite her to share the street’s hearth', hint: 'Free. Bonds over medicine.', fx: { b: 1 }, result: 'She tells the children stories and keeps the neighbours well.' },
    ],
  },
  {
    id: 'veck_restructures', title: 'Veck Offers Terms', art: 'coin', phase: ['prime'], gens: [1, 2, 3], weight: 6, theme: 'money', chain: 'loan', when: { debt: 2 },
    text: 'Mr Veck’s manner has softened — never a good sign. He has a proposal to tidy what you owe, and he would like an answer before the ink dries.',
    options: [
      { id: 'a', label: 'Pay a lump sum — 3 coin', hint: 'Cuts the debt by 3.', fx: { m: -3, debt: -3 }, result: 'Veck crosses out a long line and looks mildly disappointed.', key: true },
      { id: 'b', label: 'Work part of it off in his warehouse', hint: 'Cuts the debt by 2; costs health.', fx: { h: -1, debt: -2, skill: { trade: 1 } }, result: 'Weeks of crates and counting. You learn how Veck keeps his books.' },
      { id: 'c', label: 'Decline his terms', hint: 'Free. The interest keeps running.', fx: {}, result: 'He smiles, closes the ledger, and says he will be in touch.' },
    ],
  },
  {
    id: 'plague_rumor', title: 'Fever in the Low Streets', art: 'candle', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 4, theme: 'health',
    text: 'A fever is moving through the low streets. The physician’s door is chalked and the church bell has not stopped.',
    options: [
      { id: 'a', label: 'Nurse the sick neighbours', hint: 'Risky. The street will not forget.', risk: { p: 0.75, fail: { h: -4, b: 1 }, failResult: 'You catch the fever. The street nurses you in turn.', failHint: 'Lose 4 health. Bonds rise.' }, fx: { b: 2, skill: { healing: 1 } }, result: 'Four weeks of broth and clean cloths. Three neighbours live who might not have.', key: true },
      { id: 'b', label: 'Bar the door and wait', hint: 'Free. The street notices.', fx: { b: -1 }, result: 'Your family stays well. The street keeps count of who opened their door.' },
      { id: 'c', label: 'Send the children to a cousin in the hills — 1 coin', hint: 'Safe; a month apart.', fx: { m: -1, b: 0 }, result: 'A month of quiet, a month of letters. The children come back brown and bossy.' },
    ],
  },
  {
    id: 'inn_busy_season', title: 'The Fair-Night Crowd', art: 'house', phase: ['prime'], gens: [1, 2, 3], weight: 7, theme: 'work', when: { prop: ['inn'] },
    text: 'Fair night, and every bed in Harrowmere is booked. The Gilded Hen has never been this loud, and the cellar has never been this empty.',
    options: [
      { id: 'a', label: 'Hire extra hands and stay open all night', hint: 'Big takings; hard on you.', req: { h: 2 }, fx: { m: 3, h: -1 }, result: 'Four hundred pints and a quarrel resolved with a bucket. The till is heavy at dawn.', key: true },
      { id: 'b', label: 'Close early and balance the books', hint: 'A little off the debt.', fx: { m: 1, debt: -1 }, result: 'You count the takings twice, pay the interest early and sleep soundly.' },
      { id: 'c', label: 'Host a supper for the whole street', hint: 'Free. Goodwill pays later.', fx: { b: 1 }, result: 'You feed fifty from one pot. The inn is the neighbourhood’s kitchen that night.' },
    ],
  },
  {
    id: 'travelling_lecturer', title: 'A Lecturer From the Capital', art: 'book', phase: ['prime', 'late'], gens: [1, 2, 3], weight: 5, theme: 'education',
    text: 'A man with a trunk of diagrams lectures on “the new arithmetic” at the Guild Hall for a coin a head. Half the room is asleep by the second hour.',
    options: [
      { id: 'a', label: 'Attend every evening — 2 coin', hint: 'Real learning, real cost.', fx: { m: -2, k: 2, skill: { letters: 1 } }, result: 'Nine evenings of chalk dust. You leave with a method and an opinion.', key: true },
      { id: 'b', label: 'Send a child to take notes', hint: 'Free. Slower, but shared.', fx: { k: 1, b: 1 }, result: 'The child copies a page a night. The family reads them aloud at supper.' },
      { id: 'c', label: 'Skip it and work the evenings', hint: 'A little extra coin.', fx: { m: 1 }, result: 'You pick up evening work at the lamp-trimmer’s. The lecture fills a hall, and a few coins fill your pocket.' },
    ],
  },
  {
    id: 'quiet_year', title: 'A Quiet Season', art: 'house', phase: ['youth', 'prime', 'late'], gens: [1, 2, 3], weight: 0.2, theme: 'rest', repeatable: true,
    text: 'Nothing demands an answer. The year turns, and the household finds out what it does when nothing is happening.',
    options: [
      { id: 'a', label: 'Mend, save and rest', hint: 'Small, steady.', fx: { m: 1 }, result: 'A season of small repairs. The ledger is slightly better for it.' },
      { id: 'b', label: 'Spend the time with family', hint: 'Warmer house.', fx: { b: 1 }, result: 'Long evenings and no urgency. The house forgets how quiet can be.' },
      { id: 'c', label: 'Study by the stove', hint: 'Slow, cheap learning.', fx: { k: 1 }, result: 'A borrowed book and a long winter. You finish the book, and the winter.' },
    ],
  },
]
