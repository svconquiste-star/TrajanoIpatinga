
'use client'

import { useEffect, useState, useRef } from 'react'
import { normalizarTelefone, validarTelefone } from './lib/utils'
import { trackEvent, gerarEventId } from './utils'

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [customCity, setCustomCity] = useState<string>('')
  const [showCustomCityInput, setShowCustomCityInput] = useState(false)
  const [userPhone, setUserPhone] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string>('')
  const [pageStartTime] = useState<number>(Date.now())
  const [scrollPercentage, setScrollPercentage] = useState<number>(0)
  const scrollTrackedRef = useRef<Set<number>>(new Set())
  const cityTrackedRef = useRef<Set<string>>(new Set())

  const whatsappPhones = ['5531973486774', '5531983918540']
  const whatsappRoundRobinKey = 'whatsapp_round_robin_index'
  const whatsappLink = `https://api.whatsapp.com/send/?phone=${whatsappPhones[0]}&text=Ol%C3%A1%21%20Quero%20fazer%20uma%20simula%C3%A7%C3%A3o%20de%20empr%C3%A9stimo.%20Meu%20nome%20%C3%A9%20____%2C%20valor%20desejado%20R%24____%2C%20minha%20renda%20%C3%A9%20R%24____.&type=phone_number&app_absent=0`

  const getNextWhatsAppPhone = () => {
    if (typeof window === 'undefined') return whatsappPhones[0]
    try {
      const raw = window.localStorage.getItem(whatsappRoundRobinKey)
      const currentIndex = raw ? Number.parseInt(raw, 10) : 0
      const safeIndex = Number.isFinite(currentIndex) ? currentIndex : 0
      const selected = whatsappPhones[((safeIndex % whatsappPhones.length) + whatsappPhones.length) % whatsappPhones.length]
      const nextIndex = (safeIndex + 1) % whatsappPhones.length
      window.localStorage.setItem(whatsappRoundRobinKey, String(nextIndex))
      return selected
    } catch {
      return whatsappPhones[0]
    }
  }

  const cidades = [
    "IPATINGA", "OUTRA CIDADE"
  ]

  const atendidas = new Set([
    "IPATINGA"
  ])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackEvent('ViewContent', {
        source: 'landing_page',
        nome: userName || undefined,
        phone: userPhone || undefined,
        content_type: 'landing_page',
        content_id: 'emprestimo_ipatinga',
        currency: 'BRL',
      }, { oncePerVisitor: true })
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0
      
      setScrollPercentage(scrollPercent)

      const milestones = [25, 50, 75, 100]
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !scrollTrackedRef.current.has(milestone)) {
          scrollTrackedRef.current.add(milestone)
          trackEvent('ScrollMilestone', {
            source: 'landing_page',
            nome: userName || undefined,
            phone: userPhone || undefined,
            scroll_percentage: milestone,
            time_on_page: Math.round((Date.now() - pageStartTime) / 1000),
          }, { sendToMeta: false })
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pageStartTime])

  const handleCityClick = async (cidade: string) => {
    if (cidade === "OUTRA CIDADE" || !atendidas.has(cidade)) {
      await trackEvent('CityNotAvailable', {
        source: 'landing_page',
        nome: userName || undefined,
        phone: userPhone || undefined,
        cidade,
        content_type: 'city_selection',
        content_id: cidade,
      }, { sendToMeta: false })
      setShowCustomCityInput(true)
      setSelectedCity('OUTRA CIDADE')
      setCustomCity('')
    } else {
      if (!cityTrackedRef.current.has(cidade)) {
        cityTrackedRef.current.add(cidade)
        await trackEvent('ViewContent', {
          source: 'landing_page',
          nome: userName || undefined,
          phone: userPhone || undefined,
          content_type: 'city_selection',
          content_id: cidade,
          currency: 'BRL',
        })
      }
      setSelectedCity(cidade)
      setShowCustomCityInput(false)
      setCustomCity('')
    }
  }

  const isPhoneValid = userPhone && validarTelefone(userPhone)
  const cidadeFinal = selectedCity === 'OUTRA CIDADE' ? customCity.trim().toUpperCase() : selectedCity
  const isWhatsAppEnabled = selectedCity && (atendidas.has(selectedCity) || (selectedCity === 'OUTRA CIDADE' && customCity.trim().length > 0)) && isPhoneValid

  const handlePhoneChange = (value: string) => {
    setUserPhone(value)
    
    if (!value.trim()) {
      setPhoneError('Telefone é obrigatório')
    } else if (!validarTelefone(value)) {
      setPhoneError('Telefone inválido. Use o formato: DD + 8 ou 9 dígitos (ex: 31987654321 ou 3187654321)')
    } else {
      setPhoneError('')
    }
  }

  const handleWhatsAppClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedCity || !cidadeFinal) {
      return
    }

    if (!userPhone || !validarTelefone(userPhone)) {
      await trackEvent('ValidationError', {
        source: 'landing_page',
        nome: userName || undefined,
        phone: userPhone || undefined,
        error_type: 'invalid_phone',
        content_type: 'form_validation',
        content_id: 'phone_validation',
      }, { sendToMeta: false })
      alert('Por favor, informe um telefone válido')
      return
    }

    const telefonNormalizado = normalizarTelefone(userPhone)
    const nomeCliente = userName.trim() || 'Cliente'
    const mensagemWhatsApp = `Olá! Sou ${nomeCliente}. Quero fazer uma simulação de empréstimo. Moro em ${cidadeFinal} e meu telefone é ${telefonNormalizado}`
    const whatsappDestino = getNextWhatsAppPhone()
    const whatsappLinkDinamico = `https://api.whatsapp.com/send/?phone=${whatsappDestino}&text=${encodeURIComponent(mensagemWhatsApp)}&type=phone_number&app_absent=0`
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000)

    const contactEventId = gerarEventId('Contact')

    // Abrir WhatsApp IMEDIATAMENTE no clique (antes dos awaits)
    // Navegadores móveis bloqueiam window.open se não for síncrono no handler
    window.open(whatsappLinkDinamico, '_blank')

    // Tracking em background (fire-and-forget) — não bloqueia o usuário
    ;(async () => {
      try {
        await trackEvent('ConversaIniciada', {
          source: 'landing_page',
          nome: userName || undefined,
          phone: userPhone || undefined,
          content_type: 'whatsapp',
          content_id: 'whatsapp_conversa_iniciada',
          cidade: cidadeFinal,
          time_on_page: timeOnPage,
          scroll_percentage: scrollPercentage,
          conversation_channel: 'whatsapp',
          conversation_status: 'initiated',
          whatsapp_destino: whatsappDestino,
        })

        await trackEvent('Lead', {
          source: 'landing_page',
          nome: userName || undefined,
          phone: userPhone || undefined,
          content_type: 'form_submission',
          content_id: 'whatsapp_lead',
          currency: 'BRL',
          cidade: cidadeFinal,
          time_on_page: timeOnPage,
          scroll_percentage: scrollPercentage,
        })

        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telefone_cliente: userPhone,
            nome_cliente: userName || undefined,
            mensagem: 'Quero saber mais sobre empréstimo',
            cidade: cidadeFinal,
            whatsapp_destino: whatsappDestino,
            event_id: contactEventId,
            fbc: document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('_fbc='))?.substring(5) || undefined,
            fbp: document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('_fbp='))?.substring(5) || undefined,
            event_source_url: window.location.href,
          }),
        })

        if (response.ok) {
          await trackEvent('Contact', {
            source: 'landing_page',
            nome: userName || undefined,
            phone: userPhone || undefined,
            content_type: 'whatsapp_contact',
            content_id: 'whatsapp_initiated',
            currency: 'BRL',
            cidade: cidadeFinal,
            event_id: contactEventId,
            time_on_page: timeOnPage,
            whatsapp_destino: whatsappDestino,
          }, { sendToN8N: false })

          await trackEvent('WhatsAppButtonClick', {
            source: 'landing_page',
            nome: userName || undefined,
            phone: userPhone || undefined,
            event_identification: '868184259267342',
            event_name: 'WhatsAppButtonClick',
            event_description: 'Botão WhatsApp Clicado',
            event_category: 'Button Click',
            content_type: 'whatsapp_button',
            content_id: 'whatsapp_button_click',
            currency: 'BRL',
            cidade: cidadeFinal,
            event_id: contactEventId,
            time_on_page: timeOnPage,
            scroll_percentage: scrollPercentage,
            conversation_channel: 'whatsapp',
            conversation_status: 'button_clicked',
            whatsapp_destino: whatsappDestino,
          }, { sendToMeta: false })
        } else {
          await trackEvent('ContactError', {
            source: 'landing_page',
            nome: userName || undefined,
            phone: userPhone || undefined,
            error_type: 'api_error',
            status_code: response.status,
            content_type: 'form_submission',
            content_id: 'whatsapp_lead',
          }, { sendToMeta: false })
        }
      } catch (error) {
        await trackEvent('ContactError', {
          source: 'landing_page',
          nome: userName || undefined,
          phone: userPhone || undefined,
          error_type: 'network_error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          content_type: 'form_submission',
          content_id: 'whatsapp_lead',
        }, { sendToMeta: false })
        console.error('Erro ao enviar dados:', error)
      }
    })()
  }

  return (
    <div className="shell">
      <div className="content">
        <header className="hero" role="banner">
          <div className="hero-copy">
            <div className="hero-pill">
              <i className="fa-solid fa-sparkles"></i> Simulação gratuita · 100% online
            </div>
            <h1>Crédito online com análise rápida e processo 100% digital</h1>
            <p>Simule gratuitamente e veja as condições disponíveis para você. Sem compromisso, sem burocracia.</p>
            <ul className="hero-stats" aria-label="Indicadores de confiança">
              <li><strong>+2.500</strong><span>Simulações realizadas</span></li>
              <li><strong>9/10</strong><span>Aprovações em até 24h</span></li>
            </ul>
          </div>

          <aside className="hero-panel" aria-label="Seleção de cidade e WhatsApp">
            <div className="panel-head">
              <span><i className="fa-solid fa-location-dot"></i> Atendimento na sua região</span>
              <h2>Selecione sua cidade e simule agora</h2>
            </div>
            <p className="panel-note">Toque na sua cidade. Se estiver na nossa área de cobertura, a simulação é liberada na hora.</p>
            <div className="city-grid" role="group" aria-label="Lista de cidades atendidas">
              {cidades.map((cidade) => (
                <button
                  key={cidade}
                  type="button"
                  className={`city-btn ${selectedCity === cidade ? 'selected' : ''}`}
                  onClick={() => handleCityClick(cidade)}
                >
                  <span className="label">{cidade}</span>
                  <span className="dot" aria-hidden="true"></span>
                </button>
              ))}
            </div>
            {showCustomCityInput && (
              <div style={{ marginTop: '12px', marginBottom: '4px' }}>
                <input
                  type="text"
                  placeholder="Digite o nome da sua cidade"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,.2)',
                    background: 'rgba(255,255,255,.08)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontFamily: 'var(--font)',
                    width: '100%',
                    boxSizing: 'border-box' as const,
                  }}
                />
                <small style={{ color: 'rgba(255,255,255,.6)', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                  Informe sua cidade para prosseguir com a simulação.
                </small>
              </div>
            )}
            <div className="cta">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,.2)',
                    background: 'rgba(255,255,255,.08)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontFamily: 'var(--font)',
                  }}
                />
                <div>
                  <input
                    type="tel"
                    placeholder="Seu telefone *"
                    value={userPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: phoneError ? '2px solid #ef4444' : '1px solid rgba(255,255,255,.2)',
                      background: 'rgba(255,255,255,.08)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontFamily: 'var(--font)',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  {phoneError && (
                    <small style={{
                      color: '#ef4444',
                      display: 'block',
                      marginTop: '4px',
                      fontSize: '12px',
                    }}>
                      {phoneError}
                    </small>
                  )}
                </div>
              </div>
              <button
                className={`btn btn-whats ${isWhatsAppEnabled ? 'active' : 'btn-disabled'}`}
                onClick={handleWhatsAppClick}
                type="button"
              >
                <i className="fa-brands fa-whatsapp"></i>
                Simular agora pelo WhatsApp
              </button>
              <small>Simulação gratuita · Atendimento humano · Dados protegidos</small>
            </div>
          </aside>
        </header>

        <main>
          <section aria-labelledby="benefits">
            <div className="section-head">
              <h2 id="benefits">Por que escolher nosso crédito?</h2>
              <p>Processo simples, taxas transparentes e acompanhamento do início até o dinheiro na sua conta.</p>
            </div>
            <div className="features">
              <article className="feature-card">
                <i className="fa-solid fa-mobile-screen"></i>
                <h3>Processo 100% online</h3>
                <p>Faça tudo pelo celular, sem precisar sair de casa. Rápido, prático e sem complicação.</p>
              </article>
              <article className="feature-card">
                <i className="fa-solid fa-bolt"></i>
                <h3>Análise rápida</h3>
                <p>Resposta em minutos, não em dias. Seu tempo é valioso e a gente respeita isso.</p>
              </article>
              <article className="feature-card">
                <i className="fa-solid fa-file-invoice-dollar"></i>
                <h3>Taxas transparentes</h3>
                <p>Sem letra miúda. Você sabe exatamente quanto vai pagar antes de assinar qualquer coisa.</p>
              </article>
              <article className="feature-card">
                <i className="fa-solid fa-headset"></i>
                <h3>Atendimento humanizado</h3>
                <p>Você fala com uma pessoa real que guia cada etapa pelo WhatsApp, do início até a liberação.</p>
              </article>
            </div>
          </section>

          <section aria-labelledby="steps">
            <div className="section-head">
              <h2 id="steps">Como solicitar seu crédito</h2>
              <p>4 passos simples. Você acompanha tudo em tempo real pelo WhatsApp.</p>
            </div>
            <div className="timeline">
              <article className="step">
                <span>1</span>
                <h3>Faça a simulação</h3>
                <p>Escolha sua cidade e preencha seu telefone. A simulação é gratuita e sem compromisso.</p>
              </article>
              <article className="step">
                <span>2</span>
                <h3>Envie seus dados</h3>
                <p>Nosso especialista coleta as informações essenciais e monta a melhor proposta para o seu perfil.</p>
              </article>
              <article className="step">
                <span>3</span>
                <h3>Receba a análise</h3>
                <p>Análise rápida com retorno em minutos. Você acompanha cada etapa direto no WhatsApp.</p>
              </article>
              <article className="step">
                <span>4</span>
                <h3>Contrate e receba</h3>
                <p>Contrato digital, assinatura segura e dinheiro na conta após aprovação. Simples assim.</p>
              </article>
            </div>
          </section>

          <section className="proof" aria-labelledby="proof">
            <div className="testimonial">
              <div className="section-head" style={{ marginBottom: '18px' }}>
                <h2 id="proof">Quem já usou recomenda</h2>
              </div>
              <blockquote>
                "Precisava de um crédito rápido para resolver pendências e encontrei aqui. A simulação foi simples, o atendimento pelo WhatsApp foi muito atencioso e o valor caiu na minha conta no mesmo dia."
                <footer>— Roberto M., Ipatinga</footer>
              </blockquote>
            </div>
            <div className="numbers" aria-label="Indicadores">
              <div>
                <strong>94%</strong>
                <span>Satisfação média nos atendimentos</span>
              </div>
              <div>
                <strong>R$ 12 mi</strong>
                <span>Em crédito liberado em 2025</span>
              </div>
              <div>
                <strong>5min</strong>
                <span>Tempo médio para iniciar a conversa</span>
              </div>
              <div>
                <strong>Zero</strong>
                <span>Custos para simular e cancelar</span>
              </div>
            </div>
          </section>

          <section aria-labelledby="faq">
            <div className="section-head">
              <h2 id="faq">Perguntas frequentes</h2>
              <p>Tire suas dúvidas antes de simular.</p>
            </div>
            <div className="faq">
              <details>
                <summary>É seguro enviar meus dados?</summary>
                <p>Sim. Ambiente protegido com criptografia. Acesso restrito à equipe responsável e você pode solicitar exclusão a qualquer momento.</p>
              </details>
              <details>
                <summary>Tem algum custo para simular?</summary>
                <p>Não. A simulação é 100% gratuita. Só seguimos para contratação se você aprovar as condições.</p>
              </details>
              <details>
                <summary>Quais documentos preciso ter em mãos?</summary>
                <p>Documento oficial com foto, comprovante de renda e comprovante de residência atualizado. Caso precise de algo extra, avisaremos durante o atendimento.</p>
              </details>
              <details>
                <summary>E se a minha cidade ainda não estiver disponível?</summary>
                <p>Mostramos um aviso e registramos seu interesse para priorizar a expansão. Assim que liberarmos, você recebe uma mensagem automática no WhatsApp.</p>
              </details>
              <details>
                <summary>Posso cancelar depois de contratar?</summary>
                <p>Sim, conforme as condições do contrato. Tudo é explicado antes da assinatura.</p>
              </details>
            </div>
          </section>
        </main>

        <footer>
          <p style={{ textAlign: 'center', opacity: 0.7, fontSize: '13px', marginBottom: '16px' }}>As condições podem variar conforme análise de crédito. Simule agora e descubra a sua.</p>
          <span>© <span id="year">{new Date().getFullYear()}</span> Crédito online seguro. Todos os direitos reservados.</span>
        </footer>
      </div>

      {isModalOpen && (
        <div className="modal active" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalMessage">
          <div className="modal-box">
            <h2 id="modalTitle">Aviso importante</h2>
            <p id="modalMessage">Ainda não atendemos essa cidade, mas estamos expandindo. Registramos seu interesse e você será avisado assim que liberarmos.</p>
            <div className="modal-actions">
              <button className="modal-btn" type="button" onClick={() => setIsModalOpen(false)}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
