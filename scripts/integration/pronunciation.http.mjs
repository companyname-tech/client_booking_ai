/**
 * Real integration test for the pronunciation-lexicon BE paths.
 *
 * Targets the leads_to_conversion backend directly (no mocks). Read-only by
 * default; the PUT round-trip checks run only when ALLOW_MUTATION=1.
 *
 * Env:
 *   API_BASE_URL  backend origin (default http://127.0.0.1:8870)
 *   API_TOKEN     Bearer token (JWT) — required, routes are auth-gated
 *   ALLOW_MUTATION=1  enables PUT round-trip checks (mutates then restores)
 *
 * Exit codes: 0 = all checks passed, 1 = a check failed,
 *             2 = REQUIRED PREREQUISITE NOT AVAILABLE (backend/auth missing).
 */
const BASE = process.env.API_BASE_URL ?? 'http://127.0.0.1:8870'
const TOKEN = process.env.API_TOKEN ?? ''
const ALLOW_MUTATION = process.env.ALLOW_MUTATION === '1'

const jsonHeaders = {
  'Content-Type': 'application/json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
}
const authOnlyHeaders = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}

let pass = 0
let fail = 0
const lines = []

function check(name, ok, detail) {
  if (ok) {
    pass += 1
    lines.push(`PASS  ${name}`)
  } else {
    fail += 1
    lines.push(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function prereqUnavailable(msg) {
  console.error(`REQUIRED PREREQUISITE NOT AVAILABLE: ${msg}`)
  process.exit(2)
}

/** Minimal valid 16-bit mono PCM WAV (silence) for the transcribe check. */
function makeSilenceWav(seconds) {
  const sampleRate = 16000
  const numSamples = Math.floor(seconds * sampleRate)
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  return buf
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: jsonHeaders })
  if (!res.ok) return { error: `${res.status} ${res.statusText}` }
  return { json: await res.json() }
}

async function main() {
  // ── Prereq: reachable + auth ────────────────────────────────────────────
  let res
  try {
    res = await fetch(`${BASE}/agent/config`, { headers: jsonHeaders })
  } catch (e) {
    prereqUnavailable(`backend unreachable at ${BASE}: ${e.message}`)
  }
  if (res.status === 401 || res.status === 403) {
    prereqUnavailable(
      `GET /agent/config returned ${res.status} — routes are auth-gated; set API_TOKEN (Bearer JWT)`,
    )
  }
  if (!res.ok) {
    prereqUnavailable(`GET /agent/config returned ${res.status} ${res.statusText}`)
  }

  // ── 1. GET /agent/config shape ──────────────────────────────────────────
  const cfg = await res.json()
  check(
    'GET /agent/config exposes pronunciation_lexicon (array of {word, pronounce_as, language})',
    Array.isArray(cfg.pronunciation_lexicon),
    `got ${JSON.stringify(cfg.pronunciation_lexicon)}`,
  )
  if (Array.isArray(cfg.pronunciation_lexicon)) {
    const bad = cfg.pronunciation_lexicon.find(
      (e) => typeof e.word !== 'string' || typeof e.pronounce_as !== 'string' || typeof e.language !== 'string',
    )
    check('every global entry has word/pronounce_as/language (string)', !bad, bad && JSON.stringify(bad))
  }

  // ── 2. GET /agents shape ────────────────────────────────────────────────
  const agentsRes = await getJson('/agents')
  if (agentsRes.error) {
    check('GET /agents returns 200', false, agentsRes.error)
  } else {
    const agents = agentsRes.json
    check('GET /agents returns an array', Array.isArray(agents))
    const first = Array.isArray(agents) ? agents[0] : undefined
    check(
      'agent element has agent_id + name + pronunciation_lexicon',
      first && typeof first.agent_id === 'string' && typeof first.name === 'string' && Array.isArray(first.pronunciation_lexicon),
      first && JSON.stringify(Object.keys(first)),
    )

    // ── 3. PUT /agents/{id} round-trip (mutation, opt-in) ─────────────────
    if (first && ALLOW_MUTATION) {
      const orig = first.pronunciation_lexicon ?? []
      const probe = [...orig, { word: '__itest_agent__', pronounce_as: 'eye-test-agent', language: 'en' }]
      try {
        const put = await fetch(`${BASE}/agents/${first.agent_id}`, {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({ pronunciation_lexicon: probe }),
        })
        check('PUT /agents/{id} accepts pronunciation_lexicon', put.ok, `${put.status} ${put.statusText}`)
        const re = await getJson(`/agents/${first.agent_id}`)
        const found = !re.error && (re.json.pronunciation_lexicon ?? []).some((e) => e.word === '__itest_agent__')
        check('PUT /agents/{id} persisted (round-trip)', Boolean(found))
      } finally {
        await fetch(`${BASE}/agents/${first.agent_id}`, {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({ pronunciation_lexicon: orig }),
        })
      }
    }
  }

  // ── 4. PUT /agent/config round-trip (mutation, opt-in) ──────────────────
  if (ALLOW_MUTATION) {
    const orig = cfg.pronunciation_lexicon ?? []
    const probe = [...orig, { word: '__itest__', pronounce_as: 'eye-test', language: 'en' }]
    try {
      const put = await fetch(`${BASE}/agent/config`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ pronunciation_lexicon: probe }),
      })
      check('PUT /agent/config accepts pronunciation_lexicon', put.ok, `${put.status} ${put.statusText}`)
      const re = await getJson('/agent/config')
      const found = !re.error && (re.json.pronunciation_lexicon ?? []).some((e) => e.word === '__itest__')
      check('PUT /agent/config persisted (round-trip)', Boolean(found))
    } finally {
      await fetch(`${BASE}/agent/config`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ pronunciation_lexicon: orig }),
      })
    }
  }

  // ── 5. POST /agent/pronunciation/transcribe (multipart, read-only) ──────
  const form = new FormData()
  form.append('file', new Blob([makeSilenceWav(1)], { type: 'audio/wav' }), 'itest.wav')
  form.append('language', 'en')
  try {
    const tRes = await fetch(`${BASE}/agent/pronunciation/transcribe`, {
      method: 'POST',
      headers: authOnlyHeaders,
      body: form,
    })
    if (!tRes.ok) {
      const body = await tRes.text().catch(() => '')
      check(
        'POST /agent/pronunciation/transcribe returns 200 {pronounce_as, language}',
        false,
        `${tRes.status} ${body.slice(0, 160)}`,
      )
    } else {
      const reply = await tRes.json()
      check('transcribe reply has pronounce_as (string)', typeof reply.pronounce_as === 'string')
      check('transcribe reply has language (string)', typeof reply.language === 'string')
    }
  } catch (e) {
    check('POST /agent/pronunciation/transcribe', false, e.message)
  }

  // ── Report ───────────────────────────────────────────────────────────────
  console.log(`target: ${BASE}`)
  console.log(`mutation: ${ALLOW_MUTATION ? 'on' : 'off (set ALLOW_MUTATION=1 for PUT round-trips)'}`)
  console.log(lines.join('\n'))
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

main()
