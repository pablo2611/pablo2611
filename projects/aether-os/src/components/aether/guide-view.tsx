import { ExternalLink } from 'lucide-react';
import { CreatorCard } from './creator-corner';

export const protections = [
  { title: 'Parchea primero lo que ya se explota', text: 'Prioriza las vulnerabilidades del catálogo CISA KEV: tienen explotación confirmada. Mantén un inventario de software y aplica parches críticos en días, no meses.' },
  { title: 'MFA resistente al phishing', text: 'La mayoría de intrusiones empiezan con credenciales robadas. Activa MFA en VPN, correo y paneles de administración; prefiere llaves FIDO2 o passkeys.' },
  { title: 'No expongas servicios de administración', text: 'SSH (22), RDP (3389), Telnet (23) y bases de datos son los puertos más atacados. Ponlos detrás de VPN o listas de IP permitidas y desactiva el acceso con contraseña.' },
  { title: 'Copias de seguridad 3-2-1 inmutables', text: 'Contra el ransomware: tres copias, dos medios, una fuera de línea o inmutable. Prueba restaurar periódicamente; los atacantes borran las copias de sombra.' },
  { title: 'Segmenta la red', text: 'Separa usuarios, servidores y sistemas críticos. Así un equipo comprometido no alcanza el controlador de dominio ni las copias de seguridad.' },
  { title: 'Registra y vigila', text: 'Centraliza logs (EDR, firewall, autenticación) y conserva al menos 90 días. Sin registros no hay investigación posible.' },
  { title: 'Bloquea la comunicación con botnets', text: 'Filtra el tráfico saliente hacia servidores C2 conocidos (abuse.ch, Spamhaus). Un equipo infectado que no puede llamar a casa causa menos daño.' },
  { title: 'Protección DDoS y DNS', text: 'Usa un proveedor con mitigación DDoS, limita la tasa de peticiones y protege tus registros DNS con bloqueo de registrador y DNSSEC.' },
  { title: 'Plan de respuesta ensayado', text: 'Define quién decide, cómo aislar equipos y a quién avisar (legal, clientes, autoridades). Sigue la guía NIST SP 800-61 y practícala con simulacros.' },
];

export const sources = [
  { name: 'SANS Internet Storm Center (DShield)', url: 'https://isc.sans.edu/api/', use: 'IPs atacantes, puertos atacados, nivel Infocon y noticias. Gratis, sin clave.' },
  { name: 'abuse.ch Feodo Tracker', url: 'https://feodotracker.abuse.ch/', use: 'Servidores de control de botnets (Emotet, QakBot, etc.). Gratis.' },
  { name: 'CISA Known Exploited Vulnerabilities', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', use: 'Catálogo oficial de vulnerabilidades explotadas. Dominio público.' },
  { name: 'ip-api.com', url: 'https://ip-api.com/', use: 'Geolocalización de IPs para ubicarlas en el mapa. Gratis para uso no comercial.' },
  { name: 'Where the ISS at?', url: 'https://wheretheiss.at/', use: 'Posición en vivo de la Estación Espacial Internacional.' },
  { name: 'Cloudflare DNS over HTTPS', url: 'https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/', use: 'Consultas DNS reales desde la terminal.' },
  { name: 'Esri World Imagery · NASA GIBS · OpenStreetMap', url: 'https://gibs.earthdata.nasa.gov/', use: 'Imágenes satelitales, luces nocturnas y cartografía.' },
  { name: 'Natural Earth / world-atlas', url: 'https://github.com/topojson/world-atlas', use: 'Fronteras de todos los países del mapa. Dominio público.' },
  { name: 'NVD (NIST)', url: 'https://nvd.nist.gov/', use: 'Detalle técnico de cada CVE.' },
];

export function GuideView() {
  return (
    <div className="stack">
      <div className="split">
        <section className="panel">
          <div className="panel-heading"><span>Sobre AETHER OS</span></div>
          <div className="panel-body stack-sm about-text">
            <p><strong>AETHER OS</strong> es un centro de operaciones de ciberseguridad en el navegador. Reúne en un solo lugar datos públicos y reales sobre la actividad maliciosa en internet para aprender a leerlos y a defenderse.</p>
            <p>El mapa colorea cada país según las IP atacantes reportadas por miles de sensores de SANS ISC y los servidores de botnets de abuse.ch. Las líneas animadas salen del origen real de atacantes elegidos al azar y vuelan hacia países aleatorios: las fuentes públicas no revelan a quién atacó cada IP, así que el destino es ilustrativo.</p>
            <p>Las herramientas criptográficas, la terminal y el inspector de tráfico funcionan de verdad en tu navegador. El evaluador usa IA para proponer gravedad y pasos de contención; siempre debe revisarlo un analista.</p>
          </div>
        </section>
        <CreatorCard />
      </div>
      <section className="panel">
        <div className="panel-heading"><span>Lo importante para protegerse de estos ataques</span></div>
        <div className="guide-grid">{protections.map((p, i) => <article key={p.title} className="guide-card"><span className="micro muted">{String(i + 1).padStart(2, '0')}</span><h3>{p.title}</h3><p className="muted small">{p.text}</p></article>)}</div>
      </section>
      <section className="panel">
        <div className="panel-heading"><span>Fuentes gratuitas utilizadas</span></div>
        <ul className="source-list">{sources.map((s) => <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer">{s.name}<ExternalLink size={12} /></a><span className="muted small">{s.use}</span></li>)}</ul>
      </section>
    </div>
  );
}
