/**
 * Length guard for X posts — run with: npm run test:share
 */
import assert from 'node:assert/strict'
import { DAY_ORDER, cardLayout } from './cardLayout'
import {
  buildLinkedInPost,
  buildXPost,
  REGISTER_URL,
  X_CHAR_LIMIT,
  xWeightedLength,
  type ShareFields,
} from './shareText'

const university = cardLayout.university.name

function check(fields: ShareFields, label: string) {
  const post = buildXPost(fields)
  const len = xWeightedLength(post)
  assert.ok(
    len <= X_CHAR_LIMIT,
    `${label}: X post is ${len} > ${X_CHAR_LIMIT}\n---\n${post}\n---`,
  )
  assert.ok(
    post.includes('luma.com/lj4evitk') || post.includes(REGISTER_URL),
    `${label}: missing registration URL`,
  )
  assert.ok(
    post.toLowerCase().includes('wolkite'),
    `${label}: missing Wolkite University`,
  )
  console.log(`✓ ${label}: ${len}/${X_CHAR_LIMIT}`)
}

for (const day of DAY_ORDER) {
  check({ day, name: '', project: '', pitch: '' }, `${day}/empty`)
}

check(
  {
    day: 'day1',
    name: 'Hana Tadesse',
    project: '',
    pitch: '',
  },
  'day1/typical',
)

check(
  {
    day: 'day2',
    name: 'Abel Mekonnen',
    project: 'SoilSense',
    pitch: 'moisture intel for small farms',
  },
  'day2/typical',
)

check(
  {
    day: 'day3',
    name: 'Meron Alemu',
    project: 'SafeRoute',
    pitch: 'campus safety alerts for women',
  },
  'day3/typical',
)

check(
  {
    day: 'day2',
    name: 'Someone With A Very Long Name Indeed',
    project:
      'Supercalifragilisticexpialidocious Hardware Platform For Rural Farmers Across East Africa',
    pitch: 'one-line pitch that goes on forever and ever',
  },
  'day2/long-project',
)

check(
  {
    day: 'day3',
    name: 'Long Name',
    project:
      'Another Extremely Long Project Name That Should Still Fit Under The Limit',
    pitch: 'pitch',
  },
  'day3/long-project',
)

// Explicit university override still under 280
check(
  {
    day: 'day1',
    name: 'Nati',
    project: '',
    pitch: '',
    universityName: university,
    universityDates: cardLayout.university.dates,
  },
  'day1/university-override',
)

const li1 = buildLinkedInPost({
  day: 'day1',
  name: 'Hana',
  project: '',
  pitch: '',
})
assert.ok(li1.includes('Vibe Builders Workshop'))
assert.ok(li1.includes(university))
assert.ok(li1.includes(REGISTER_URL))
assert.ok(li1.includes('@IDEEZA'))
assert.ok(li1.includes('@Cheche Impact'))
assert.ok(li1.includes('linkedin.com/showcase/ideeza-ethiopia'))

const li2 = buildLinkedInPost({
  day: 'day2',
  name: 'Abel',
  project: 'SoilSense',
  pitch: 'moisture intel',
})
assert.ok(li2.includes('SoilSense'))
assert.ok(li2.includes('Vibe Inventing Hackathon'))

const li3 = buildLinkedInPost({
  day: 'day3',
  name: 'Meron',
  project: 'SafeRoute',
  pitch: 'campus safety',
})
assert.ok(li3.includes('Code H.E.R Future Hackathon'))
assert.ok(li3.includes('Cheche Technologies'))
assert.ok(li3.includes('I built'))
assert.ok(!li3.includes('CheChe'))

const x3 = buildXPost({
  day: 'day3',
  name: 'Meron',
  project: 'SafeRoute',
  pitch: '',
})
assert.ok(x3.includes('IDEEZA'))
assert.ok(x3.includes('Cheche'))
assert.ok(x3.includes('#VibeBuilders'))
assert.ok(!x3.includes('@make_ideeza'))

console.log('All share-text checks passed.')
