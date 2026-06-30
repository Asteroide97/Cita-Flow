type ConfirmAppointmentFormProps = {
  token: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function ConfirmAppointmentForm({
  token,
  action,
}: ConfirmAppointmentFormProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Confirmar cita
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Confirma tu asistencia
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Al confirmar, el consultorio sabra que mantienes el horario reservado.
      </p>

      <form action={action} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--public-appointment-brand)" }}
        >
          Confirmar cita
        </button>
      </form>
    </article>
  );
}
