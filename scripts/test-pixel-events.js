/**
 * Script temporário para enviar 3 eventos de teste para a API de Conversões do Meta.
 * Pode ser removido após os testes.
 */

const PIXEL_ID = '1438982624011739';
const ACCESS_TOKEN = 'EAAS9U9wMmJkBRLwZClKjX7rcoMLLT66Ym8KY1VvGaGBFy9J0oZAIJcUss71PZBmxX4wV70bG0fleuZAgRtYWCFgdQPZCRdaPJ1GeJ3b8wFXHHwTrKmXZCdreQcykQtBCy1bb3r2rnupvornypsKnW5EsYwZBj97nSd8Bnz1osZAnsHu4JjlCqu2o6Oi3svWYfBEZC0QZDZD';
const TEST_EVENT_CODE = 'TEST71931';

const API_URL = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

async function sendEvent(eventName, eventId, extraData = {}) {
  const timestamp = Math.floor(Date.now() / 1000);

  const eventData = {
    event_name: eventName,
    event_time: timestamp,
    event_id: eventId,
    action_source: 'website',
    user_data: {
      client_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      client_ip_address: '203.0.113.1',
    },
    ...extraData,
  };

  const payload = {
    data: [eventData],
    test_event_code: TEST_EVENT_CODE,
  };

  console.log(`\n--- Enviando evento: ${eventName} (ID: ${eventId}) ---`);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (response.ok) {
    console.log(`✅ ${eventName} enviado com sucesso!`);
    console.log('   Resposta:', JSON.stringify(result, null, 2));
  } else {
    console.error(`❌ Erro ao enviar ${eventName}:`);
    console.error('   Status:', response.status);
    console.error('   Resposta:', JSON.stringify(result, null, 2));
  }

  return result;
}

async function main() {
  console.log('=== Teste de Eventos - Meta Conversions API ===');
  console.log(`Pixel ID: ${PIXEL_ID}`);
  console.log(`Test Event Code: ${TEST_EVENT_CODE}`);
  console.log('');

  // Evento 1: PageView
  await sendEvent('PageView', `${Date.now()}_PageView_test1`);

  // Evento 2: ViewContent
  await sendEvent('ViewContent', `${Date.now()}_ViewContent_test2`, {
    custom_data: {
      currency: 'BRL',
      content_type: 'product',
      content_id: 'atendimento',
    },
  });

  // Evento 3: Contact
  await sendEvent('Contact', `${Date.now()}_Contact_test3`, {
    custom_data: {
      currency: 'BRL',
      content_type: 'product',
      content_id: 'atendimento',
    },
  });

  console.log('\n=== Todos os 3 eventos de teste foram enviados ===');
}

main().catch(console.error);
