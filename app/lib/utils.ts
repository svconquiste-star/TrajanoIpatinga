export function normalizarTelefone(telefone: string): string {
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

export function validarTelefone(telefone: string): boolean {
  const apenasNumeros = telefone.replace(/\D/g, '')
  return apenasNumeros.length >= 10 && apenasNumeros.length <= 13
}

export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function formatarTelefoneExibicao(telefone: string): string {
  const normalizado = normalizarTelefone(telefone)
  const apenasNumeros = normalizado.replace(/\D/g, '')
  
  if (apenasNumeros.length === 13) {
    const pais = apenasNumeros.slice(0, 2)
    const ddd = apenasNumeros.slice(2, 4)
    const parte1 = apenasNumeros.slice(4, 9)
    const parte2 = apenasNumeros.slice(9)
    return `+${pais} (${ddd}) ${parte1}-${parte2}`
  }
  
  return telefone
}

export async function hashSHA256(valor: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(valor)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export function detectarDispositivo(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = navigator.userAgent.toLowerCase()
  
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|phone|tablet/.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|playbook|silk/.test(userAgent)
  
  if (isTablet) {
    return 'tablet'
  } else if (isMobile) {
    return 'mobile'
  } else {
    return 'desktop'
  }
}

export function obterSistemaOperacional(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('windows')) return 'windows'
  if (userAgent.includes('mac')) return 'macos'
  if (userAgent.includes('linux')) return 'linux'
  if (userAgent.includes('android')) return 'android'
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios'
  
  return 'unknown'
}
