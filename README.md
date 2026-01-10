# Emprest-Nunes Landing Page

Landing page para simulação de empréstimo Creditop, configurada para deploy em Coolify com Traefik.

## Configuração

- **Domínio**: `https://Emprest-Nunes.multinexo.com.br`
- **Framework**: Next.js 14
- **Deployment**: Coolify + Traefik
- **Subpath**: `/Emprest-Nunes` (gerenciado por Traefik stripprefix)

## Instalação Local

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

## Build para Produção

```bash
npm run build
npm start
```

## Traefik Configuration

Os labels do Traefik estão configurados no Coolify para:
- Remover o prefixo `/Emprest-Nunes` antes de rotear para a aplicação
- Redirecionar HTTP para HTTPS
- Usar Let's Encrypt para certificado SSL

## Elementos Preservados

- ✅ Link WhatsApp: `https://wa.me/5531995248167`
- ✅ Meta Ads Pixel ID: `2006224949946315`
- ✅ Todas as cidades atendidas
- ✅ Design e layout original

## Estrutura

```
/pages
  /index.js          - Página principal
  /_app.js           - App wrapper
/styles
  /home.module.css   - Estilos da página
  /globals.css       - Estilos globais
/public              - Arquivos estáticos
next.config.js       - Configuração Next.js
package.json         - Dependências
```
