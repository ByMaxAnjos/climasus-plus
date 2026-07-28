import { useEffect, useState } from 'react'
import { usePipeline, type Lang } from '../store/pipeline'
import { t } from '../i18n'

type Localized = Record<Lang, string>

type AboutSection = {
  title: Localized
  body: Record<Lang, string[]>
}

type TeamMember = {
  name: string
  role: Localized
  institution: string
  email: string
  photo: string
  github?: string
  linkedin?: string
}

const sections: AboutSection[] = [
  {
    title: {
      pt: 'O que é o climasus+',
      en: 'What climasus+ is',
      es: 'Qué es climasus+',
    },
    body: {
      pt: [
        'O climasus+ é o estúdio desktop do ecossistema climaSUS para construir análises reprodutíveis em saúde, clima e ambiente sem começar pelo código.',
        'A interface organiza funções do climasus4r em pipelines visuais: o usuário importa dados do DATASUS, integra exposições climáticas e ambientais, executa modelos, visualiza resultados e exporta scripts em R para auditoria e reprodução.',
      ],
      en: [
        'climasus+ is the desktop studio in the climaSUS ecosystem for building reproducible health, climate and environmental analyses without starting from code.',
        'The interface organizes climasus4r functions into visual pipelines: users import DATASUS data, integrate climate and environmental exposures, run models, view results and export R scripts for audit and reproduction.',
      ],
      es: [
        'climasus+ es el estudio de escritorio del ecosistema climaSUS para construir análisis reproducibles de salud, clima y ambiente sin comenzar por el código.',
        'La interfaz organiza funciones de climasus4r en pipelines visuales: el usuario importa datos de DATASUS, integra exposiciones climáticas y ambientales, ejecuta modelos, visualiza resultados y exporta scripts en R para auditoría y reproducción.',
      ],
    },
  },
  {
    title: {
      pt: 'Como está estruturado',
      en: 'How it is structured',
      es: 'Cómo está estructurado',
    },
    body: {
      pt: [
        'O app combina uma camada visual em React/Tauri, um motor R local e o pacote climasus4r. Essa arquitetura mantém os dados e execuções no computador do usuário, favorecendo transparência, reprodutibilidade e uso em oficinas ou ambientes com conectividade limitada.',
        'O climasus+ se conecta aos demais produtos do climaSUS: o climasus4r fornece as funções analíticas e o climasusDB organiza datasets publicados para exploração, documentação e reuso.',
      ],
      en: [
        'The app combines a React/Tauri visual layer, a local R engine and the climasus4r package. This architecture keeps data and execution on the user machine, supporting transparency, reproducibility and use in workshops or limited-connectivity settings.',
        'climasus+ connects to the wider climaSUS ecosystem: climasus4r provides the analytical functions and climasusDB organizes published datasets for exploration, documentation and reuse.',
      ],
      es: [
        'La aplicación combina una capa visual en React/Tauri, un motor R local y el paquete climasus4r. Esta arquitectura mantiene los datos y la ejecución en la computadora del usuario, favoreciendo transparencia, reproducibilidad y uso en talleres o contextos con conectividad limitada.',
        'climasus+ se conecta con los demás productos de climaSUS: climasus4r provee las funciones analíticas y climasusDB organiza datasets publicados para exploración, documentación y reutilización.',
      ],
    },
  },
  {
    title: {
      pt: 'Instituições, financiamento e colaboração',
      en: 'Institutions, funding and collaboration',
      es: 'Instituciones, financiación y colaboración',
    },
    body: {
      pt: [
        'O climasus+ é parte do climaSUS e do Centro de Clima de Saúde de Rondônia, com desenvolvimento articulado à Fiocruz Rondônia e ao INCT-Conexão.',
        'O desenvolvimento é financiado pelo INCT-Conexão e aberto a colaborações de pesquisadores, gestores, desenvolvedores e comunicadores científicos que atuam na interface entre clima, ambiente e saúde.',
      ],
      en: [
        'climasus+ is part of climaSUS and the Rondônia Health Climate Center, with development connected to Fiocruz Rondônia and INCT-Conexão.',
        'Development is funded by INCT-Conexão and open to collaboration with researchers, public managers, developers and science communicators working at the climate, environment and health interface.',
      ],
      es: [
        'climasus+ forma parte de climaSUS y del Centro de Clima de Salud de Rondônia, con desarrollo articulado con Fiocruz Rondônia e INCT-Conexão.',
        'El desarrollo es financiado por INCT-Conexão y está abierto a colaboraciones de investigadores, gestores, desarrolladores y comunicadores científicos que trabajan en la interfaz entre clima, ambiente y salud.',
      ],
    },
  },
]

