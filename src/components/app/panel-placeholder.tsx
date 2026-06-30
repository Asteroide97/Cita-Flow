type PanelPlaceholderProps = {
  highlights: string[];
};

export function PanelPlaceholder({ highlights }: PanelPlaceholderProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="surface-card p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Placeholder funcional
        </p>
        <div className="mt-6 grid gap-4">
          {highlights.map((highlight, index) => (
            <div
              key={highlight}
              className="rounded-[24px] border border-line/80 bg-surface-soft p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-7 text-ink">{highlight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Estado actual
        </p>
        <div className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-semibold text-brand-700">Listo</p>
            <p className="mt-3 text-sm leading-7 text-ink">
              Estructura del panel creada y separada de la landing publica.
            </p>
          </div>

          <div className="rounded-[24px] border border-line/80 bg-white p-5">
            <p className="text-sm font-semibold text-ink">Siguiente fase</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Conectar queries por clinic, permisos por rol y operaciones reales sobre
              Prisma sin permitir acceso cruzado entre tenants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
