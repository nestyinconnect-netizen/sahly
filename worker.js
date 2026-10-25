// Cloudflare Worker entry point.
// Handles the /api/submit form endpoint and serves static assets for every other path.

const CATEGORY_LABEL = {
  listing: 'LISTING',
  enquiry: 'ENQUIRY',
  wanted: 'WANTED',
  contact: 'CONTACT',
}

const MESSAGE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/message') {
      return handleMessage(request, env)
    }

    if (url.pathname === '/api/submit') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'Method not allowed' }, 405)
      }
      try {
        return await handleSubmit(request, env)
      } catch (error) {
        console.error('submit failed', error)
        return json({ ok: false, error: 'We could not send your request. Please try again.' }, 500)
      }
    }

    // Fall through to static assets (index.html, JS, CSS, images).
    return env.ASSETS.fetch(request)
  },
}

async function handleMessage(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: MESSAGE_CORS_HEADERS })
  }
  if (request.method !== 'POST') {
    return messageJson({ success: false, message: 'Method not allowed' }, 405)
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return messageJson({ success: false, message: 'Invalid request body' }, 400)
  }

  const messageType = String(payload.messageType || '').toLowerCase()
  const isContact = messageType === 'contact'
  const intent = [payload.type, payload.intent, payload.messageType].some((value) => String(value || '').toLowerCase() === 'rent') ? 'rent' : 'buy'
  const enquiryRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, type: isContact ? 'contact' : 'enquiry', intent }),
  })

  try {
    const response = await handleSubmit(enquiryRequest, env)
    const result = await response.json()
    if (!result.ok) {
      return messageJson({ success: false, message: result.error }, response.status)
    }
    if (!result.sent) {
      return messageJson({ success: false, message: 'Email delivery is not configured.' }, 503)
    }
    return messageJson({ success: true, reference: result.reference })
  } catch (error) {
    console.error('message submission failed', error)
    return messageJson({ success: false, message: 'We could not send your message. Please try again later.' }, 500)
  }
}

function messageJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...MESSAGE_CORS_HEADERS },
  })
}

async function handleSubmit(request, env) {
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return json({ ok: false, error: 'Invalid request body' }, 400)
  }

  const type = String(payload.type || '').toLowerCase()
  if (!['listing', 'enquiry', 'wanted', 'contact'].includes(type)) {
    return json({ ok: false, error: 'Unknown submission type' }, 400)
  }

  const name = trim(payload.name)
  const email = trim(payload.email)
  if (!name || !isEmail(email)) {
    return json({ ok: false, error: 'Name and a valid email are required.' }, 400)
  }

  const reference = buildReference(type)
  const summary = summarise(type, payload, reference)

  if (!env.RESEND_API_KEY || !env.COORDINATOR_EMAIL || !env.FROM_EMAIL) {
    console.warn('Email is not configured; skipping send.')
    return json({ ok: true, reference, sent: false })
  }

  const attachments = collectAttachments(payload)

  const ownerEmail = {
    from: env.FROM_EMAIL,
    to: [env.COORDINATOR_EMAIL],
    reply_to: email,
    subject: `[${CATEGORY_LABEL[type]}] ${summary.subject}`,
    html: summary.ownerHtml,
    text: summary.ownerText,
    attachments,
  }

  const userEmail = {
    from: env.FROM_EMAIL,
    to: [email],
    subject: `We received your ${summary.friendlyType} — ${reference}`,
    html: summary.userHtml,
    text: summary.userText,
  }

  const [ownerResult, userResult] = await Promise.all([
    sendResend(env.RESEND_API_KEY, ownerEmail),
    sendResend(env.RESEND_API_KEY, userEmail),
  ])

  if (!ownerResult.ok) {
    return json({ ok: false, error: 'Email service rejected the request.' }, 502)
  }

  return json({ ok: true, reference, sent: true, confirmationDelivered: userResult.ok })
}

async function sendResend(apiKey, email) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(email),
  })
  const body = await response.text()
  return { ok: response.ok, status: response.status, body }
}

