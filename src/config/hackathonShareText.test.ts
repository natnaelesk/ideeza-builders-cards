import {
  buildHackathonLinkedInPost,
  buildHackathonXPost,
  HACKATHON_SHARE_BASE,
} from './hackathonShareText'
import { xWeightedLength, X_CHAR_LIMIT } from './shareText'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const fields = {
  name: 'Hana Tadesse',
  project: 'SoilSense — moisture intel for small farms',
}

const li = buildHackathonLinkedInPost(fields)
assert(li.includes(HACKATHON_SHARE_BASE), 'LinkedIn includes base share text')
assert(li.includes('Hana Tadesse'), 'LinkedIn includes name')
assert(!/judge/i.test(li), 'LinkedIn must not mention judges')
assert(!/\b30%\b/.test(li), 'LinkedIn must not mention 30%')

const x = buildHackathonXPost(fields)
assert(xWeightedLength(x) <= X_CHAR_LIMIT, `X post over limit: ${xWeightedLength(x)}`)
assert(x.includes('Virtual Hackathon'), 'X mentions Virtual Hackathon')
assert(!/judge/i.test(x), 'X must not mention judges')

console.log('hackathonShareText.test.ts: ok')
