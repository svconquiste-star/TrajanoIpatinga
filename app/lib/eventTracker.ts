import { hashSHA256 } from './utils'

export interface TrackingData {
  event_id: string
  event_name: string
  timestamp: number
  event_time: number
  action_source: string
  user_data: any
  custom_data: any
  event_source_url?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class EventTracker {
  private sentEventIds: Set<string> = new Set()
  private eventQueue: TrackingData[] = []
  private maxQueueSize: number = 100
  private isProcessing: boolean = false

  constructor() {
    this.loadSentEventIds()
  }

  private loadSentEventIds(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = sessionStorage.getItem('sentEventIds')
      if (stored) {
        this.sentEventIds = new Set(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Erro ao carregar sentEventIds:', error)
      this.sentEventIds = new Set()
    }
  }

  private saveSentEventIds(): void {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem('sentEventIds', JSON.stringify(Array.from(this.sentEventIds)))
    } catch (error) {
      console.error('Erro ao salvar sentEventIds:', error)
    }
  }

  private generateEventId(eventName: string, timestamp: number): string {
    const randomString = Math.random().toString(36).substring(2, 15)
    return `${timestamp}_${eventName}_${randomString}`
  }

  private validateEventData(data: TrackingData): ValidationResult {
    const errors: string[] = []

    if (!data.event_id || typeof data.event_id !== 'string') {
      errors.push('event_id é obrigatório e deve ser uma string')
    }

    if (!data.event_name || typeof data.event_name !== 'string') {
      errors.push('event_name é obrigatório e deve ser uma string')
    }

    if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
      errors.push('timestamp é obrigatório e deve ser um número positivo')
    }

    if (typeof data.event_time !== 'number' || data.event_time <= 0) {
      errors.push('event_time é obrigatório e deve ser um número positivo')
    }

    if (!data.action_source || typeof data.action_source !== 'string') {
      errors.push('action_source é obrigatório e deve ser uma string')
    }

    if (!data.user_data || typeof data.user_data !== 'object') {
      errors.push('user_data é obrigatório e deve ser um objeto')
    }

    if (!data.custom_data || typeof data.custom_data !== 'object') {
      errors.push('custom_data é obrigatório e deve ser um objeto')
    }

    if (data.user_data && data.user_data.em) {
      if (Array.isArray(data.user_data.em)) {
        data.user_data.em.forEach((email: string, index: number) => {
          if (!this.isValidSHA256(email)) {
            errors.push(`user_data.em[${index}] deve ser um hash SHA-256 válido`)
          }
        })
      }
    }

    if (data.user_data && data.user_data.ph) {
      if (Array.isArray(data.user_data.ph)) {
        data.user_data.ph.forEach((phone: string, index: number) => {
          if (!this.isValidSHA256(phone)) {
            errors.push(`user_data.ph[${index}] deve ser um hash SHA-256 válido`)
          }
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private isValidSHA256(hash: string): boolean {
    return /^[a-f0-9]{64}$/.test(hash)
  }

  private isDuplicate(eventId: string): boolean {
    return this.sentEventIds.has(eventId)
  }

  private markAsSent(eventId: string): void {
    this.sentEventIds.add(eventId)
    this.saveSentEventIds()
  }

  private sanitizeEventData(data: TrackingData): TrackingData {
    const sanitized = { ...data }

    sanitized.user_data = {
      ...sanitized.user_data,
      client_ip_address: sanitized.user_data?.client_ip_address || 'client',
      client_user_agent: sanitized.user_data?.client_user_agent || navigator.userAgent,
    }

    if (sanitized.user_data.em && !Array.isArray(sanitized.user_data.em)) {
      delete sanitized.user_data.em
    }

    if (sanitized.user_data.ph && !Array.isArray(sanitized.user_data.ph)) {
      delete sanitized.user_data.ph
    }

    sanitized.custom_data = {
      ...sanitized.custom_data,
      page_title: sanitized.custom_data?.page_title || document.title,
      page_url: sanitized.custom_data?.page_url || window.location.href,
      timestamp: sanitized.custom_data?.timestamp || new Date().toISOString(),
    }

    Object.keys(sanitized.custom_data).forEach((key) => {
      if (sanitized.custom_data[key] === undefined || sanitized.custom_data[key] === null) {
        delete sanitized.custom_data[key]
      }
    })

    return sanitized
  }

  async processEvent(eventName: string, customData: any = {}): Promise<TrackingData | null> {
    const timestamp = Date.now()
    const eventTime = Math.floor(timestamp / 1000)
    const eventId = this.generateEventId(eventName, eventTime)

    const userData: any = {
      client_ip_address: 'client',
      client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    }

    const event: TrackingData = {
      event_id: eventId,
      event_name: eventName,
      timestamp,
      event_time: eventTime,
      action_source: 'website',
      user_data: userData,
      custom_data: customData,
      event_source_url: typeof window !== 'undefined' ? window.location.href : '',
    }

    const validation = this.validateEventData(event)
    if (!validation.valid) {
      console.error('Erro de validação do evento:', validation.errors)
      return null
    }

    if (this.isDuplicate(eventId)) {
      console.warn(`Evento duplicado detectado: ${eventId}. Descartando.`)
      return null
    }

    this.markAsSent(eventId)
    const sanitized = this.sanitizeEventData(event)

    console.log(`Evento processado com sucesso: ${eventId}`, sanitized)
    return sanitized
  }

  async addToQueue(event: TrackingData): Promise<void> {
    if (this.eventQueue.length >= this.maxQueueSize) {
      console.warn('Fila de eventos cheia. Descartando evento mais antigo.')
      this.eventQueue.shift()
    }

    this.eventQueue.push(event)
  }

  getQueue(): TrackingData[] {
    return [...this.eventQueue]
  }

  clearQueue(): void {
    this.eventQueue = []
  }

  getSentEventCount(): number {
    return this.sentEventIds.size
  }

  clearSentEvents(): void {
    this.sentEventIds.clear()
    this.saveSentEventIds()
  }
}

export const eventTracker = new EventTracker()
