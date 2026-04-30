// ─── Word lists ──────────────────────────────────────────────────────────────

const RANDOM_QUANTITIES = [
  'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'twelve', 'fifteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty',
  'seventy', 'eighty', 'ninety',
  'one hundred', 'two hundred', 'five hundred', 'one thousand', 'ten thousand',
  'countless', 'infinite', 'several', 'dozens of', 'hundreds of',
  'thousands of', 'a few too many', 'not enough', 'way too many',
  'an alarming number of', 'a suspicious amount of', 'exactly thirteen',
  'almost forty', 'roughly a hundred', 'at least one',
  'a grand total of zero', 'more than expected',
]

// ─── Member-count-aware quantity mapping ─────────────────────────────────────

const COUNT_QUANTITIES: Record<number, string[]> = {
  1:  ['a lonely', 'a single', 'one solitary', 'the only'],
  2:  ['a couple of', 'a pair of', 'two', 'both'],
  3:  ['a trio of', 'a few', 'three', 'the three'],
  4:  ['four', 'a handful of', 'the four'],
  5:  ['five', 'a handful of', 'the five'],
  6:  ['six', 'half a dozen', 'the six'],
  7:  ['seven', 'a lucky seven', 'the seven'],
  8:  ['eight', 'roughly eight', 'the eight'],
  9:  ['nine', 'almost ten', 'the nine'],
  10: ['ten', 'exactly ten', 'a perfect ten'],
}

function getQuantityForCount(memberCount?: number): string {
  if (!memberCount || memberCount <= 0) return pick(RANDOM_QUANTITIES)
  if (memberCount <= 10 && COUNT_QUANTITIES[memberCount]) {
    return pick(COUNT_QUANTITIES[memberCount])
  }
  if (memberCount <= 15) return pick(['a dozen', 'twelve', 'fifteen', 'a baker\'s dozen'])
  if (memberCount <= 20) return pick(['twenty', 'nearly twenty', 'about fifteen', 'the whole crew'])
  return pick(RANDOM_QUANTITIES)
}

// ─── Type-specific adjective pools ───────────────────────────────────────────

