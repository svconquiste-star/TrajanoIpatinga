import { sendToMetaPixel, sendToN8NWebhook, trackOnceViewContent } from '../app/utils';

type FbqCall = { args: any[] };

type FetchCall = {
  url: string;
  options?: any;
};

function assert(cond: any, msg: string) {
  if (!cond) {
    throw new Error(msg);
  }
}

async function setupBrowserMocks() {
  const fbqCalls: FbqCall[] = [];
  const fetchCalls: FetchCall[] = [];

  const fakeWindow: any = {
    location: { href: 'http://localhost:3000/?fbclid=TEST_FBCLID' },
    sessionStorage: {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.has(key) ? this.store.get(key) : null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
    },
    localStorage: {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.has(key) ? this.store.get(key) : null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
    },
    fbq: (...args: any[]) => {
      fbqCalls.push({ args });
    },
  };

  const fakeDocument: any = {
    cookie: '_fbp=fb.1.123.456; _fbc=fb.1.123.fbclid',
  };

  const fakeNavigator: any = {
    userAgent: 'Mozilla/5.0',
  };

  Object.defineProperty(globalThis, 'window', { value: fakeWindow, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: fakeDocument, configurable: true });
  Object.defineProperty(globalThis, 'navigator', { value: fakeNavigator, configurable: true });

  const originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (url: any, options?: any) => {
      fetchCalls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({}),
      } as any;
    },
  });

  return {
    fbqCalls,
    fetchCalls,
    restore() {
      Object.defineProperty(globalThis, 'fetch', { value: originalFetch, configurable: true });
    },
  };
}

async function main() {
  assert(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID, 'NEXT_PUBLIC_FACEBOOK_PIXEL_ID precisa estar definido para o teste');
  assert(
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL,
    'NEXT_PUBLIC_N8N_WEBHOOK_URL (ou N8N_WEBHOOK_URL) precisa estar definido para o teste'
  );

  const mocks = await setupBrowserMocks();

  // 1) ViewContent once-per-visitor
  await trackOnceViewContent();
  const viewContentCalls = mocks.fbqCalls.filter((c) => c.args[0] === 'track' && c.args[1] === 'ViewContent');
  assert(viewContentCalls.length === 1, `Esperado 1 chamada ViewContent, obtido ${viewContentCalls.length}`);

  // Deve não duplicar
  await trackOnceViewContent();
  const viewContentCalls2 = mocks.fbqCalls.filter((c) => c.args[0] === 'track' && c.args[1] === 'ViewContent');
  assert(viewContentCalls2.length === 1, 'ViewContent não deveria disparar 2x por visitante');

  // 2) ConversaIniciada
  await sendToMetaPixel({
    eventName: 'ConversaIniciada',
    pixelMethod: 'trackCustom',
    phone: '31999999999',
    name: 'Teste',
    data: { cidade: 'BH' },
  });

  // 3) Lead
  await sendToMetaPixel({
    eventName: 'Lead',
    pixelMethod: 'track',
    phone: '31999999999',
    name: 'Teste',
    data: { cidade: 'BH' },
  });

  // 4) Contact
  await sendToMetaPixel({
    eventName: 'Contact',
    pixelMethod: 'track',
    phone: '31999999999',
    name: 'Teste',
    data: { cidade: 'BH' },
  });

  const hasConversa = mocks.fbqCalls.some((c) => c.args[0] === 'trackCustom' && c.args[1] === 'ConversaIniciada');
  const hasLead = mocks.fbqCalls.some((c) => c.args[0] === 'track' && c.args[1] === 'Lead');
  const hasContact = mocks.fbqCalls.some((c) => c.args[0] === 'track' && c.args[1] === 'Contact');

  assert(hasConversa, 'Não encontrou fbq trackCustom ConversaIniciada');
  assert(hasLead, 'Não encontrou fbq track Lead');
  assert(hasContact, 'Não encontrou fbq track Contact');

  // eventID presente pelo menos nos eventos principais
  const hasEventId = mocks.fbqCalls.some((c) => {
    const last = c.args[c.args.length - 1];
    return last && typeof last === 'object' && 'eventID' in last;
  });
  assert(hasEventId, 'Não encontrou eventID em nenhuma chamada fbq');

  // 5) Eventos N8N-only: apenas valida que fazem fetch para o webhook
  await sendToN8NWebhook({ event_name: 'ValidationError', source: 'web' });
  await sendToN8NWebhook({ event_name: 'WhatsAppButtonClick', source: 'web' });
  await sendToN8NWebhook({ event_name: 'ContactError', source: 'web' });

  const n8nUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || '';
  const n8nCalls = mocks.fetchCalls.filter((c) => c.url === n8nUrl);
  assert(n8nCalls.length >= 3, `Esperado >=3 chamadas ao N8N webhook, obtido ${n8nCalls.length}`);

  mocks.restore();

  console.log('OK: Todos os eventos principais foram disparados (Pixel + N8N)');
}

main().catch((e) => {
  console.error('FAIL:', e?.message || e);
  process.exit(1);
});
