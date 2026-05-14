const PIXEL_ID = '1438982624011739';
const ACCESS_TOKEN = 'EAAS9U9wMmJkBRF4QZAd3ZAvZArodVf0spvyaytQrYAZAykf3ypFZAmT5PZCsGkUHHxn3d8EzI0HZCQCCR6fYppl85gm1lGPEwgQBxxpZCFFPTvLQLQNipIOjgY68sjb9rqIZAay1aDuGBvtSi2B9RwzORiXkVQNitr4Cx5crxpdAtgE8dJzRMLkEqGN3UJxwQ7wuKLwZDZD';
const TEST_EVENT_CODE = 'TEST71931';

const API_URL = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

async function sendContact() {
  const payload = {
    data: [{
      event_name: 'Contact',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `${Date.now()}_Contact_test`,
      action_source: 'website',
      user_data: {
        client_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        client_ip_address: '203.0.113.1',
      },
      custom_data: {
        currency: 'BRL',
        content_type: 'product',
        content_id: 'atendimento',
      },
    }],
    test_event_code: TEST_EVENT_CODE,
  };

  console.log('--- Enviando evento: Contact ---');
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (r.ok) {
    console.log('✅ Contact enviado com sucesso!');
    console.log('Resposta:', JSON.stringify(j, null, 2));
  } else {
    console.error('❌ Erro:', r.status);
    console.error('Resposta:', JSON.stringify(j, null, 2));
  }
}

sendContact().catch(console.error);
