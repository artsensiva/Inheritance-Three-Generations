import type { AmbitionDef, ObligationDef, PropertyDef, StartDef } from '../engine/types'

export const TOWN = 'Harrowmere'

export const SKILLS: Record<string, { name: string; trade: string }> = {
  craft: { name: 'Craft', trade: 'craftsperson' },
  letters: { name: 'Letters', trade: 'clerk' },
  trade: { name: 'Trade', trade: 'trader' },
  husbandry: { name: 'Husbandry', trade: 'grower' },
  healing: { name: 'Healing', trade: 'healer' },
  civic: { name: 'Civic sense', trade: 'advocate' },
}

export const PROPS: Record<string, PropertyDef> = {
  workshop: { id: 'workshop', name: 'Cooperage workshop', desc: 'Tools, bench and a name on the door. Earns +1 coin per ledger (+1 more with Craft).', icon: 'hammer', yield: 1, bonusSkill: 'craft', value: 4 },
  stall: { id: 'stall', name: 'Market stall', desc: 'A covered stall on Canal Row. Earns +1 coin per ledger (+1 more with Trade).', icon: 'coin', yield: 1, bonusSkill: 'trade', value: 3 },
  plot: { id: 'plot', name: 'Farm plot', desc: 'Four acres by the north road. Earns +1 coin per ledger (+1 more with Husbandry).', icon: 'wheat', yield: 1, bonusSkill: 'husbandry', value: 4 },
  inn: { id: 'inn', name: 'The Gilded Hen (inn)', desc: 'A busy house with a leaking roof. Earns +2 coin per ledger. Counts as a home.', icon: 'house', yield: 2, value: 6 },
  cottage: { id: 'cottage', name: 'Cottage', desc: 'A roof of your own. Ends any rent. Earns nothing, but never asks for anything.', icon: 'house', yield: 0, value: 3 },
  library: { id: 'library', name: 'Book room', desc: 'A shelf-lined room. Earns nothing; children raised beside it start with more knowledge.', icon: 'book', yield: 0, value: 2 },
  barge: { id: 'barge', name: 'Canal barge', desc: 'A shared-use freight barge. Earns +1 coin per ledger (+1 more with Trade).', icon: 'boat', yield: 1, bonusSkill: 'trade', value: 4 },
}

/** Properties that count as a family home. */
export const HOMES = ['cottage', 'inn']

export const OBLS: Record<string, ObligationDef> = {
  guild_dues: { id: 'guild_dues', name: 'Guild dues', desc: 'The Coopers’ Guild takes 1 coin every ledger.', per: { m: -1 } },
  rent: { id: 'rent', name: 'Rent to the landlord', desc: 'Costs 1 coin every ledger. Ends if you own a cottage.', per: { m: -1 } },
  care_elder: { id: 'care_elder', name: 'Caring for an elder', desc: 'Costs 1 coin every ledger, and keeps the family close (+1 bonds).', per: { m: -1, b: 1 } },
  in_laws: { id: 'in_laws', name: 'Duties to in-laws', desc: 'Gifts and visits: 1 coin every ledger.', per: { m: -1 } },
  sibling_share: { id: 'sibling_share', name: 'Share owed to a sibling', desc: 'A promised payout: 1 coin every ledger until settled.', per: { m: -1 } },
  feud: { id: 'feud', name: 'A feud', desc: 'Bad blood wears the household down: −1 bonds every ledger.', per: { b: -1 } },
}