const TYPE_ADJECTIVES: Record<string, string[]> = {
  game_night: [
    'legendary', 'cursed', 'haunted', 'ancient', 'enchanted', 'epic',
    'forbidden', 'mythical', 'glitched', 'corrupted', 'arcane',
    'overpowered', 'chaotic', 'notorious', 'spectral', 'doomed',
    'invincible', 'respawning', 'final', 'undefeated',
    'rage-quitting', 'sleep-deprived', 'well-rolled', 'badly-rolled',
    'betrayed', 'backstabbing', 'sandbagging', 'tilted',
    'strategically confused', 'secretly cheating', 'bluffing',
    'critically acclaimed', 'out of mana', 'save-scumming', 'grinding',
    'lore-obsessed', 'min-maxing', 'trolling', 'modded', 'speedrunning',
    'on a winning streak',
  ],
  hangout: [
    'cozy', 'sleepy', 'lazy', 'mellow', 'cheerful', 'delightful', 'warm',
    'content', 'jolly', 'breezy', 'easygoing', 'soft', 'pleasant',
    'unhurried', 'fuzzy', 'snug', 'drowsy', 'tranquil', 'gentle', 'golden',
    'well-fed', 'overstuffed', 'pleasantly bored', 'loosely scheduled',
    'unambitious', 'caffeinated', 'slightly chaotic', 'willfully idle',
    'comfortably numb', 'happily distracted', 'chronically late',
    'perpetually snacking', 'vaguely productive', 'softly luminous',
    'unexpectedly deep', 'gently feral', 'aggressively comfortable',
    'thoroughly unbothered', 'warmly dishevelled', 'contentedly lost',
  ],
  meetup: [
    'distinguished', 'peculiar', 'bewildered', 'anxious', 'smug', 'earnest',
    'opinionated', 'portly', 'suspicious', 'confused', 'well-meaning',
    'ambitious', 'punctual', 'caffeinated', 'determined', 'passionate',
    'diplomatic', 'verbose', 'resourceful', 'misguided',
    'over-prepared', 'under-prepared', 'confidently wrong', 'politely lost',
    'technically correct', 'enthusiastically off-topic', 'quietly judgmental',
    'loudly agreeable', 'visibly overwhelmed', 'conspicuously early',
    'chronically late', 'suspiciously well-dressed', 'borderline professional',
    'unexpectedly insightful', 'deeply caffeinated', 'mildly passive-aggressive',
    'surprisingly useful', 'aggressively networking', 'reluctantly collaborative',
    'painfully thorough', 'mysteriously absent',
  ],
  day_trip: [
    'wandering', 'curious', 'scenic', 'roaming', 'lost', 'adventurous',
    'winding', 'spontaneous', 'sunlit', 'detoured', 'ambling', 'meandering',
    'barefoot', 'windswept', 'unhurried', 'drifting', 'exploring',
    'rambling', 'trailblazing', 'wayward',
    'pleasantly confused', 'happily sidetracked', 'well-snacked',
    'accidentally scenic', 'unexpectedly far', 'blissfully off-route',
    'suspiciously tan', 'cheerfully unprepared', 'vaguely directional',
    'google-maps-defying', 'trail-blazing', 'hill-climbing',
    'mud-splattered', 'wildly optimistic', 'refreshingly lost',
    'scenic-route-taking', 'cloud-watching', 'uphill both ways',
    'suspiciously energetic', 'perfectly sunburned',
  ],
  road_trip: [
    'thundering', 'relentless', 'boundless', 'untamed', 'headlong',
    'restless', 'westbound', 'northbound', 'outbound', 'nomadic',
    'freewheeling', 'uncharted', 'breakneck', 'wide-open',
    'dust-covered', 'endless', 'turbocharged', 'oncoming',
    'fuel-scented', 'horizon-chasing',
    'bug-splattered', 'road-weary', 'snack-powered', 'playlist-driven',
    'slightly sunburned', 'chronically lost', 'exit-missing', 'toll-dodging',
    'fast-lane-merging', 'rest-stop-haunting', 'radio-arguing',
    'map-ignoring', 'detour-embracing', 'tank-on-empty', 'speed-limit-adjacent',
    'backseat-navigating', 'mile-counting', 'sign-reading', 'diner-finding',
    'gas-station-coffee-drinking', 'long-way-going',
  ],
  moto_trip: [
    'roaring', 'thunderous', 'wild', 'fierce', 'iron-clad', 'chrome-born',
    'wind-torn', 'leather-clad', 'revving', 'reckless', 'gravel-scarred',
    'fuel-drunk', 'full-throttle', 'leaning', 'howling', 'storm-chasing',
    'gritty', 'hard-riding', 'open-road', 'untethered',
    'bug-helmeted', 'torque-happy', 'curve-hungry', 'asphalt-kissing',
    'counter-steering', 'tank-slapping', 'clutch-riding', 'rev-matching',
    'lane-splitting', 'peg-scraping', 'visor-fogged', 'wind-deafened',
    'rain-soaked', 'sun-squinting', 'gravel-fearing', 'apex-finding',
    'headlight-chasing', 'engine-singing', 'gear-shifting', 'brake-trusting',
  ],
  vacation: [
    'luminous', 'golden', 'sun-soaked', 'drifting', 'blissful', 'languid',
    'unhurried', 'glittering', 'serene', 'tropical', 'hazy', 'azure',
    'radiant', 'shimmering', 'barefoot', 'cloudless', 'breezy',
    'lounging', 'carefree', 'warm',
    'deeply rested', 'suspiciously tan', 'thoroughly unbothered',
    'aggressively relaxed', 'phone-free', 'email-ignoring', 'out-of-office',
    'poolside', 'hammock-bound', 'sunset-watching', 'menu-studying',
    'horizon-gazing', 'salt-crusted', 'slowly melting', 'unapologetically idle',
    'thoroughly marinated', 'happily horizontal', 'serenely overfed',
    'perfectly aimless', 'beautifully unproductive', 'gloriously late',
  ],
}

// ─── Type-specific activity phrases ──────────────────────────────────────────

