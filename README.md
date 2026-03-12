# Emprest Trajano Ipatinga - Landing Page

Landing page de empréstimo para Ipatinga, migrada de HTML/CSS estático para Next.js com integração de Meta Ads e rastreamento de WhatsApp.

## Funcionalidades

- Seleção de cidades com validação de cobertura
- Integração Meta Ads Pixel (ID: 754980670506724)
- Correspondência avançada (email e telefone)
- Rastreamento de eventos customizados
- Link WhatsApp com tracking
- Modal de aviso para cidades não atendidas
- Design responsivo (desktop, tablet, mobile)

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## Deploy em Coolify

1. Configure o repositório Git
2. Defina as variáveis de ambiente necessárias
3. Configure os Container Labels do Traefik conforme documentação
4. Deploy automático via Coolify

## Configuração Meta Ads

- **Pixel ID**: 754980670506724
- **Eventos rastreados**:
  - `PageView`: Carregamento da página com correspondência avançada
  - `CidadeSelecionada`: Quando usuário seleciona uma cidade
  - `ConversaIniciada`: Quando usuário clica em WhatsApp com dados de email/telefone

## Estrutura

```
app/
├── layout.tsx      # Layout principal
├── page.tsx        # Página inicial com toda lógica
├── globals.css     # Estilos globais
```

## Variáveis de Ambiente

```bash
# Webhook URL do n8n para receber eventos de contato
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/seu-webhook-id
```

Configure no arquivo `.env.local` (cópia de `.env.example`).

## Suporte

Para dúvidas ou problemas, consulte a documentação do Next.js e Traefik.
