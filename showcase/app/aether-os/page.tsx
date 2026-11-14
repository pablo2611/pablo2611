import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AETHER OS — Pablo Sánchez',
  description: 'Panel educativo de ciberseguridad defensiva con fuentes abiertas.',
  authors: [{ name: 'Pablo Sánchez', url: 'https://github.com/pablo2611' }],
};

const source = 'https://github.com/pablo2611/pablo2611/tree/main/projects/aether-os';

export default function AetherProject() {
  return (
    <main className="portfolio">
      <nav className="topbar" aria-label="Navegación">
        <a className="signature" href="/pablo2611/">Pablo Sánchez</a>
        <a className="github-link" href={source}>Código y README</a>
      </nav>
      <header className="dashboard-intro">
        <p>Proyecto de Pablo Sánchez · @pablo2611</p>
        <h1>AETHER OS</h1>
        <p>Panel educativo de ciberseguridad defensiva con datos públicos.</p>
        <nav aria-label="Idioma"><a href="#espanol">Español</a> · <a href="#english">English</a></nav>
      </header>
      <section id="espanol" className="projects" aria-labelledby="titulo-es">
        <h2 id="titulo-es">Español</h2>
        <p>Explora actividad reportada por SANS ISC y abuse.ch, consulta vulnerabilidades del catálogo CISA KEV y calcula hashes localmente. Los destinos de las animaciones del mapa son ilustrativos.</p>
        <p>Para ejecutar el panel interactivo, sigue las instrucciones del <a href={source + '#desarrollo-local--local-development'}>README</a>.</p>
      </section>
      <section id="english" lang="en" className="projects" aria-labelledby="title-en">
        <h2 id="title-en">English</h2>
        <p>Explore activity reported by SANS ISC and abuse.ch, browse the CISA KEV catalog, and calculate hashes locally. Animated map destinations are illustrative.</p>
        <p>To run the interactive dashboard, follow the <a href={source + '#desarrollo-local--local-development'}>README</a>.</p>
      </section>
    </main>
  );
}