const TYPE_ACTIVITIES: Record<string, string[]> = {
  game_night: [
    'tossing dice', 'rolling badly', 'blaming the dice', 'ignoring the rules',
    'reading the manual', 'arguing about points', 'flipping the board',
    'taking forever on their turn', 'losing gracefully', 'refusing to lose',
    'making house rules', 'staring at their cards', 'questioning the odds',
    'shuffling suspiciously', 'declaring victory early', 'changing the rules mid-game',
    'forming alliances', 'betraying their allies', 'demanding a rematch',
    'explaining the rules incorrectly', 'drawing the worst card',
    'miscounting their score', 'running out of tokens', 'looking up edge cases',
    'quietly cheating', 'loudly not cheating', 'rolling all ones',
    'insisting they won', 'threatening to flip the table', 'opening a second snack bag',
  ],
  hangout: [
    'sitting around', 'doing nothing in particular', 'eating snacks',
    'losing track of time', 'talking about nothing', 'ordering more food',
    'forgetting why they came', 'staying too late', 'making plans they will cancel',
    'scrolling their phones together', 'watching whatever is on',
    'pretending to leave', 'laughing at nothing', 'debating where to go next',
    'falling asleep on the couch', 'rehashing old stories',
    'recommending things nobody asked for', 'collectively avoiding productivity',
    'deciding to just order pizza', 'starting a movie nobody finishes',
    'collectively forgetting the plan', 'talking until 2am',
    'making bold claims about the future', 'sharing bad opinions warmly',
    'doing a little bit of everything', 'not checking the time',
    'having one more', 'dramatically saying goodbye for an hour',
    'discovering a shared grievance', 'bonding over minor complaints',
  ],
  meetup: [
    'exchanging business cards', 'networking awkwardly', 'talking over each other',
    'bringing unsolicited opinions', 'arriving exactly on time', 'overexplaining things',
    'asking good questions', 'pretending to listen', 'taking notes nobody will read',
    'running slightly over time', 'disagreeing professionally', 'forming subcommittees',
    'workshopping the agenda', 'identifying action items', 'circling back on things',
    'taking this offline', 'leveraging synergies', 'aligning on priorities',
    'revisiting last month', 'suggesting a follow-up meeting',
    'questioning the scope', 'volunteering others for tasks',
    'hedging every statement', 'losing the thread entirely',
    'accidentally solving it', 'tabling important decisions',
    'misreading the room', 'bringing snacks to compensate',
    'producing a very long slide deck', 'achieving mild consensus',
  ],
  day_trip: [
    'getting slightly lost', 'stopping for snacks', 'taking photos of everything',
    'checking the map again', 'arguing about directions', 'finding a better route',
    'discovering something unexpected', 'eating at a random diner',
    'turning around twice', 'arriving later than planned', 'taking the scenic route',
    'spotting something weird', 'doubling back for a view', 'following a promising sign',
    'stepping in something unclear', 'running out of water', 'finding an unmarked trail',
    'reading every historical plaque', 'losing a shoe briefly',
    'collectively misreading the map', 'pretending the detour was planned',
    'finding the best local spot', 'eating something questionable',
    'discovering a shortcut that wasn\'t', 'making it work anyway',
    'covering more ground than expected', 'questioning the elevation',
    'absolutely nailing the parking', 'declaring it a success regardless',
    'vowing to come back better prepared',
  ],
  road_trip: [
    'burning rubber', 'missing exits', 'arguing about the playlist',
    'counting road signs', 'stopping at every gas station',
    'eating drive-thru in motion', 'singing the wrong lyrics',
    'switching drivers at 2am', 'following a detour', 'losing reception',
    'reading maps upside down', 'chasing the sunset', 'pulling over for no reason',
    'discovering a better playlist', 'running on fumes and optimism',
    'debating whether to stop', 'finally stopping',
    'passing the same landmark twice', 'listening to the same album three times',
    'inventing new road trip games', 'promising to never do this again',
    'planning the next one immediately', 'spotting something incredible',
    'narrowly avoiding a wrong turn', 'arriving at 3am somehow proud',
    'clocking serious miles', 'rationing the snacks', 'eating all the snacks',
    'watching the odometer', 'making surprisingly good time',
  ],
  moto_trip: [
    'hitting the open road', 'leaning into corners', 'eating bugs at speed',
    'revving at red lights', 'waving at other riders', 'stopping at overlooks',
    'outrunning the weather', 'finding the twisties', 'drowning out everything',
    'chasing the horizon', 'ignoring the speed limit', 'nursing sore knees',
    'topping up the tank', 'scraping pegs in corners', 'counter-steering through rain',
    'squinting into the sun', 'pulling over for the view',
    'overtaking everything legally', 'arriving wind-blasted and grinning',
    'refusing to check the weather', 'reading the road ahead', 'trusting the tyres',
    'pushing the pace', 'backing off and enjoying it', 'feeling every road imperfection',
    'nodding at other bikers', 'doing the ton on an empty road',
    'finding the perfect gear', 'getting properly lost on purpose',
    'rolling in with a story to tell',
  ],
  vacation: [
    'doing absolutely nothing', 'losing track of days', 'eating everything in sight',
    'ignoring emails', 'napping aggressively', 'forgetting what day it is',
    'browsing menus for an hour', 'staying in the pool', 'buying things nobody needs',
    'sleeping past noon', 'pretending to be a local', 'overpacking the itinerary',
    'lying horizontal for hours', 'losing a sandal to the sea',
    'spending too long at breakfast', 'discovering the best beach bar',
    'failing to leave on time', 'going back for seconds',
    'getting genuinely lost abroad', 'negotiating successfully',
    'ordering the same thing every day', 'watching the sun set twice',
    'accidentally walking everywhere', 'finding a hidden spot',
    'sending zero work emails', 'reading three pages of a book',
    'turning off notifications', 'returning more tired than before',
    'immediately planning the next one', 'declaring this the best trip ever',
  ],
}

