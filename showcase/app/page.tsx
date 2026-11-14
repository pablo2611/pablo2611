import { ArrowUpRight, Github, MapPin } from 'lucide-react';

const projects = [
  { name: 'ServerDock', type: 'Infraestructura y servicios', href: 'https://github.com/pablo2611/serverdock' },
  { name: 'AERION', type: 'Experiencia automotriz 3D', href: 'https://pablo2611.github.io/aerion/' },
  { name: 'Otro Plano', type: 'Diseño y exploración visual', href: 'https://pablo2611.github.io/otro-plano/' },
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

      <section className="projects" aria-labelledby="projects-title">
        <h2 id="projects-title">Trabajo seleccionado</h2>
        <div>
          {projects.map((project) => (
            <a key={project.name} href={project.href}>
              <strong>{project.name}</strong>
              <span>{project.type}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <footer>
        <span>Diseño + ingeniería desde Panamá.</span>
        <a href="https://github.com/pablo2611">Ver el perfil completo <ArrowUpRight size={14} aria-hidden="true" /></a>
      </footer>
    </main>
  );
}
