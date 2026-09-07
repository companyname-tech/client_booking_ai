// Runtime verification of the M-0024 double-read fix.
// A WHATWG Response with a NON-JSON body (e.g. a reverse-proxy HTML/empty
// error page) reproduces the reported crash under the OLD error handling:
//   try { payload = await res.json() } catch { payload = await res.text() }
// res.json() consumes the stream even when it fails to parse, so the catch's
// res.text() throws "Failed to execute 'text' on 'Response': body stream
// already read" — masking the real API error.
// The NEW handling reads text ONCE and parses — no crash.

async function oldErrorPath(res) {
  let payload
  try {
    payload = await res.json()
  } catch {
    payload = await res.text()
  }
  return payload
}

async function newErrorPath(res) {
  let payload
  const raw = await res.text()
  try {
    payload = raw ? JSON.parse(raw) : ''
  } catch {
    payload = raw
  }
  return payload
}

async function main() {
  // Real-world case: 502 proxy error page (HTML) — the body that crashed dial.
  const html = new Response('<html><body>502 Bad Gateway</body></html>', {
    status: 502,
    statusText: 'Bad Gateway',
    headers: { 'Content-Type': 'text/html' },
  })
  try {
    await oldErrorPath(html)
    console.log('OLD path: no error (unexpected for non-JSON body)')
  } catch (e) {
    console.log(`OLD path error: ${e.name}: ${e.message}`)
  }

  const html2 = new Response('<html><body>502 Bad Gateway</body></html>', {
    status: 502,
    statusText: 'Bad Gateway',
    headers: { 'Content-Type': 'text/html' },
  })
  try {
    const payload = await newErrorPath(html2)
    console.log(`NEW path: OK, payload = ${JSON.stringify(payload).slice(0, 40)}... (no stream error)`)
  } catch (e) {
    console.log(`NEW path error: ${e.name}: ${e.message}`)
  }

  // Live-BE check: unauthenticated POST /twilio/dial (401 JSON) — verify the
  // NEW path surfaces the API error cleanly against the real endpoint.
  try {
    const live = await fetch('http://127.0.0.1:8870/twilio/dial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"lead_id":"x"}',
    })
    console.log(`live BE /twilio/dial (no auth) -> HTTP ${live.status}`)
    const payload = await newErrorPath(live)
    console.log(`live BE error payload -> ${JSON.stringify(payload)}`)
  } catch (e) {
    console.log(`live BE fetch failed: ${e.message}`)
  }
}

main()
