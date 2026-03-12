'use client'

import { detectarDispositivo, obterSistemaOperacional, normalizarTelefone, hashSHA256 } from './lib/utils'

export interface TrackingData {
  event_id: string
  event_name: string
  timestamp: string
  source: string
  conversation_id?: string
  conversation_status?: string
  client_user_agent?: string
  device_type?: string
  operating_system?: string
  nome?: string
  phone?: string
  ph?: string
  fn?: string
  fbc?: string
  fbp?: string
  external_id?: string
  event_source_url?: string
  [key: string]: any
}

export interface TrackOptions {
  sendToMeta?: boolean
  sendToN8N?: boolean
  oncePerVisitor?: boolean
}

const sentEventIdsKey = 'sentEventIds'
const conversationIdKey = 'conversation_id'
const visitorFiredKey = 'visitor_fired_events'
const visitorFingerprintKey = 'visitor_fingerprint'

let cachedFingerprint: string | null = null

function getFbCookies(): { fbc: string | undefined; fbp: string | undefined } {
  if (typeof document === 'undefined') return { fbc: undefined, fbp: undefined }
  try {
    const cookies = document.cookie.split(';').map(c => c.trim())
    let fbc: string | undefined
    let fbp: string | undefined
    for (const cookie of cookies) {
      if (cookie.startsWith('_fbc=')) fbc = cookie.substring(5)
      if (cookie.startsWith('_fbp=')) fbp = cookie.substring(5)
    }
    if (!fbc) {
      const params = new URLSearchParams(window.location.search)
      const fbclid = params.get('fbclid')
      if (fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`
      }
    }
    return { fbc, fbp }
  } catch {
    return { fbc: undefined, fbp: undefined }
  }
}

async function getVisitorFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint

  if (typeof window === 'undefined') return 'unknown'

  try {
    const stored = window.localStorage.getItem(visitorFingerprintKey)
    if (stored) {
      cachedFingerprint = stored
      return stored
    }
  } catch { /* ignore */ }

  let ip = 'unknown'
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const json = await res.json()
      ip = json.ip || 'unknown'
    }
  } catch { /* fallback sem IP */ }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const raw = `${ip}_${ua}`
  const fingerprint = await hashSHA256(raw)

  try {
    window.localStorage.setItem(visitorFingerprintKey, fingerprint)
  } catch { /* ignore */ }

  cachedFingerprint = fingerprint
  return fingerprint
}

function hasVisitorFired(eventName: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(visitorFiredKey)
    if (!raw) return false
    const map = JSON.parse(raw)
    return map[eventName] === true
  } catch {
    return false
  }
}

function markVisitorFired(eventName: string): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(visitorFiredKey)
    const map = raw ? JSON.parse(raw) : {}
    map[eventName] = true
    window.localStorage.setItem(visitorFiredKey, JSON.stringify(map))
  } catch { /* ignore */ }
}

export function gerarEventId(eventName: string): string {
  const now = Date.now()
  const rand = Math.random().toString(36).slice(2, 10)
  return `${now}_${eventName}_${rand}`
}

function getOrCreateConversationId(): string {
  if (typeof window === 'undefined') return gerarEventId('conversation')

  try {
    const existing = window.sessionStorage.getItem(conversationIdKey)
    if (existing) return existing

    const created = gerarEventId('conversation')
    window.sessionStorage.setItem(conversationIdKey, created)
    return created
  } catch {
    return gerarEventId('conversation')
  }
}

function loadSentEventIds(): Set<string> {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const raw = window.sessionStorage.getItem(sentEventIdsKey)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>()
    return new Set<string>(parsed.filter((x) => typeof x === 'string'))
  } catch {
    return new Set<string>()
  }
}

function saveSentEventIds(set: Set<string>): void {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(sentEventIdsKey, JSON.stringify(Array.from(set)))
  } catch {
    return
  }
}

function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const out: Partial<T> = {}
  ;(Object.keys(obj) as Array<keyof T>).forEach((k) => {
    const v = obj[k]
    if (v !== undefined && v !== null) out[k] = v
  })
  return out as T
}

const META_STANDARD_EVENTS = new Set([
  'PageView', 'ViewContent', 'Lead', 'Contact',
  'CompleteRegistration', 'SubmitApplication', 'Search',
  'AddToCart', 'AddToWishlist', 'InitiateCheckout',
  'AddPaymentInfo', 'Purchase', 'Subscribe', 'StartTrial',
  'Schedule', 'FindLocation', 'CustomizeProduct', 'Donate',
])

async function sendToMetaPixel(eventName: string, data: TrackingData): Promise<void> {
  if (typeof window === 'undefined') return
  const fbq = (window as any).fbq
  if (!fbq) return

  const { ph, fn, fbc, fbp, external_id, ...withoutHashes } = data
  const payload = sanitizeObject(withoutHashes)

  const userProperties: Record<string, string> = {}
  if (ph) userProperties.ph = ph
  if (fn) userProperties.fn = fn
  if (external_id) userProperties.external_id = external_id
  if (fbc) userProperties.fbc = fbc
  if (fbp) userProperties.fbp = fbp

  if (Object.keys(userProperties).length > 0) {
    fbq('init', process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '754980670506724', userProperties)
  }

  const isStandard = META_STANDARD_EVENTS.has(eventName)
  const method = isStandard ? 'track' : 'trackCustom'

  fbq(method, eventName, payload, { eventID: data.event_id })
}

async function sendToN8NWebhook(data: TrackingData): Promise<void> {
  if (typeof window === 'undefined') return

  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [data] }),
    })
  } catch {
    return
  }
}

export async function trackEvent(
  eventName: string,
  data: Partial<TrackingData> = {},
  options: TrackOptions = {}
): Promise<TrackingData | null> {
  if (typeof window === 'undefined') return null

  const sendToMeta = options.sendToMeta !== false
  const sendToN8N = options.sendToN8N !== false
  const oncePerVisitor = options.oncePerVisitor === true

  if (oncePerVisitor && hasVisitorFired(eventName)) {
    return null
  }

  const client_user_agent = navigator.userAgent
  const device_type = detectarDispositivo()
  const operating_system = obterSistemaOperacional()

  const phoneRaw = typeof data.phone === 'string' ? data.phone : undefined
  const phone = phoneRaw ? normalizarTelefone(phoneRaw) : undefined

  const ph = phone ? await hashSHA256(phone) : undefined

  const nomeRaw = typeof data.nome === 'string' ? data.nome.trim().toLowerCase() : undefined
  const fn = nomeRaw ? await hashSHA256(nomeRaw) : undefined

  const { fbc, fbp } = getFbCookies()

  const visitor_fingerprint = oncePerVisitor ? await getVisitorFingerprint() : undefined
  const external_id = visitor_fingerprint || getOrCreateConversationId()
  const event_source_url = typeof window !== 'undefined' ? window.location.href : undefined

  const trackingData: TrackingData = {
    event_id: typeof data.event_id === 'string' && data.event_id ? data.event_id : gerarEventId(eventName),
    event_name: eventName,
    timestamp: typeof data.timestamp === 'string' && data.timestamp ? data.timestamp : new Date().toISOString(),
    source: typeof data.source === 'string' && data.source ? data.source : 'website',
    conversation_id:
      typeof data.conversation_id === 'string' && data.conversation_id ? data.conversation_id : getOrCreateConversationId(),
    conversation_status: typeof data.conversation_status === 'string' ? data.conversation_status : undefined,
    client_user_agent,
    device_type,
    operating_system,
    phone,
    ph,
    fn,
    fbc,
    fbp,
    external_id,
    event_source_url,
    visitor_fingerprint,
    ...data,
  }

  const sanitized = sanitizeObject(trackingData)

  const sentEventIds = loadSentEventIds()
  if (sentEventIds.has(sanitized.event_id)) {
    return null
  }

  sentEventIds.add(sanitized.event_id)
  saveSentEventIds(sentEventIds)

  if (sendToMeta) {
    await sendToMetaPixel(eventName, sanitized)
  }

  if (sendToN8N) {
    await sendToN8NWebhook(sanitized)
  }

  if (oncePerVisitor) {
    markVisitorFired(eventName)
  }

  return sanitized
}
