type AcceptWaitlistOfferFormProps = {
  token: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function AcceptWaitlistOfferForm({
  token,
  action,
}: AcceptWaitlistOfferFormProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Aceptar oferta
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Confirma este horario liberado
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Si el espacio sigue disponible, crearemos tu reserva en estado pendiente
        para que el negocio termine de confirmarla.
      </p>

      <form action={action} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--public-appointment-brand)" }}
        >
          Aceptar horario
        </button>
      </form>
    </article>
  );
}
