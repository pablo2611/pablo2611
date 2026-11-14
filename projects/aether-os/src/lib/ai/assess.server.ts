import { createOpenAI } from '@ai-sdk/openai';
import { Output, streamText } from 'ai';
import { z } from 'zod';
import { createLovableAiGatewayRunIdFetch } from './run-id.server';

export const assessmentSchema = z.object({
  severity: z.enum(['critica', 'alta', 'media', 'baja']),
  confidence: z.enum(['alta', 'media', 'baja']),
  summary: z.string(),
  likelyAttackType: z.string(),
  severityRationale: z.string(),
  immediateContainment: z.array(z.string()),
  investigation: z.array(z.string()),
  eradicationRecovery: z.array(z.string()),
  evidenceToPreserve: z.array(z.string()),
  escalation: z.string(),
  uncertainties: z.array(z.string()),
});
export type Assessment = z.infer<typeof assessmentSchema>;

const INSTRUCTIONS = `Eres un analista senior de respuesta a incidentes (blue team) en un SOC.
Recibes los detalles de un incidente y devuelves una evaluación DEFENSIVA en español.
Reglas:
- Solo orientación defensiva: triage, contención, investigación, erradicación, recuperación y comunicación. Nunca proporciones instrucciones ofensivas, exploits, payloads ni formas de evadir detección.
- Asigna la gravedad (critica, alta, media, baja) según impacto en negocio, alcance, datos sensibles, actividad en curso y explotación conocida (p. ej. CVE en el catálogo CISA KEV).
- Pasos concretos, accionables y priorizados, de 3 a 7 por lista, comenzando por lo más urgente. Usa marcos como NIST SP 800-61 cuando aplique.
- No inventes hechos: si falta información, indícalo en "uncertainties" y ajusta la confianza.
- Si el texto no describe un incidente de seguridad, devuelve gravedad baja, confianza baja y explica qué datos faltan.`;

export async function runAssessment(input: { title: string; description: string; assets: string; indicators: string; status: string }, signal?: AbortSignal) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error('La IA no está configurada en este proyecto.');
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    apiKey,
    headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    fetch: runIdFetch.fetch,
  });
  let streamError: unknown = null;
  const result = streamText({
    model: provider.responses('openai/gpt-6-astra'),
    instructions: INSTRUCTIONS,
    messages: [{ role: 'user', content: `Título: ${input.title}\nEstado: ${input.status}\nDescripción:\n${input.description}\nActivos afectados: ${input.assets || 'no indicado'}\nIndicadores (IOC): ${input.indicators || 'no indicado'}` }],
    output: Output.object({ schema: assessmentSchema }),
    ...(signal ? { abortSignal: signal } : {}),
    maxRetries: 0,
    onError: ({ error }) => { streamError = error; },
    providerOptions: {
      openai: { forceReasoning: true, reasoningEffort: 'medium', reasoningSummary: 'auto', store: false, include: ['reasoning.encrypted_content'] },
    },
  });
  try {
    for await (const _ of result.textStream) { /* consume stream server-side */ }
    const output = await result.output;
    return output;
  } catch (error) {
    throw streamError ?? error;
  }
}
