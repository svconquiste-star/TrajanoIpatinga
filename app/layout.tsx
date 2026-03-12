import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Simulação de Empréstimo | Atendimento via WhatsApp',
  description: 'LP oficial — escolha sua cidade e libere o atendimento exclusivo no WhatsApp.',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  themeColor: '#030814',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '754980670506724'

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${pixelId}');fbq('init','${pixelId}');fbq('track','PageView');`,
          }}
        />
      </head>
      <body>
        {children}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  )
}
