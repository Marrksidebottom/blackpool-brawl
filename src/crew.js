// The World Heat crew. Tweak looks here so everyone is recognisable:
//   h / w      body height / width multipliers (1 = average)
//   hair       colour, hairStyle: short | spiky | quiff | curly | receding | buzz | bald | side
//   beard      null | 'stubble' | 'full' | 'goatee' (beardColour defaults to hair)
//   glasses    false | true
// A photo with the first name in its filename (repo root or public/faces/) automatically replaces the cartoon head.
export const CREW = [
  {
    id: 'jonathan', name: 'Jonathan', full: 'Jonathan Greenwood',
    shirt: '#2b6cff', trousers: '#23273a', skin: '#f2c79a',
    hair: '#4a2f1b', hairStyle: 'short', beard: null, glasses: false,
    h: 1.12, w: 0.95,
    move: { name: 'The Spreadsheet Slap', type: 'dash' },
    quips: ['Right lads, focus!', 'My round? Again?', 'Onwards!'],
  },
  {
    id: 'phil', name: 'Phil', full: 'Phil Clayton',
    shirt: '#e03131', trousers: '#2d2d2d', skin: '#eab88f',
    hair: '#8c8c8c', hairStyle: 'receding', beard: 'full', beardColour: '#9a9a9a', glasses: false,
    h: 1.0, w: 1.22,
    move: { name: "Phil's Full English", type: 'slam' },
    quips: ['Back in my day...', 'Mine is a pint!', 'Steady on!'],
  },
  {
    id: 'spencer', name: 'Spencer', full: 'Spencer Cheetham',
    shirt: '#2f9e44', trousers: '#1f3350', skin: '#f5cfa8',
    hair: '#e0b64a', hairStyle: 'spiky', beard: null, glasses: false,
    h: 1.05, w: 1.0,
    move: { name: 'The Cheeky Cheetham Spin', type: 'spin' },
    quips: ['Cheeky one?', 'Tower selfie!', 'Where is the chippy?'],
  },
  {
    id: 'jordan', name: 'Jordan', full: 'Jordan Irons',
    shirt: '#f76707', trousers: '#262626', skin: '#e8b48a',
    hair: '#1c1c1c', hairStyle: 'quiff', beard: 'stubble', glasses: false,
    h: 1.08, w: 0.9,
    move: { name: 'Pumping Irons', type: 'dash' },
    quips: ['Gym tomorrow. Maybe.', 'Easy!', 'Let us GO!'],
  },
  {
    id: 'aaron', name: 'Aaron', full: 'Aaron Clark',
    shirt: '#7048e8', trousers: '#2b2b3b', skin: '#e7b389',
    hair: '#2b1d14', hairStyle: 'buzz', beard: 'full', glasses: false,
    h: 0.96, w: 1.08,
    move: { name: 'The Clark Kent Kerfuffle', type: 'spin' },
    quips: ['Proper night this!', 'Anyone seen my phone?', 'Get in!'],
  },
  {
    id: 'marcus', name: 'Marcus', full: 'Marcus Hague',
    shirt: '#fcc419', trousers: '#3a2f25', skin: '#f0c095',
    hair: '#6b4423', hairStyle: 'curly', beard: null, glasses: true,
    h: 1.0, w: 1.1,
    move: { name: 'The Hague Convention', type: 'slam' },
    quips: ['That is a war crime!', 'Chips first, fight later', 'Order! Order!'],
  },
  {
    id: 'mark', name: 'Mark', full: 'Mark Sidebottom',
    shirt: '#15aabf', trousers: '#232a36', skin: '#f1c49c',
    hair: '#3b2a1e', hairStyle: 'side', beard: 'stubble', glasses: true,
    h: 1.03, w: 1.05,
    move: { name: 'The Sidebottom Shuffle', type: 'dash' },
    quips: ['I built this game, you know', 'Pints are on Jonathan!', 'Mint!'],
  },
];
