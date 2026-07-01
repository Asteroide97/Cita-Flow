type RejectWaitlistOfferFormProps = {
  token: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function RejectWaitlistOfferForm({
  token,
  action,
}: RejectWaitlistOfferFormProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Rechazar oferta
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        No tomare este horario
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Rechazaremos este espacio y dejaremos tu solicitud activa para futuras
        coincidencias compatibles.
      </p>

      <form action={action} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100"
        >
          Rechazar horario
        </button>
      </form>
    </article>
  );
}
