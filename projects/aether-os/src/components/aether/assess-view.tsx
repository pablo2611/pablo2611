import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { AlertTriangle, Copy, Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { assessIncident, type Assessment } from '@/lib/ai/assess.functions';
import { downloadJson } from '@/lib/aether';

export type AssessPrefill = { title: string; description: string; indicators: string; assets?: string };
const statuses = ['Detectado', 'En curso', 'Contenido', 'Resuelto'] as const;
const example: AssessPrefill = { title: 'Inicio de sesión sospechoso en VPN y cifrado de archivos', description: 'A las 02:10 el EDR alertó de "vssadmin delete shadows" en el servidor de archivos FS01. Desde las 02:30 aparecen archivos con extensión .lockbit y notas de rescate. La cuenta svc-backup inició sesión por VPN desde una IP extranjera sin MFA.', assets: 'FS01 (Windows Server 2019), DC01, VPN Fortinet', indicators: 'IP 185.220.101.4, cuenta svc-backup, extensión .lockbit' };
const label: Record<Assessment['severity'], string> = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' };

export function AssessView({ prefill }: { prefill: AssessPrefill | null }) {
  const run = useServerFn(assessIncident);
  const [form, setForm] = useState({ title: '', description: '', assets: '', indicators: '', status: 'Detectado' as (typeof statuses)[number] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Assessment | null>(null);
  useEffect(() => { if (prefill) setForm((f) => ({ ...f, ...prefill, assets: prefill.assets ?? f.assets })); }, [prefill]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const res = await run({ data: form });
      if (res.ok) setResult(res.assessment); else setError(res.error);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('[') ? 'Revisa los campos: el título necesita 3 caracteres y la descripción al menos 20.' : 'No se pudo contactar con el servidor. Inténtalo de nuevo.');
    } finally { setBusy(false); }
  };
  const asText = (a: Assessment) => [`# ${form.title}`, `Gravedad: ${label[a.severity]} (confianza ${a.confidence})`, a.summary, `Tipo probable: ${a.likelyAttackType}`, '', '## Contención inmediata', ...a.immediateContainment.map((s, i) => `${i + 1}. ${s}`), '', '## Investigación', ...a.investigation.map((s) => `- ${s}`), '', '## Erradicación y recuperación', ...a.eradicationRecovery.map((s) => `- ${s}`), '', '## Evidencia a preservar', ...a.evidenceToPreserve.map((s) => `- ${s}`), '', `Escalado: ${a.escalation}`].join('\n');
  return (
    <div className="split">
      <form className="panel" onSubmit={submit}>
        <div className="panel-heading"><span><Sparkles size={14} /> Detalles del incidente</span><Button type="button" size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, ...example, assets: example.assets ?? '' }))}>Usar ejemplo</Button></div>
        <div className="panel-body stack-sm">
          <label className="micro muted" htmlFor="as-title">Título</label>
          <input id="as-title" className="field" value={form.title} onChange={set('title')} maxLength={140} required placeholder="Ej. Correo de phishing con enlace a credenciales" />
          <label className="micro muted" htmlFor="as-status">Estado</label>
          <select id="as-status" className="field" value={form.status} onChange={set('status')}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
          <label className="micro muted" htmlFor="as-desc">Qué ocurrió</label>
          <textarea id="as-desc" className="field" rows={6} value={form.description} onChange={set('description')} maxLength={4000} required placeholder="Cronología, alertas, comportamiento observado…" />
          <label className="micro muted" htmlFor="as-assets">Activos afectados</label>
          <input id="as-assets" className="field" value={form.assets} onChange={set('assets')} maxLength={600} placeholder="Servidores, cuentas, aplicaciones" />
          <label className="micro muted" htmlFor="as-ioc">Indicadores (IOC)</label>
          <textarea id="as-ioc" className="field" rows={2} value={form.indicators} onChange={set('indicators')} maxLength={1500} placeholder="IPs, dominios, hashes, CVE" />
          <p className="muted small">No incluyas contraseñas ni datos personales. La evaluación la genera IA y debe revisarla un analista.</p>
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="spin" /> : <Sparkles />}{busy ? 'Evaluando…' : 'Generar evaluación'}</Button>
          {error && <p className="error-text" role="alert"><AlertTriangle size={14} /> {error}</p>}
        </div>
      </form>
      <section className="panel" aria-live="polite">
        <div className="panel-heading"><span>Evaluación defensiva</span>{result && <div className="toolbar"><Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(asText(result)); toast.success('Evaluación copiada'); }}><Copy />Copiar</Button><Button size="sm" variant="ghost" onClick={() => downloadJson('evaluacion-incidente.json', { incidente: form, evaluacion: result })}><Download />JSON</Button></div>}</div>
        {!result && !busy && <div className="panel-body empty-state"><Sparkles size={22} /><p>Describe un incidente o pulsa <strong>Evaluar con IA</strong> en un país o vulnerabilidad para recibir gravedad y pasos de contención.</p></div>}
        {busy && <div className="panel-body stack-sm"><div className="skeleton" /><div className="skeleton short" /><div className="skeleton" /><p className="muted small">Analizando el incidente; suele tardar entre 20 y 60 segundos.</p></div>}
        {result && !busy && (
          <div className="panel-body stack">
            <div className="assess-head">
              <span className={`sev-pill sev-${result.severity}`}>{label[result.severity]}</span>
              <span className="micro muted">Confianza {result.confidence}</span>
            </div>
            <p>{result.summary}</p>
            <div><p className="micro muted">Tipo de ataque probable</p><p>{result.likelyAttackType}</p></div>
            <div><p className="micro muted">Por qué esta gravedad</p><p className="muted">{result.severityRationale}</p></div>
            <Steps title="Contención inmediata" items={result.immediateContainment} ordered />
            <Steps title="Investigación" items={result.investigation} />
            <Steps title="Erradicación y recuperación" items={result.eradicationRecovery} />
            <Steps title="Evidencia a preservar" items={result.evidenceToPreserve} />
            <div><p className="micro muted">Cuándo escalar</p><p>{result.escalation}</p></div>
            {result.uncertainties.length > 0 && <Steps title="Información que falta" items={result.uncertainties} />}
          </div>
        )}
      </section>
    </div>
  );
}

function Steps({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul';
  return <div><p className="micro muted">{title}</p><List className={ordered ? 'steps ordered' : 'steps'}>{items.map((s, i) => <li key={i}>{s}</li>)}</List></div>;
}
