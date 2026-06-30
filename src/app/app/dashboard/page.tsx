import { MetricCard } from "@/components/app/metric-card";
import { PanelPage } from "@/components/app/panel-page";
import { dashboardMetrics } from "@/data/panel";

export default function DashboardPage() {
  return (
    <PanelPage
      eyebrow="Dashboard"
      title="Resumen del clinic"
      description="Este dashboard inicial deja lista la base del SaaS para conectar datos reales por tenant sin afectar la landing publica."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            note={metric.note}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-card p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Operacion del dia
          </p>
          <div className="mt-6 grid gap-4">
            {[
              "2 citas en estado PENDING listas para confirmar.",
              "1 doctor con agenda completa por la tarde.",
              "Recordatorios y pagos quedaran conectados en fases posteriores.",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-[24px] border border-line/80 bg-surface-soft p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-ink">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Tenant actual
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-brand-100 bg-brand-50 p-5">
              <p className="text-sm font-semibold text-brand-700">Clinica Demo</p>
              <p className="mt-3 text-sm leading-7 text-ink">
                Helper multi-tenant temporal activo para aislar datos por clinic desde la
                base del proyecto.
              </p>
            </div>

            <div className="rounded-[24px] border border-line/80 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Siguiente paso tecnico</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Conectar auth real para resolver clinicId desde membresias y no desde
                valores hardcodeados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PanelPage>
  );
}
