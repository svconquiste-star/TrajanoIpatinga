import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface ContactData {
  telefone_cliente: string
  nome_cliente?: string
  mensagem?: string
  cidade?: string
  whatsapp_destino?: string
  event_id?: string
  client_ip?: string
  user_agent?: string
  fbc?: string
  fbp?: string
  event_source_url?: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

const sentEventIds = new Set<string>()

function normalizarTelefone(telefone: string): string {
  const apenasNumeros = telefone.replace(/\D/g, '')
  
  if (apenasNumeros.length === 11 && apenasNumeros.startsWith('55')) {
    return apenasNumeros
  }
  
  if (apenasNumeros.length === 11) {
    return '55' + apenasNumeros
  }
  
  if (apenasNumeros.length === 10) {
    return '55' + apenasNumeros
  }
  
  return '55' + apenasNumeros
}

function hashSHA256(valor: string): string {
  return crypto.createHash('sha256').update(valor).digest('hex')
}

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

function isValidPhone(phone: string): boolean {
  const apenasNumeros = phone.replace(/\D/g, '')
  return apenasNumeros.length >= 10 && apenasNumeros.length <= 13
}

function validateContactData(data: ContactData): ValidationResult {
  const errors: string[] = []

  if (!data.telefone_cliente || typeof data.telefone_cliente !== 'string') {
    errors.push('telefone_cliente é obrigatório e deve ser uma string')
  } else if (!isValidPhone(data.telefone_cliente)) {
    errors.push('telefone_cliente deve ser um telefone válido')
  }

  if (data.nome_cliente && typeof data.nome_cliente !== 'string') {
    errors.push('nome_cliente deve ser uma string')
  }

  if (data.cidade && typeof data.cidade !== 'string') {
    errors.push('cidade deve ser uma string')
  }

  if (data.mensagem && typeof data.mensagem !== 'string') {
    errors.push('mensagem deve ser uma string')
  }

  if (data.whatsapp_destino && typeof data.whatsapp_destino !== 'string') {
    errors.push('whatsapp_destino deve ser uma string')
  } else if (data.whatsapp_destino && !isValidPhone(data.whatsapp_destino)) {
    errors.push('whatsapp_destino deve ser um telefone válido')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function sanitizeContactData(data: ContactData): ContactData {
  const sanitized = { ...data }

  if (sanitized.telefone_cliente) {
    sanitized.telefone_cliente = sanitized.telefone_cliente.replace(/\D/g, '')
  }

  if (sanitized.nome_cliente) {
    sanitized.nome_cliente = sanitized.nome_cliente.trim()
  }

  if (sanitized.cidade) {
    sanitized.cidade = sanitized.cidade.trim().toUpperCase()
  }

  if (sanitized.mensagem) {
    sanitized.mensagem = sanitized.mensagem.trim()
  }

  if (sanitized.whatsapp_destino) {
    sanitized.whatsapp_destino = sanitized.whatsapp_destino.replace(/\D/g, '')
  }

  return sanitized
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactData = await request.json()
    
    const validation = validateContactData(body)
    if (!validation.valid) {
      console.error('Erros de validação:', validation.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    const sanitized = sanitizeContactData(body)
    
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    
    const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0'
    
    const telefonNormalizado = normalizarTelefone(sanitized.telefone_cliente)
    const telefonHash = hashSHA256(telefonNormalizado)
    
    const nomeCliente = sanitized.nome_cliente || undefined
    const fnHash = nomeCliente ? hashSHA256(nomeCliente.trim().toLowerCase()) : undefined
    
    const dataNormalizacao = new Date().toISOString()
    const eventTime = Math.floor(Date.now() / 1000)
    const eventId = (sanitized.event_id && typeof sanitized.event_id === 'string')
      ? sanitized.event_id
      : `${telefonNormalizado}_${eventTime}_${Math.random().toString(36).substring(2, 15)}`
    
    if (sentEventIds.has(eventId)) {
      console.warn(`Evento duplicado detectado: ${eventId}. Descartando.`)
      return NextResponse.json({
        success: false,
        error: 'Evento duplicado detectado',
        event_id: eventId,
      }, { status: 409 })
    }

    sentEventIds.add(eventId)
    
    const whatsappDestinoNormalizado = sanitized.whatsapp_destino
      ? normalizarTelefone(sanitized.whatsapp_destino)
      : undefined

    const payload = {
      data: [
        {
          event_name: 'Contact',
          event_time: eventTime,
          event_id: eventId,
          action_source: 'website',
          event_source_url: sanitized.event_source_url || 'https://trajanoipatinga.multinexo.com.br/',
          user_data: {
            ph: [telefonHash],
            ...(fnHash && { fn: [fnHash] }),
            client_ip_address: clientIp,
            client_user_agent: userAgent,
            ...(sanitized.fbc && { fbc: sanitized.fbc }),
            ...(sanitized.fbp && { fbp: sanitized.fbp }),
            external_id: [eventId],
          },
          custom_data: {
            mensagem: sanitized.mensagem || 'Quero saber mais sobre empréstimo',
            data_entrada: dataNormalizacao,
            data_entrada_normalizada: dataNormalizacao,
            canal: 'whatsapp',
            cidade: sanitized.cidade || 'Não informada',
            lead_qualificado: true,
            telefone_normalizado: telefonNormalizado,
            ...(sanitized.whatsapp_destino && { whatsapp_destino: sanitized.whatsapp_destino }),
          },
        },
      ],
    }
    
    console.log('Payload para n8n:', JSON.stringify(payload, null, 2))
    
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    
    console.log('N8N_WEBHOOK_URL:', n8nWebhookUrl)
    
    if (n8nWebhookUrl) {
      try {
        console.log('Enviando requisição para n8n...')
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        
        console.log('Status da resposta n8n:', n8nResponse.status)
        console.log('Status text:', n8nResponse.statusText)
        
        const responseText = await n8nResponse.text()
        console.log('Resposta do n8n:', responseText)
        
        if (!n8nResponse.ok) {
          console.error('Erro ao enviar para n8n:', n8nResponse.statusText, responseText)
        } else {
          console.log('Sucesso ao enviar para n8n')
        }
      } catch (error) {
        console.error('Erro na requisição para n8n:', error)
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      }
    } else {
      console.warn('N8N_WEBHOOK_URL não configurada')
    }
    
    return NextResponse.json({
      success: true,
      event_id: eventId,
      message: 'Dados recebidos com sucesso',
    })
  } catch (error) {
    console.error('Erro ao processar contato:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar dados' },
      { status: 400 }
    )
  }
}
