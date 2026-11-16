/**
 * Length guard for X posts — run with: npm run test:share
 */
import assert from 'node:assert/strict'
import { EVENT_DATES, UNIVERSITY } from './event'
import {
  buildLinkedInPost,
  buildXPost,
  REGISTER_URL,
  X_CHAR_LIMIT,
  xWeightedLength,
  type ShareFields,
} from './shareText'

const university = UNIVERSITY

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
  assert.ok(
    post.toLowerCase().includes('vibe builder'),
    `${label}: missing Vibe Builder identity`,
  )
  assert.ok(!/\bday\s*[123]\b/i.test(post), `${label}: must not mention Day 1/2/3`)
  console.log(`✓ ${label}: ${len}/${X_CHAR_LIMIT}`)
}

check({ name: '' }, 'empty')
check({ name: 'Hana Tadesse' }, 'typical')
check(
  {
    name: 'Someone With A Very Long Name That Goes On Forever Indeed',
  },
  'long-name',
)
check(
  {
    name: 'Nati',
    universityName: university,
    universityDates: EVENT_DATES,
  },
  'university-override',
)

const li = buildLinkedInPost({ name: 'Hana Tadesse' })
assert.ok(li.includes("I'm a Vibe Builder"))
assert.ok(li.includes('Vibe Builders Hackathon'))
assert.ok(li.includes(university))
assert.ok(li.includes(REGISTER_URL))
assert.ok(li.includes('@IDEEZA'))
assert.ok(li.includes('@Cheche Impact'))
assert.ok(li.includes('50,000 birr Prize'))
assert.ok(li.includes('linkedin.com/showcase/ideeza-ethiopia'))
assert.ok(!li.includes('CheChe'))
assert.ok(!/\bDay\s*[123]\b/.test(li))

const x = buildXPost({ name: 'Hana' })
assert.ok(x.includes('IDEEZA'))
assert.ok(x.includes('Cheche'))
assert.ok(x.includes('#VibeBuilders'))
assert.ok(!x.includes('@make_ideeza'))
assert.ok(!x.includes('CheChe'))

console.log('All share-text checks passed.')
