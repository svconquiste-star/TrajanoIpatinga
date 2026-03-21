import { detectDeviceType, getOS, hashSHA256, normalizePhone, validatePhone } from './lib/utils';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export type TrackingEventName =
  | 'PageView'
  | 'ViewContent'
  | 'ConversaIniciada'
  | 'Lead'
  | 'Contact'
  | 'ValidationError'
  | 'WhatsAppButtonClick'
  | 'ContactError';

export type TrackingPayload = {
  event_id: string;
  event_name: TrackingEventName;
  timestamp: number;
  source: 'web';
  event_source_url?: string;
  device_type?: string;
  os?: string;
  fbc?: string;
  fbp?: string;
  external_id?: string;
  conversation_id?: string;
  fn?: string;
  ph?: string;
  cidade?: string;
  value?: number;
  currency?: string;
};

const CURRENCY = 'BRL';

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const [k, ...rest] = c.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function getFbCookies() {
  if (typeof window === 'undefined') {
    return { fbc: '', fbp: '' };
  }
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');

  try {
    const url = new URL(window.location.href);
    const fbclid = url.searchParams.get('fbclid');
    if (!fbc && fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }
  } catch (_) {}

  return { fbc, fbp };
}

export function getOrCreateConversationId() {
  if (typeof window === 'undefined') return '';
  const key = 'conversation_id';
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, id);
  return id;
}

export function gerarEventId(eventName: string) {
  return `${Date.now()}_${eventName}_${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionSentEventIds() {
  if (typeof window === 'undefined') return new Set<string>();
  const key = 'sent_event_ids';
  const raw = window.sessionStorage.getItem(key);
  const set = new Set<string>();
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((x) => {
          if (typeof x === 'string') set.add(x);
        });
      }
    } catch (_) {}
  }
  return set;
}

function persistSessionSentEventIds(set: Set<string>) {
  if (typeof window === 'undefined') return;
  const key = 'sent_event_ids';
  try {
    window.sessionStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

function markOncePerVisitor(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`once_${key}`, '1');
  } catch (_) {}
}

export function shouldFireOncePerVisitor(key: string) {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`once_${key}`) !== '1';
  } catch (_) {
    return false;
  }
}

export async function getVisitorFingerprint() {
  if (typeof window === 'undefined') return '';
  const key = 'external_id';
  const cached = window.localStorage.getItem(key);
  if (cached) return cached;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const raw = `${ua}`;
  const hashed = await hashSHA256(raw);

  try {
    window.localStorage.setItem(key, hashed);
  } catch (_) {}

  return hashed;
}

function sanitizeForPixel(payload: TrackingPayload) {
  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (v === undefined || v === null) continue;
    if (k === 'client_ip' || k === 'user_agent' || k === 'email' || k === 'phone') continue;
    sanitized[k] = v;
  }
  return sanitized;
}

const appliedAdvancedMatching = new Set<string>();

function applyAdvancedMatching(pixelId: string, user: { ph?: string; fn?: string; fbc?: string; fbp?: string; external_id?: string }) {
  if (typeof window === 'undefined' || !window.fbq) return;
  const key = `${user.ph || ''}|${user.fn || ''}|${user.fbc || ''}|${user.fbp || ''}|${user.external_id || ''}`;
  if (appliedAdvancedMatching.has(key)) return;
  window.fbq('init', pixelId, {
    ph: user.ph || undefined,
    fn: user.fn || undefined,
    fbc: user.fbc || undefined,
    fbp: user.fbp || undefined,
    external_id: user.external_id || undefined,
  });
  appliedAdvancedMatching.add(key);
}

export async function sendToMetaPixel(args: {
  eventName: TrackingEventName;
  pixelMethod: 'track' | 'trackCustom';
  data?: Partial<TrackingPayload>;
  eventId?: string;
  phone?: string;
  name?: string;
}) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
  const eventId = args.eventId || gerarEventId(args.eventName);
  if (!pixelId) {
    return { ok: false, reason: 'missing_pixel_id', event_id: eventId };
  }

  const sent = getSessionSentEventIds();
  if (sent.has(eventId)) {
    return { ok: false, reason: 'duplicate', event_id: eventId };
  }

  const { fbc, fbp } = getFbCookies();
  const external_id = await getVisitorFingerprint();
  const conversation_id = getOrCreateConversationId();

  const phoneNormalized = args.phone ? normalizePhone(args.phone) : '';
  const ph = phoneNormalized && validatePhone(phoneNormalized) ? await hashSHA256(phoneNormalized) : '';
  const fn = args.name ? await hashSHA256(String(args.name).trim().toLowerCase()) : '';

  const payload: TrackingPayload = {
    event_id: eventId,
    event_name: args.eventName,
    timestamp: Date.now(),
    source: 'web',
    value: 0,
    currency: CURRENCY,
    event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
    device_type: detectDeviceType(),
    os: getOS(),
    fbc: fbc || undefined,
    fbp: fbp || undefined,
    external_id: external_id || undefined,
    conversation_id: conversation_id || undefined,
    ph: ph || undefined,
    fn: fn || undefined,
    ...(args.data || {}),
  };

  try {
    if (typeof window !== 'undefined' && window.fbq) {
      applyAdvancedMatching(pixelId, {
        ph: payload.ph,
        fn: payload.fn,
        fbc: payload.fbc,
        fbp: payload.fbp,
        external_id: payload.external_id,
      });
      const safe = sanitizeForPixel(payload);
      window.fbq(args.pixelMethod, args.eventName, safe, { eventID: eventId });
      sent.add(eventId);
      persistSessionSentEventIds(sent);
    }
  } catch (_) {
    return { ok: false, reason: 'pixel', event_id: eventId };
  }

  return { ok: true, event_id: eventId };
}

export async function sendToN8NWebhook(payload: any) {
  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || '';
  if (!url) return { ok: false, reason: 'missing_url' };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { ok: false, reason: `http_${resp.status}`, error: text };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'network', error: String(e?.message || e) };
  }
}

export async function trackOnceViewContent() {
  if (!shouldFireOncePerVisitor('view_content')) return;
  const r = await sendToMetaPixel({ eventName: 'ViewContent', pixelMethod: 'track' });
  if (r.ok) markOncePerVisitor('view_content');
}