const team: TeamMember[] = [
  {
    name: 'Dr. Max Anjos',
    role: {
      pt: 'Coordenação · Mantenedor',
      en: 'Coordination · Maintainer',
      es: 'Coordinación · Mantenedor',
    },
    institution: 'UFJF · Fiocruz-RO (CCSRO) · INCT-Conexão',
    email: 'max.anjos@campus.ul.pt',
    photo: '/team/max-anjos.jpg',
    github: 'https://github.com/ByMaxAnjos',
    linkedin: 'https://linkedin.com/in/maxanjos',
  },
  {
    name: 'Marlon Resende Faria',
    role: {
      pt: 'Desenvolvedor sênior R/Python',
      en: 'Senior R/Python developer',
      es: 'Desarrollador senior R/Python',
    },
    institution: 'Universidade de São Paulo (USP)',
    email: 'marlon.faria@usp.br',
    photo: '/team/marlon-faria.jpg',
    github: 'https://github.com/MarlonRF',
    linkedin: 'https://www.linkedin.com/in/marlon-f-881159113',
  },
  {
    name: 'Thauã Menezes',
    role: {
      pt: 'Desenvolvedor associado R/Python · Comunicação científica',
      en: 'Associate R/Python developer · Science communication',
      es: 'Desarrollador asociado R/Python · Comunicación científica',
    },
    institution: 'UNESP · Universidade Federal de Rondônia (UNIR)',
    email: 'thaua.menezes@unesp.br',
    photo: '/team/thaua-menezes.png',
    github: 'https://github.com/thauamenezez',
  },
  {
    name: 'Andrey Araújo',
    role: {
      pt: 'Desenvolvedor associado R/Python',
      en: 'Associate R/Python developer',
      es: 'Desarrollador asociado R/Python',
    },
    institution: 'Fundação Oswaldo Cruz Rondônia',
    email: 'andreyke.araujo@gmail.com',
    photo: '/team/andrey-araujo.jpg',
  },
  {
    name: 'Nathalia A. Franqlin',
    role: {
      pt: 'Desenvolvedora associada · Comunicação científica',
      en: 'Associate developer · Science communication',
      es: 'Desarrolladora asociada · Comunicación científica',
    },
    institution: 'UNESP',
    email: 'n.franqlin@unesp.br',
    photo: '/team/nathalia-franqlin.jpg',
  },
]

const labels: Record<Lang, {
  eyebrow: string
  title: string
  lede: string
  teamTitle: string
  teamBody: string
  links: string
}> = {
  pt: {
    eyebrow: 'Centro de Clima de Saúde de Rondônia · INCT-Conexão',
    title: 'Sobre o climasus+',
    lede: 'Um ambiente local e visual para montar, executar e compartilhar análises reprodutíveis na interface entre clima, ambiente e saúde pública.',
    teamTitle: 'Equipe do núcleo',
    teamBody: 'Pesquisadores, desenvolvedores e comunicadores científicos envolvidos no desenvolvimento do ecossistema climaSUS.',
    links: 'Contatos e perfis',
  },
  en: {
    eyebrow: 'Rondônia Health Climate Center · INCT-Conexão',
    title: 'About climasus+',
    lede: 'A local, visual environment for building, running and sharing reproducible analyses at the climate, environment and public health interface.',
    teamTitle: 'Core team',
    teamBody: 'Researchers, developers and science communicators involved in the development of the climaSUS ecosystem.',
    links: 'Contacts and profiles',
  },
  es: {
    eyebrow: 'Centro de Clima de Salud de Rondônia · INCT-Conexão',
    title: 'Acerca de climasus+',
    lede: 'Un ambiente local y visual para montar, ejecutar y compartir análisis reproducibles en la interfaz entre clima, ambiente y salud pública.',
    teamTitle: 'Equipo central',
    teamBody: 'Investigadores, desarrolladores y comunicadores científicos involucrados en el desarrollo del ecosistema climaSUS.',
    links: 'Contactos y perfiles',
  },
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function TeamPhoto({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className="about-team-photo about-team-photo-fallback" aria-label={member.name}>{initials(member.name)}</div>
  return <img className="about-team-photo" src={member.photo} alt={member.name} loading="lazy" onError={() => setFailed(true)} />
}

export default function AboutPanel() {
  const { aboutOpen, closeAbout, lang } = usePipeline()

  useEffect(() => {
    if (!aboutOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAbout()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aboutOpen, closeAbout])

  if (!aboutOpen) return null
  const copy = labels[lang]

  return (
    <div className="about-backdrop" onClick={closeAbout}>
      <div className="about-panel glass" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={(e) => e.stopPropagation()}>
        <div className="about-head">
          <div>
            <p className="about-eyebrow">{copy.eyebrow}</p>
            <h2 id="about-title">{copy.title}</h2>
            <p className="about-lede">{copy.lede}</p>
          </div>
          <button className="tutorial-close" title={t('close', lang)} onClick={closeAbout}>✕</button>
        </div>

        <div className="about-section-grid">
          {sections.map((section) => (
            <section key={section.title.pt} className="about-section">
              <h3>{section.title[lang]}</h3>
              {section.body[lang].map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <section className="about-section about-team-section">
          <h3>{copy.teamTitle}</h3>
          <p>{copy.teamBody}</p>
          <div className="about-team-list">
            {team.map((member) => (
              <article key={member.name} className="about-team-profile">
                <TeamPhoto member={member} />
                <div className="about-team-copy">
                  <h4>{member.name}</h4>
                  <p className="about-team-role">{member.role[lang]}</p>
                  <p className="about-team-institution">{member.institution}</p>
                  <div className="about-team-links" aria-label={copy.links}>
                    <a href={`mailto:${member.email}`}>{member.email}</a>
                    {member.github && <a href={member.github} target="_blank" rel="noreferrer">GitHub</a>}
                    {member.linkedin && <a href={member.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
