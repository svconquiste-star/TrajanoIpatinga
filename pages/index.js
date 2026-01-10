import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../styles/home.module.css';

export default function Home() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const whatsappLink = "https://wa.me/5531995248167?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20empr%C3%A9stimo%20CREDITOP";

  const cidades = [
    "RIO MANSO","ITATIAIUÇU","ITAUNA","DIVINÓPOLIS","MATEUS LEME",
    "JUATUBA","BRUMADINHO","MARIO CAMPOS","IGARAPÉ","SÃO JOAQUIM DE BICAS",
    "CONTAGEM","BELO HORIZONTE","SARZEDO","IBIRITÉ"
  ];

  const atendidas = new Set(cidades);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : 'auto';
  }, [showModal]);

  const handleCityClick = (cidade) => {
    setSelectedCity(cidade);
    
    try {
      if (window.fbq) {
        window.fbq('trackCustom', 'CidadeSelecionada', { cidade });
      }
    } catch (e) {}

    if (cidade === "OUTRA CIDADE" || !atendidas.has(cidade)) {
      setWhatsappEnabled(false);
      setShowModal(true);
      return;
    }
    setWhatsappEnabled(true);
  };

  const trackWhatsApp = () => {
    try {
      if (window.fbq) {
        window.fbq('trackCustom', 'ConversaIniciada');
      }
    } catch (e) {}
  };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        <meta name="theme-color" content="#030814" />
        <meta name="description" content="LP oficial — escolha sua cidade e libere o atendimento exclusivo no WhatsApp." />
        <title>Simulação de Empréstimo | Atendimento via WhatsApp</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)
              }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','2006224949946315');
              fbq('track','PageView');
            `
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2006224949946315&ev=PageView&noscript=1" alt="" />
        </noscript>
      </Head>

      <div className={styles.shell}>
        <div className={styles.content}>
          <header className={styles.hero} role="banner">
            <div className={styles.heroLeft}>
              <div className={styles.heroPill}>
                <i className="fa-solid fa-sparkles"></i>
                Linha exclusiva Creditop
              </div>
              <p className={styles.heroSubtitle}>Empréstimo sofisticado para você</p>
              <p className={styles.heroLead}>
                Atuamos como concierge financeiro: analisamos o seu cenário, apresentamos as melhores condições e
                conduzimos toda a assinatura dentro de um fluxo seguro via WhatsApp.
              </p>
              <ul className={styles.heroHighlights} aria-label="Diferenciais imediatos">
                <li><span>Especialistas certificados</span> acompanham cada etapa da simulação.</li>
                <li><span>Taxas transparentes</span> e aprovadas somente após sua confirmação.</li>
                <li><span>Checklist guiado</span> para documentos e assinatura digital sem fricção.</li>
              </ul>
              <ul className={styles.heroStats} aria-label="Indicadores de confiança">
                <li>
                  <strong>+2.500</strong>
                  <span>Contratos aprovados</span>
                </li>
                <li>
                  <strong>94%</strong>
                  <span>Clientes que indicam</span>
                </li>
                <li>
                  <strong>24h</strong>
                  <span>Média de liberação</span>
                </li>
              </ul>
              <figure className={styles.heroFigure}>
                <img src="https://i.ibb.co/ksqFfYt9/credito-top.jpg" alt="Marca Creditop - Empréstimo Sofisticado" />
                <figcaption>Escudo Creditop • Confiança & Crescimento</figcaption>
              </figure>
            </div>

            <aside className={styles.heroRight}>
              <div className={styles.heroPanel} aria-label="Seleção de cidade e WhatsApp">
                <div className={styles.panelHead}>
                  <span><i className="fa-solid fa-location-dot"></i> Malha de atendimento</span>
                  <h2>Qual cidade você mora?</h2>
                </div>
                <p className={styles.panelNote}>Quando a cidade é confirmada, o link direto com um especialista é liberado.</p>
                <div className={styles.cityGrid} role="group" aria-label="Lista de cidades atendidas">
                  {cidades.map((cidade) => (
                    <button
                      key={cidade}
                      type="button"
                      className={`${styles.cityBtn} ${selectedCity === cidade ? styles.selected : ''}`}
                      onClick={() => handleCityClick(cidade)}
                    >
                      <span className={styles.label}>{cidade}</span>
                      <span className={styles.dot} aria-hidden="true"></span>
                    </button>
                  ))}
                </div>
                <button
                  className={styles.cityLink}
                  type="button"
                  onClick={() => handleCityClick("OUTRA CIDADE")}
                >
                  Minha cidade não está na lista
                </button>
                <div className={styles.cta}>
                  <a
                    href={whatsappEnabled ? whatsappLink : undefined}
                    className={`${styles.btn} ${styles.btnWhats} ${!whatsappEnabled ? styles.btnDisabled : styles.active}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackWhatsApp}
                    aria-disabled={!whatsappEnabled}
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                    Falar no WhatsApp
                  </a>
                  <small>Atendimento humano e sigiloso.</small>
                </div>
              </div>
            </aside>
          </header>

          <main>
            <section aria-labelledby="benefits">
              <div className={styles.sectionHead}>
                <h2 id="benefits">Por que escolher nossa equipe</h2>
                <p>Experiência boutique para quem busca crédito com discrição, velocidade e acompanhamento especializado até o PIX cair na sua conta.</p>
              </div>
              <div className={styles.features}>
                <article className={styles.featureCard}>
                  <i className="fa-solid fa-shield-heart"></i>
                  <h3>Proteção total</h3>
                  <p>Documentos validados com segurança digital e equipe treinada para garantir confidencialidade.</p>
                </article>
                <article className={styles.featureCard}>
                  <i className="fa-solid fa-person-chalkboard"></i>
                  <h3>Especialista dedicado</h3>
                  <p>Você fala com uma pessoa real que guia cada etapa da simulação até a assinatura.</p>
                </article>
                <article className={styles.featureCard}>
                  <i className="fa-solid fa-bolt"></i>
                  <h3>Liberação ágil</h3>
                  <p>Processos digitalizados que aceleram análise e desembolso, sem filas e sem complicação.</p>
                </article>
                <article className={styles.featureCard}>
                  <i className="fa-solid fa-mobile-screen"></i>
                  <h3>WhatsApp first</h3>
                  <p>Todo o fluxo acontece no aplicativo que você já usa, com registros para consultar quando quiser.</p>
                </article>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="steps">
              <div className={styles.sectionHead}>
                <h2 id="steps">Como funciona na prática</h2>
                <p>Transparência em cada etapa, com status atualizado e um especialista ao seu lado.</p>
              </div>
              <div className={styles.timeline}>
                <article className={styles.step}>
                  <span>1</span>
                  <h3>Selecione a cidade</h3>
                  <p>Confirmamos se sua região já está ativa. Caso não esteja, você recebe o aviso e entra na fila de expansão.</p>
                </article>
                <article className={styles.step}>
                  <span>2</span>
                  <h3>Conversa no WhatsApp</h3>
                  <p>Especialista faz as perguntas essenciais e monta a simulação sob medida para seu perfil.</p>
                </article>
                <article className={styles.step}>
                  <span>3</span>
                  <h3>Envio de documentos</h3>
                  <p>Upload guiado com checklist simples. Tudo conferido e protegido com autenticação.</p>
                </article>
                <article className={styles.step}>
                  <span>4</span>
                  <h3>Assinatura e PIX</h3>
                  <p>Contrato digital, assinatura segura e liberação do valor imediatamente após aprovação.</p>
                </article>
              </div>
            </section>

            <section className={styles.proof} aria-labelledby="proof">
              <div className={styles.testimonial}>
                <div className={styles.sectionHead} style={{ marginBottom: '18px' }}>
                  <h2 id="proof">Voz de quem já recebeu</h2>
                </div>
                <blockquote className={styles.blockquote}>
                  "Quando selecionei minha cidade, em menos de 5 minutos já estava conversando com a equipe. Me explicaram taxas, me ajudaram com os documentos e o PIX bateu no mesmo dia."
                  <footer>— Juliana P., Juatuba</footer>
                </blockquote>
              </div>
              <div className={styles.numbers} aria-label="Indicadores">
                <div>
                  <strong>94%</strong>
                  <span>Satisfação média nos atendimentos</span>
                </div>
                <div>
                  <strong>R$ 12 mi</strong>
                  <span>Em crédito liberado em 2024</span>
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

            <section className={styles.section} aria-labelledby="faq">
              <div className={styles.sectionHead}>
                <h2 id="faq">Perguntas frequentes</h2>
                <p>Informações rápidas para você começar agora mesmo.</p>
              </div>
              <div className={styles.faq}>
                <details className={styles.details}>
                  <summary className={styles.summary}>Os dados enviados ficam seguros?</summary>
                  <p>Sim. Utilizamos armazenamento criptografado e acesso restrito à equipe responsável. Todos os dados podem ser excluídos mediante solicitação.</p>
                </details>
                <details className={styles.details}>
                  <summary className={styles.summary}>Existe algum custo para simular?</summary>
                  <p>Não. A análise é 100% gratuita e somente seguimos para assinatura se você aprovar as condições.</p>
                </details>
                <details className={styles.details}>
                  <summary className={styles.summary}>Quais documentos preciso ter em mãos?</summary>
                  <p>Documento oficial com foto, comprovante de renda e comprovante de residência atualizado. Caso precise de algo extra, avisaremos durante o atendimento.</p>
                </details>
                <details className={styles.details}>
                  <summary className={styles.summary}>E se a minha cidade ainda não estiver disponível?</summary>
                  <p>Mostramos um aviso e registramos seu interesse para priorizar a expansão. Assim que liberarmos, você recebe uma mensagem automática no WhatsApp.</p>
                </details>
              </div>
            </section>
          </main>

          <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} Atendimento via WhatsApp. Todos os direitos reservados.</span>
          </footer>
        </div>
      </div>

      <div className={`${styles.modal} ${showModal ? styles.active : ''}`} role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalMessage">
        <div className={styles.modalBox}>
          <h2 id="modalTitle">Aviso importante</h2>
          <p id="modalMessage">No Momento Não Estamos Atuando Na Cidade Selecionada, Mas Breve iremos chegar Na Sua Cidade</p>
          <div className={styles.modalActions}>
            <button className={styles.modalBtn} type="button" onClick={() => setShowModal(false)}>
              Entendi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
