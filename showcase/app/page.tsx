import { ArrowUpRight, Github, MapPin } from 'lucide-react';
import { SystemField } from '@/components/system-field';

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

      <header className="intro">
        <h1>Lo complejo por dentro.<br /><span>Claro para quien lo usa.</span></h1>
        <div>
          <p>Arquitectura, automatización e interfaces pensadas como una sola experiencia.</p>
          <a href="https://github.com/pablo2611?tab=repositories">Ver proyectos <ArrowUpRight size={17} aria-hidden="true" /></a>
        </div>
      </header>

      <SystemField />

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
