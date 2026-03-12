import crypto from 'crypto'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export class EventValidator {
  private sentEventIds: Set<string> = new Set()

  private isValidSHA256(hash: string): boolean {
    return /^[a-f0-9]{64}$/.test(hash)
  }

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    const apenasNumeros = phone.replace(/\D/g, '')
    return apenasNumeros.length >= 10 && apenasNumeros.length <= 13
  }

  validateEventData(data: any): ValidationResult {
    const errors: string[] = []

    if (!data.event_id || typeof data.event_id !== 'string') {
      errors.push('event_id é obrigatório e deve ser uma string')
    }

    if (!data.event_name || typeof data.event_name !== 'string') {
      errors.push('event_name é obrigatório e deve ser uma string')
    }

    if (typeof data.event_time !== 'number' || data.event_time <= 0) {
      errors.push('event_time é obrigatório e deve ser um número positivo')
    }

    if (!data.action_source || typeof data.action_source !== 'string') {
      errors.push('action_source é obrigatório e deve ser uma string')
    }

    if (!data.user_data || typeof data.user_data !== 'object') {
      errors.push('user_data é obrigatório e deve ser um objeto')
    } else {
      if (data.user_data.em && Array.isArray(data.user_data.em)) {
        data.user_data.em.forEach((email: string, index: number) => {
          if (!this.isValidSHA256(email)) {
            errors.push(`user_data.em[${index}] deve ser um hash SHA-256 válido`)
          }
        })
      }

      if (data.user_data.ph && Array.isArray(data.user_data.ph)) {
        data.user_data.ph.forEach((phone: string, index: number) => {
          if (!this.isValidSHA256(phone)) {
            errors.push(`user_data.ph[${index}] deve ser um hash SHA-256 válido`)
          }
        })
      }
    }

    if (!data.custom_data || typeof data.custom_data !== 'object') {
      errors.push('custom_data é obrigatório e deve ser um objeto')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  validateContactData(data: any): ValidationResult {
    const errors: string[] = []

    if (!data.telefone_cliente || typeof data.telefone_cliente !== 'string') {
      errors.push('telefone_cliente é obrigatório e deve ser uma string')
    } else if (!this.isValidPhone(data.telefone_cliente)) {
      errors.push('telefone_cliente deve ser um telefone válido')
    }

    if (data.email_cliente && !this.isValidEmail(data.email_cliente)) {
      errors.push('email_cliente deve ser um email válido')
    }

    if (data.cidade && typeof data.cidade !== 'string') {
      errors.push('cidade deve ser uma string')
    }

    if (data.mensagem && typeof data.mensagem !== 'string') {
      errors.push('mensagem deve ser uma string')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  isDuplicate(eventId: string): boolean {
    return this.sentEventIds.has(eventId)
  }

  markAsSent(eventId: string): void {
    this.sentEventIds.add(eventId)
  }

  sanitizeContactData(data: any): any {
    const sanitized = { ...data }

    if (sanitized.telefone_cliente) {
      sanitized.telefone_cliente = sanitized.telefone_cliente.replace(/\D/g, '')
    }

    if (sanitized.email_cliente) {
      sanitized.email_cliente = sanitized.email_cliente.toLowerCase().trim()
    }

    if (sanitized.cidade) {
      sanitized.cidade = sanitized.cidade.trim().toUpperCase()
    }

    if (sanitized.mensagem) {
      sanitized.mensagem = sanitized.mensagem.trim()
    }

    return sanitized
  }

  sanitizeEventData(data: any): any {
    const sanitized = { ...data }

    sanitized.user_data = {
      ...sanitized.user_data,
      client_ip_address: sanitized.user_data?.client_ip_address || 'client',
      client_user_agent: sanitized.user_data?.client_user_agent || 'unknown',
    }

    if (sanitized.user_data.em && !Array.isArray(sanitized.user_data.em)) {
      delete sanitized.user_data.em
    }

    if (sanitized.user_data.ph && !Array.isArray(sanitized.user_data.ph)) {
      delete sanitized.user_data.ph
    }

    sanitized.custom_data = {
      ...sanitized.custom_data,
    }

    Object.keys(sanitized.custom_data).forEach((key) => {
      if (sanitized.custom_data[key] === undefined || sanitized.custom_data[key] === null) {
        delete sanitized.custom_data[key]
      }
    })

    return sanitized
  }
}

export const eventValidator = new EventValidator()