export const STARTS: Record<string, StartDef> = {
  cooperage: {
    id: 'cooperage', family: 'Marlow', title: 'The Marlow Cooperage',
    blurb: 'Barrels, a guild name and a bench worn smooth by two generations. Steady, but everyone expects you to stay.',
    difficultyNote: 'Steady start: a workshop and a skill, little spare coin.',
    money: 4, bonds: 6, debt: 0, props: ['workshop', 'cottage'], obl: ['guild_dues'], flags: ['guild_member'],
    health: 8, knowledge: 3, skills: { craft: 2, trade: 1 }, opener: 'cooper_open',
    firstNames: ['Anselm', 'Tamsin', 'Corwin', 'Edda', 'Joss', 'Linnet'],
  },
  tenant: {
    id: 'tenant', family: 'Tarn', title: 'The Tarn Tenancy',
    blurb: 'You farm another family’s land and pay for the privilege. Everyone at your table is close. Nothing under it is yours.',
    difficultyNote: 'Hard start: no property and rent due, but strong family bonds.',
    money: 3, bonds: 7, debt: 0, props: [], obl: ['rent'], flags: [],
    health: 8, knowledge: 2, skills: { husbandry: 2 }, opener: 'tenant_open',
    firstNames: ['Mirren', 'Odo', 'Wren', 'Bram', 'Maren', 'Tobin'],
  },
  inn: {
    id: 'inn', family: 'Fenwick', title: 'The Gilded Hen',
    blurb: 'A busy inn that your parents mortgaged to keep busy. Property rich, debt heavy, and everybody in town knows your name.',
    difficultyNote: 'Risky start: valuable inn, but a debt that grows if ignored.',
    money: 3, bonds: 5, debt: 4, props: ['inn'], obl: [], flags: [],
    health: 7, knowledge: 3, skills: { trade: 2 }, opener: 'inn_open',
    firstNames: ['Perrin', 'Isolde', 'Rafe', 'Sabine', 'Niall', 'Ottilie'],
  },
}

export const AMBITIONS: Record<string, AmbitionDef> = {
  roots: { id: 'roots', title: 'A Roof That Stays', tagline: 'Grow what the family holds — free of debt.', rule: 'At the end, the family owns one more property than it began with (at least 2) and carries no debt.' },
  open_book: { id: 'open_book', title: 'The Open Book', tagline: 'Let learning travel down the line.', rule: 'Two different generations each reach knowledge 6 or more.' },
  close_table: { id: 'close_table', title: 'A Full Table', tagline: 'Keep the family together.', rule: 'At the end, bonds are 7 or higher, no feud or estrangement stands, and debt is 2 or less.' },
  town_name: { id: 'town_name', title: 'A Name the Town Knows', tagline: 'Leave marks on Harrowmere.', rule: 'Contribute to the town in at least 4 lasting ways (town marks).' },
}

export const MARK_LABELS: Record<string, string> = {
  mark_levee: 'the Millrace levee',
  mark_school: 'the school bench',
  mark_well: 'the Cross Street well',
  mark_bridge: 'the footbridge',
  mark_lantern: 'the lantern night',
}

/** Flags shown to the player as standing consequences ("threads"). */
export const FLAG_DISPLAY: Record<string, string> = {
  loan_taken: 'A loan on the books',
  cellar_pledged: 'The cellar is pledged',
  sold_workshop: 'The workshop was sold',
  family_cough: 'The family cough',
  dry_house: 'A dry house',
  weak_chimney: 'A weak chimney',
  chimney_sound: 'A sound chimney',
  plot_buyer: 'Land bought on the north road',
  neighbor_friend: 'A friendly neighbour',
  tenant_union: 'The tenants’ letter',
  took_apprentice: 'An apprentice raised',
  hired_journeyman: 'Rook, the journeyman',
  partner_rook: 'Partner: Rook',
  rook_rival: 'A rival: Rook & Sons',
  alliance: 'Alliance with the Ashdowns',
  love_match: 'A love match',
  guild_member: 'Guild member',
  sibling_trust: 'Trusted by a sibling',
  estranged: 'Estranged from a sibling',
  city_post: 'A post in the capital',
  cousin_in_capital: 'A cousin in the capital',
  owes_veck: 'A season owed to Veck',
  owes_kin: 'Owes kin',
  shared_estate: 'Estate shared with siblings',
  scholar_path: 'Studied under Master Pell',
  partner_wick: 'Partner: Wick',
  won_boundary: 'Won the boundary case',
  good_pitch: 'Known on Canal Row',
  reworked: 'Reworked the family routine',
  loyal_customers: 'Loyal customers',
  guild_contract: 'A guild contract',
  child_schooled: 'A child at Master Pell’s school',
  blacklisted: 'Named a ringleader',
}
