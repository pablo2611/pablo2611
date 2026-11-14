import { Github, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { creator } from '@/lib/creator';
import { protections } from './guide-view';

function Avatar({ size = 32 }: { size?: number }) {
  if (creator.githubUser) return <img src={`https://github.com/${creator.githubUser}.png?size=${size * 2}`} alt={`Avatar de ${creator.name}`} width={size} height={size} className="avatar" />;
  const initials = creator.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  return <span className="avatar avatar-initials" style={{ width: size, height: size }}>{initials}</span>;
}

export function CreatorCard() {
  return (
    <section className="panel creator-card">
      <div className="panel-heading"><span><Github size={14} /> Creador</span></div>
      <div className="panel-body stack-sm">
        <div className="creator-row"><Avatar size={48} /><div><strong>{creator.name}</strong><p className="muted small">{creator.role}</p>{creator.githubUser && <a className="small" href={`https://github.com/${creator.githubUser}`} target="_blank" rel="noreferrer">github.com/{creator.githubUser}</a>}</div></div>
        <p className="muted small">Proyecto educativo de ciberseguridad defensiva construido con datos abiertos.</p>
      </div>
    </section>
  );
}

export function CreatorCorner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="creator-corner">
      {open && (
        <div className="creator-pop" role="dialog" aria-label="Acerca del creador y de la app">
          <button className="pop-close" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={14} /></button>
          <div className="creator-row"><Avatar size={40} /><div><strong>{creator.name}</strong><p className="muted small">{creator.role}</p></div></div>
          <p className="small">AETHER OS muestra en vivo de dónde vienen los ataques en internet, qué vulnerabilidades se están explotando y cómo responder, usando fuentes públicas y gratuitas.</p>
          <p className="micro muted"><ShieldCheck size={12} /> Lo más importante</p>
          <ul className="steps small">{protections.slice(0, 4).map((p) => <li key={p.title}>{p.title}</li>)}</ul>
          {creator.githubUser ? <a className="gh-link" href={`https://github.com/${creator.githubUser}`} target="_blank" rel="noreferrer"><Github size={14} /> Ver perfil en GitHub</a> : null}
        </div>
      )}
      <button className="creator-badge" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Creado por ${creator.name}. Ver información`}>
        <Github size={15} /><Avatar size={22} /><span>{creator.name}</span>
      </button>
    </div>
  );
}
