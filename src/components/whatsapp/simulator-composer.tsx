import { sendWhatsAppSimulatorMessage } from "@/app/app/whatsapp-simulator/actions";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

import type { WhatsAppSimulatorSender } from "@/lib/whatsapp/engine";

type SimulatorComposerProps = {
  defaultPhone: string;
  defaultSender: WhatsAppSimulatorSender;
};

export function SimulatorComposer({
  defaultPhone,
  defaultSender,
}: SimulatorComposerProps) {
  return (
    <form action={sendWhatsAppSimulatorMessage} className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Enviar mensaje
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Simula mensajes entrantes sin usar Twilio ni Meta Cloud API real.
          </p>
        </div>

        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Motor local
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
        <label className="block">
          <span className="mb-2.5 block text-sm font-semibold text-ink">Origen</span>
          <select
            name="senderRole"
            defaultValue={defaultSender}
            className="w-full rounded-[22px] border border-line/80 bg-white/95 px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand-200 focus:ring-4 focus:ring-brand-100/80"
          >
            <option value="patient">Paciente</option>
            <option value="clinic">Consultorio</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2.5 block text-sm font-semibold text-ink">Numero de WhatsApp</span>
          <TextInput
            name="phoneE164"
            defaultValue={defaultPhone}
            placeholder="+525511223344"
            autoComplete="tel"
            required
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-2.5 block text-sm font-semibold text-ink">Mensaje</span>
        <textarea
          name="message"
          rows={5}
          placeholder="Ejemplo: quiero agendar una cita"
          className="w-full rounded-[24px] border border-line/80 bg-white/95 px-4 py-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-200 focus:ring-4 focus:ring-brand-100/80"
          required
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-muted">
        <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-2">
          Paciente: &quot;quiero agendar una cita&quot;
        </span>
        <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-2">
          Consultorio: &quot;agenda hoy&quot;
        </span>
        <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-2">
          Paciente: &quot;confirmar cita&quot;
        </span>
      </div>

      <div className="mt-6">
        <Button type="submit" className="w-full sm:w-auto">
          Enviar al motor
        </Button>
      </div>
    </form>
  );
}