const DEFAULT_ADJECTIVES = [
  'tiny', 'flat', 'round', 'enormous', 'massive', 'colossal', 'invisible',
  'rusty', 'soggy', 'spiky', 'glowing', 'haunted', 'forgotten',
  'magnificent', 'peculiar', 'unfortunate', 'bewildered', 'sleepy',
  'grumpy', 'chaotic', 'feral', 'luminous', 'ominous', 'distinguished',
  'smug', 'dramatic', 'melancholy', 'furious', 'serene',
]

const DEFAULT_ACTIVITIES = [
  'doing their best', 'figuring it out', 'showing up anyway',
  'making it work', 'trying something new', 'going with the flow',
  'winging it', 'holding it together', 'keeping the vibes up',
  'not reading the instructions',
]

const COLLECTIVES: Array<{ collective: string; animal: string }> = [
  { collective: 'murders',        animal: 'crows'        },
  { collective: 'clutters',       animal: 'bobcats'      },
  { collective: 'muddles',        animal: 'guinea pigs'  },
  { collective: 'parliaments',    animal: 'owls'         },
  { collective: 'conspiracies',   animal: 'lemurs'       },
  { collective: 'bloats',         animal: 'hippos'       },
  { collective: 'towers',         animal: 'giraffes'     },
  { collective: 'prickles',       animal: 'porcupines'   },
  { collective: 'crashes',        animal: 'rhinos'       },
  { collective: 'ambushes',       animal: 'tigers'       },
  { collective: 'coalitions',     animal: 'cheetahs'     },
  { collective: 'prides',         animal: 'lions'        },
  { collective: 'businesses',     animal: 'ferrets'      },
  { collective: 'flamboyances',   animal: 'flamingos'    },
  { collective: 'pandemoniums',   animal: 'parrots'      },
  { collective: 'shivers',        animal: 'sharks'       },
  { collective: 'romps',          animal: 'otters'       },
  { collective: 'unkindnesses',   animal: 'ravens'       },
  { collective: 'convocations',   animal: 'eagles'       },
  { collective: 'dazzles',        animal: 'zebras'       },
  { collective: 'embarrassments', animal: 'pandas'       },
  { collective: 'armies',         animal: 'frogs'        },
  { collective: 'wisdoms',        animal: 'wombats'      },
  { collective: 'gangs',          animal: 'elk'          },
  { collective: 'cauldrons',      animal: 'bats'         },
  { collective: 'exaltations',    animal: 'larks'        },
  { collective: 'nurseries',      animal: 'raccoons'     },
  { collective: 'gaggles',        animal: 'geese'        },
  { collective: 'packs',          animal: 'wolves'       },
  { collective: 'sleths',         animal: 'bears'        },
  { collective: 'troops',         animal: 'monkeys'      },
  { collective: 'kettle',         animal: 'hawks'        },
  { collective: 'destructions',   animal: 'cats'         },
  { collective: 'confusions',     animal: 'guinea fowl'  },
  { collective: 'plagues',        animal: 'locusts'      },
  { collective: 'swarms',         animal: 'bees'         },
  { collective: 'flocks',         animal: 'pigeons'      },
  { collective: 'herds',          animal: 'wildebeest'   },
  { collective: 'schools',        animal: 'piranhas'     },
  { collective: 'pods',           animal: 'dolphins'     },
  { collective: 'leaps',          animal: 'leopards'     },
  { collective: 'cackles',        animal: 'hyenas'       },
  { collective: 'shrewdnesses',   animal: 'apes'         },
  { collective: 'colonies',       animal: 'penguins'     },
  { collective: 'prickles',       animal: 'hedgehogs'    },
  { collective: 'bouquets',       animal: 'pheasants'    },
  { collective: 'mobs',           animal: 'kangaroos'    },
  { collective: 'towers',         animal: 'meerkats'     },
  { collective: 'rafts',          animal: 'otters'       },
  { collective: 'band',           animal: 'gorillas'     },
  { collective: 'blooms',         animal: 'jellyfish'    },
  { collective: 'army',           animal: 'caterpillars' },
  { collective: 'battery',        animal: 'barracudas'   },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function toTitleCase(s: string): string {
  const lower = ['of', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at']
  return s.replace(/\b\w+/g, (word, i) =>
    i === 0 || !lower.includes(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word
  )
}

// ─── Core generator ──────────────────────────────────────────────────────────

export interface GeneratedName {
  slug:    string
  display: string
}

export function generateName(): GeneratedName {
  const qty                    = pick(RANDOM_QUANTITIES)
  const adj                    = pick(DEFAULT_ADJECTIVES)
  const { collective, animal } = pick(COLLECTIVES)
  const raw                    = `${qty} ${adj} ${collective} of ${animal}`
  return { slug: slugify(raw), display: toTitleCase(raw) }
}

// ─── Context-aware variants ───────────────────────────────────────────────────

/** For group names — full collective noun format */
export function generateGroupName(): string {
  return generateName().display
}

/**
 * For event titles — quantity reflects group size, adjective and activity
 * phrase are themed to the event type.
 * Format: "[Count-Quantity] [Type-Adjective] [Collective] of [Animal] [Activity]"
 * Examples:
 *   3 members, game_night → "A Trio of Cursed Parliaments of Owls Tossing Dice"
 *   5 members, road_trip  → "Five Relentless Packs of Wolves Burning Rubber"
 *   1 member,  hangout    → "A Lonely Cozy Romp of Otters Sitting Around"
 */
export function generateEventTitle(eventType?: string, memberCount?: number): string {
  const qty                    = getQuantityForCount(memberCount)
  const adjPool                = eventType ? (TYPE_ADJECTIVES[eventType]  ?? DEFAULT_ADJECTIVES) : DEFAULT_ADJECTIVES
  const actPool                = eventType ? (TYPE_ACTIVITIES[eventType]  ?? DEFAULT_ACTIVITIES) : DEFAULT_ACTIVITIES
  const adj                    = pick(adjPool)
  const activity               = pick(actPool)
  const { collective, animal } = pick(COLLECTIVES)
  const raw                    = `${qty} ${adj} ${collective} of ${animal} ${activity}`
  return toTitleCase(raw)
}

/** For URL tokens — hyphenated slug */
export function generateInviteToken(): string {
  return generateName().slug
}
