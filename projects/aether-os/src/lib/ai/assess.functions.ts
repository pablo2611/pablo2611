import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Assessment } from './assess.server';
export type { Assessment };

const inputSchema = z.object({
  title: z.string().trim().min(3, 'Escribe un título').max(140),
  description: z.string().trim().min(20, 'Describe el incidente (mínimo 20 caracteres)').max(4000),
  assets: z.string().trim().max(600),
  indicators: z.string().trim().max(1500),
  status: z.enum(['En curso', 'Contenido', 'Detectado', 'Resuelto']),
});

export const assessIncident = createServerFn({ method: 'POST' })
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; assessment: Assessment } | { ok: false; error: string }> => {
    const { runAssessment } = await import('./assess.server');
    try {
      return { ok: true, assessment: await runAssessment(data) };
    } catch (error) {
      const status = (error as { statusCode?: number })?.statusCode;
      console.error('assessIncident failed', status, error);
      if (status === 402) return { ok: false, error: 'Se agotaron los créditos de IA del espacio de trabajo. Añade créditos para seguir evaluando incidentes.' };
      if (status === 429) return { ok: false, error: 'Demasiadas solicitudes en poco tiempo. Espera un momento y vuelve a intentarlo.' };
      if (status === 403) return { ok: false, error: 'El acceso a la IA está bloqueado para este espacio de trabajo.' };
      return { ok: false, error: 'No se pudo generar la evaluación. Inténtalo de nuevo en unos minutos.' };
    }
  });