function summarise(type, payload, reference) {
  const location = trim(payload.location) || trim(payload.area) || 'Not specified'
  if (type === 'contact') {
    const subject = trim(payload.subject) || 'Contact message'
    const rows = [
      ['Reference', reference],
      ['Name', trim(payload.name)],
      ['Email', trim(payload.email)],
      ['Phone', trim(payload.phone)],
      ['Subject', subject],
      ['Message', trim(payload.message)],
    ]
    return {
      friendlyType: 'message',
      subject,
      ownerHtml: htmlTable(rows),
      ownerText: textTable(rows),
      userHtml: confirmationHtml('contact', reference, subject),
      userText: confirmationText('contact', reference, subject),
    }
  }
  if (type === 'listing') {
    const mode = trim(payload.mode) || 'sell'
    const title = trim(payload.title) || 'Untitled product'
    const rows = [
      ['Reference', reference],
      ['Mode', mode],
      ['Name', trim(payload.name)],
      ['Email', trim(payload.email)],
      ['Phone', trim(payload.phone)],
      ['Product', title],
      ['Brand', trim(payload.brand)],
      ['Category', trim(payload.category)],
      ['Condition', trim(payload.condition)],
      ['Purchased', trim(payload.purchaseDate)],
      ['Used for', trim(payload.usedFor)],
      ['Original price', money(payload.originalPrice)],
      ['Expected sale price', money(payload.salePrice)],
      ['Suggested monthly rent', money(payload.rentalPrice)],
      ['Location', location],
      ['Description', trim(payload.description)],
    ]
    return {
      friendlyType: mode === 'rent' ? 'rental listing' : 'listing',
      subject: `${title} — ${location}`,
      ownerHtml: htmlTable(rows),
      ownerText: textTable(rows),
      userHtml: confirmationHtml('listing', reference, title),
      userText: confirmationText('listing', reference, title),
    }
  }
  if (type === 'enquiry') {
    const intent = trim(payload.type === 'rent' ? 'rent' : payload.intent === 'rent' ? 'rent' : 'buy')
    const productTitle = trim(payload.productTitle) || 'a listing'
    const rows = [
      ['Reference', reference],
      ['Wants to', intent],
      ['Name', trim(payload.name)],
      ['Email', trim(payload.email)],
      ['Phone', trim(payload.phone)],
      ['Address', trim(payload.address)],
      ['Product', productTitle],
      ['Product ID', trim(payload.productId)],
      ['Their offer', money(payload.offer)],
      ['Sale price', money(payload.salePrice)],
      ['Monthly rent', money(payload.rentalPrice)],
      ['Location', location],
      ['Message', trim(payload.message)],
    ]
    return {
      friendlyType: intent === 'rent' ? 'rental enquiry' : 'buying enquiry',
      subject: `${productTitle} — ${location}`,
      ownerHtml: htmlTable(rows),
      ownerText: textTable(rows),
      userHtml: confirmationHtml('enquiry', reference, productTitle),
      userText: confirmationText('enquiry', reference, productTitle),
    }
  }
  const product = trim(payload.product) || 'an unknown product'
  const rows = [
    ['Reference', reference],
    ['Wants to', trim(payload.type) || 'buy'],
    ['Name', trim(payload.name)],
    ['Email', trim(payload.email)],
    ['Phone', trim(payload.phone)],
    ['Product', product],
    ['Budget', money(payload.budget)],
    ['Area', location],
  ]
  return {
    friendlyType: 'product request',
    subject: `${product} — ${location}`,
    ownerHtml: htmlTable(rows),
    ownerText: textTable(rows),
    userHtml: confirmationHtml('wanted', reference, product),
    userText: confirmationText('wanted', reference, product),
  }
}

function collectAttachments(payload) {
  const image = trim(payload.image)
  if (!image || !image.startsWith('data:')) return undefined
  const [meta, base64] = image.split(',')
  if (!base64) return undefined
  const mimeMatch = meta.match(/data:([^;]+);base64/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const extension = mime.split('/')[1] || 'bin'
  return [{ filename: `photo.${extension}`, content: base64 }]
}

function htmlTable(rows) {
  const trs = rows
    .filter(([, value]) => value !== '' && value != null)
    .map(([label, value]) => `<tr><td style="padding:6px 12px;color:#68746d;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(label)}</td><td style="padding:6px 12px;color:#1f2b25;font-weight:600;">${escapeHtml(value)}</td></tr>`)
    .join('')
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1f2b25;"><h2 style="font-family:Georgia,serif;color:#164c3b;">New Sahly submission</h2><table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:640px;">${trs}</table></div>`
}

function textTable(rows) {
  return rows
    .filter(([, value]) => value !== '' && value != null)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
}

function confirmationHtml(type, reference, subject) {
  const intro = {
    listing: `Thanks for listing <strong>${escapeHtml(subject)}</strong> with Sahly.`,
    enquiry: `Thanks for your enquiry about <strong>${escapeHtml(subject)}</strong>.`,
    wanted: `Thanks for telling us you're looking for <strong>${escapeHtml(subject)}</strong>.`,
    contact: `Thanks for contacting Sahly about <strong>${escapeHtml(subject)}</strong>.`,
  }[type]
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1f2b25;max-width:520px;"><h2 style="font-family:Georgia,serif;color:#164c3b;">You're on our list.</h2><p>${intro}</p><p>We review every submission personally and will email you shortly with the next step.</p><p style="background:#f2efe7;padding:12px 16px;border-radius:4px;">Reference <strong>${escapeHtml(reference)}</strong></p><p style="color:#68746d;font-size:12px;">— The Sahly team</p></div>`
}

function confirmationText(type, reference, subject) {
  const intro = {
    listing: `Thanks for listing ${subject} with Sahly.`,
    enquiry: `Thanks for your enquiry about ${subject}.`,
    wanted: `Thanks for telling us you're looking for ${subject}.`,
    contact: `Thanks for contacting Sahly about ${subject}.`,
  }[type]
  return `${intro}\n\nWe review every submission personally and will email you shortly with the next step.\n\nReference: ${reference}\n\n— The Sahly team`
}

function buildReference(type) {
  const prefix = { listing: 'SL', enquiry: 'EN', wanted: 'WT', contact: 'CT' }[type] || 'SS'
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${stamp}-${random}`
}

function pad(number) {
  return String(number).padStart(2, '0')
}

function money(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return ''
  return `₹${new Intl.NumberFormat('en-IN').format(number)}`
}

function trim(value) {
  if (value == null) return ''
  return String(value).trim().slice(0, 2000)
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
