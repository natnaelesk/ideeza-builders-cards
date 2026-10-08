/**
 * Length guard for X posts — run with: npm run test:share
 */
import assert from 'node:assert/strict'
import {
  buildLinkedInPost,
  buildXPost,
  extractProject,
  formatIdeezaLinksBlock,
  X_CHAR_LIMIT,
  xWeightedLength,
  type ShareFields,
} from './shareText'

const roles = ['builder', 'mentor', 'judge'] as const

function check(fields: ShareFields, label: string) {
  const post = buildXPost(fields)
  const len = xWeightedLength(post)
  assert.ok(
    len <= X_CHAR_LIMIT,
    `${label}: X post is ${len} > ${X_CHAR_LIMIT}\n---\n${post}\n---`,
  )
  assert.ok(
    post.includes('ideeza.com/waitlist') || post.includes('https://'),
    `${label}: missing waitlist URL`,
  )
  console.log(`✓ ${label}: ${len}/${X_CHAR_LIMIT}`)
}

for (const role of roles) {
  check({ role, name: '', sub: '' }, `${role}/empty`)
}

check(
  {
    role: 'builder',
    name: 'Hana Tadesse',
    sub: 'SoilSense — moisture intel for small farms',
  },
  'builder/typical',
)

check(
  {
    role: 'builder',
    name: 'Someone With A Very Long Name Indeed',
    sub:
      'Supercalifragilisticexpialidocious Hardware Platform For Rural Farmers Across East Africa — one-line pitch that goes on forever',
  },
  'builder/long-project',
)

check(
  { role: 'mentor', name: 'Sara Bekele', sub: 'Hardware Lead, Acme Labs' },
  'mentor/typical',
)
check(
  { role: 'judge', name: 'Meron Alemu', sub: 'Partner, Addis Ventures' },
  'judge/typical',
)

assert.equal(extractProject('SoilSense — pitch'), 'SoilSense')
assert.equal(extractProject('SoilSense - pitch'), 'SoilSense')
assert.equal(extractProject(''), '')

const li = buildLinkedInPost({
  role: 'builder',
  name: 'Hana',
  sub: 'SoilSense — pitch',
})
assert.ok(li.includes("I'm pitching"))
assert.ok(li.includes('SoilSense'))
assert.ok(li.includes('linkedin.com/showcase/ideeza-ethiopia'))
assert.ok(li.includes('IDEEZA Ethiopia'))
assert.ok(li.includes('IDEEZA Global'))
assert.ok(li.includes('instagram.com/ideeza_ethiopia'))
assert.ok(li.includes('tiktok.com/@ideeza'))
assert.ok(li.includes('🌐 Website'))

const xPost = buildXPost({
  role: 'builder',
  name: 'Hana',
  sub: 'SoilSense — pitch',
})
assert.ok(!xPost.includes('IDEEZA Ethiopia'))
assert.ok(!xPost.includes('tiktok.com'))
assert.ok(xPost.includes('ideeza.com/waitlist'))

const links = formatIdeezaLinksBlock()
assert.ok(links.includes('IDEEZA Ethiopia'))
assert.ok(links.includes('IDEEZA Global'))
assert.ok(links.includes('t.me/make_ideeza'))

console.log('All share-text checks passed.')
