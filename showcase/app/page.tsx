import { ArrowUpRight, Github, MapPin } from 'lucide-react';

import { SpotlightCard } from '../components/spotlight-card';

const experiences = [
  {
    id: 'aerion',
    name: 'AERION',
    description: 'Conducción 3D, personalización de color y sonido.',
    spotlight: '#5fc9ef55',
  },
  {
    id: 'otro-plano',
    name: 'Otro Plano',
    description: 'Escultura digital, diseño y cine en una experiencia inmersiva.',
    spotlight: '#ee89b355',
  },
];

export default function Home() {
  return (
    <main className="portfolio">
      <nav className="topbar" aria-label="Navegación principal">
        <a className="signature" href="https://github.com/pablo2611">
          Pablo Sánchez
          <span><MapPin size={13} aria-hidden="true" /> Panamá</span>
        </a>
        <a className="github-link" href="https://github.com/pablo2611">
          <Github size={17} aria-hidden="true" /> GitHub <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </nav>

      <header className="dashboard-intro">
        <h1 className="sr-only">Pablo Sánchez — Ideas conectadas. Sistemas que responden.</h1>
        <img src="/pablo2611/dashboard/hero.svg" width="880" height="230" alt="Pablo Sánchez. Ideas conectadas. Sistemas que responden. Panamá · Python · Linux VPS · experiencias web." />
      </header>

      <section className="dashboard-section" aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading">Ingeniería en movimiento</h2>
        <div className="dashboard-grid">
          <a href="https://github.com/pablo2611?tab=overview" aria-label="Ver actividad en GitHub"><img src="/pablo2611/dashboard/stats.svg" width="440" height="230" alt="Actividad real y repositorios públicos de Pablo" /></a>
          <a href="https://github.com/pablo2611?tab=repositories" aria-label="Explorar repositorios y lenguajes"><img src="/pablo2611/dashboard/languages.svg" width="440" height="240" alt="Distribución real de lenguajes en repositorios propios" /></a>
          <a href="https://github.com/pablo2611?tab=overview" aria-label="Ver contribuciones recientes"><img src="/pablo2611/dashboard/activity.svg" width="440" height="230" alt="Gráfica de contribuciones durante el último mes" /></a>
          <a href="https://github.com/pablo2611?tab=repositories" aria-label="Explorar proyectos de automatización"><img src="/pablo2611/dashboard/skills.svg" width="440" height="230" alt="Telegram, Python, IA, Linux, n8n y React" /></a>
        </div>
        <p className="dashboard-source">Datos públicos de GitHub · actualización cada seis horas · lenguajes por tamaño de código en repositorios propios.</p>
      </section>

      <section id="experiencias" className="experience-section" aria-labelledby="experiences-title">
        <h2 id="experiences-title">Experiencias interactivas</h2>
        <div className="experience-grid">
          {experiences.map(({ id, name, description, spotlight }) => (
            <SpotlightCard key={id} color={spotlight}>
              <img src={`/pablo2611/experiencias/${id}.jpg`} alt="" width="1280" height="720" loading="lazy" />
              <div className="experience-copy">
                <h3>{name}</h3>
                <p>{description}</p>
                <div className="experience-actions">
                  <a href={`https://pablo2611.github.io/${id}/`} aria-label={`Abrir demo de ${name}`}>Abrir demo</a>
                  <a href={`https://github.com/pablo2611/${id}`} aria-label={`Ver código de ${name}`}>Ver código</a>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className="projects" aria-labelledby="projects-title">
        <h2 id="projects-title">Infraestructura</h2>
        <div>
          <a href="https://github.com/pablo2611/serverdock">
            <strong>ServerDock</strong>
            <span>Infraestructura y servicios</span>
          </a>
        </div>
      </section>

      <footer>
        <span>Diseño + ingeniería desde Panamá.</span>
        <a href="https://github.com/pablo2611">Ver el perfil completo <ArrowUpRight size={14} aria-hidden="true" /></a>
      </footer>
    </main>
  );
}
