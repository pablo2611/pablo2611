import { ArrowUpRight, Bot, BrainCircuit, Boxes, Code2, Server } from 'lucide-react';

type StationId = 'telegram' | 'runtime' | 'intelligence' | 'flows' | 'infrastructure' | 'web';

type Station = {
  id: StationId;
  title: string;
  label: string;
  detail: string;
  href: string;
  action: string;
  icon: typeof Bot;
};

const stations: Station[] = [
  {
    id: 'telegram',
    title: 'Conversaciones que activan trabajo',
    label: 'Telegram / bots',
    detail: 'Mensajes, comandos y notificaciones conectados a servicios reales mediante webhooks.',
    href: 'https://github.com/pablo2611?tab=repositories',
    action: 'Ver proyectos de automatización',
    icon: Bot,
  },
  {
    id: 'runtime',
    title: 'Lógica que no se detiene',
    label: 'Python / runtime',
    detail: 'Procesos asíncronos, tareas y servicios preparados para sostener el flujo detrás de una interfaz simple.',
    href: 'https://github.com/pablo2611?tab=repositories',
    action: 'Explorar repositorios',
    icon: Boxes,
  },
  {
    id: 'intelligence',
    title: 'IA con contexto y propósito',
    label: 'APIs de IA',
    detail: 'Herramientas, contexto y respuestas conectadas a las decisiones que el producto realmente necesita tomar.',
    href: 'https://github.com/pablo2611?tab=repositories',
    action: 'Ver integraciones',
    icon: BrainCircuit,
  },
  {
    id: 'flows',
    title: 'Procesos que se coordinan',
    label: 'n8n / flujos',
    detail: 'Eventos y webhooks que unen servicios sin convertir cada tarea repetida en trabajo manual.',
    href: 'https://github.com/pablo2611?tab=repositories',
    action: 'Ver automatizaciones',
    icon: Boxes,
  },
  {
    id: 'infrastructure',
    title: 'Una operación estable',
    label: 'Linux / VPS',
    detail: 'Despliegue, Docker, Nginx, observabilidad y mantenimiento para que la experiencia se sostenga en producción.',
    href: 'https://github.com/pablo2611/serverdock',
    action: 'Abrir ServerDock',
    icon: Server,
  },
  {
    id: 'web',
    title: 'Interfaces con intención',
    label: 'React / Three.js',
    detail: 'Experiencias web donde interacción, ritmo y rendimiento llevan la misma dirección.',
    href: 'https://pablo2611.github.io/aerion/',
    action: 'Explorar AERION',
    icon: Code2,
  },
];

function RouteMap() {
  return (
    <svg className="field-map" viewBox="0 0 1000 540" role="img" aria-labelledby="field-map-title field-map-description" preserveAspectRatio="none">
      <title id="field-map-title">Mapa de sistemas de Pablo Sánchez</title>
      <desc id="field-map-description">Una topología que conecta Telegram, Python, APIs de IA, flujos, servidores Linux y experiencias web.</desc>
      <g className="map-rulers" aria-hidden="true">
        <path d="M48 72H952M48 270H952M48 468H952" />
        <path d="M118 38V502M376 38V502M624 38V502M882 38V502" />
      </g>
      <g className="map-routes" aria-hidden="true">
        <path className="route route--telegram" d="M142 171C226 171 258 132 348 132" />
        <path className="route route--runtime" d="M440 132C520 132 550 182 634 182" />
        <path className="route route--intelligence" d="M730 182C790 182 804 128 872 128" />
        <path className="route route--flows" d="M142 171C226 248 238 368 342 398" />
        <path className="route route--infrastructure" d="M438 398C546 398 560 128 872 128" />
        <path className="route route--web" d="M438 132C520 242 550 404 634 404" />
      </g>
      <g className="map-waypoints" aria-hidden="true">
        <circle cx="142" cy="171" r="8" />
        <circle cx="394" cy="132" r="8" />
        <circle cx="682" cy="182" r="8" />
        <circle cx="906" cy="128" r="8" />
        <circle cx="394" cy="398" r="8" />
        <circle cx="682" cy="404" r="8" />
      </g>
      <line className="map-scanner" x1="48" y1="0" x2="48" y2="540" aria-hidden="true" />
    </svg>
  );
}

export function SystemField({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`system-field ${compact ? 'system-field--compact' : ''}`} aria-label={compact ? 'Mapa de especialidades' : undefined} aria-labelledby={compact ? undefined : 'systems-title'}>
      {!compact && (
        <div className="field-intro">
          <div>
            <h2 id="systems-title">Una idea viaja mejor cuando cada capa sabe qué hacer.</h2>
            <p>Explora las partes de un mismo sistema: conversación, lógica, inteligencia, flujos, infraestructura y experiencia.</p>
          </div>
          <label className="motion-switch"><input type="checkbox" className="motion-pause" /> Pausar animación</label>
        </div>
      )}

      <div className="field-canvas">
        <RouteMap />
        <div className="field-stations" aria-label="Áreas de especialidad">
          {stations.map((station) => {
            const Icon = station.icon;
            return (
              <div key={station.id} className={`field-option field-option--${station.id}`}>
                <input
                  className="station-input"
                  id={`station-${station.id}`}
                  name={compact ? 'preview-system-focus' : 'system-focus'}
                  type="radio"
                  defaultChecked={station.id === 'telegram'}
                />
                <label
                className={`field-station field-station--${station.id}`}
                htmlFor={`station-${station.id}`}
                >
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{station.label}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="field-reading">
        {stations.map((station) => (
          <article className={`field-note field-note--${station.id}`} key={station.id}>
            <div>
              <p>{station.label}</p>
              <h3>{station.title}</h3>
              <span>{station.detail}</span>
            </div>
            <a href={station.href}>
              {station.action}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
