import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DoctorsPage() {
  const authContext = await requireAuthContext();
  const doctors = await prisma.doctor.findMany({
    where: {
      clinicId: authContext.clinic.id,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      specialty: true,
      bio: true,
      isActive: true,
      availabilityBlocks: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
      timeOffs: {
        where: {
          endAt: {
            gte: new Date(),
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <PanelPage
      eyebrow="Doctores"
      title="Equipo medico y disponibilidad"
      description="Administra la disponibilidad real por doctor antes de conectar canales externos. Los horarios configurados aqui alimentan la validacion de citas del panel y del simulador de WhatsApp."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <article className="surface-card p-6 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Reglas activas
          </p>
          <div className="mt-5 grid gap-3 text-sm text-muted">
            <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
              Solo se permiten citas cuando el doctor y el servicio estan activos.
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              Las citas PENDING y CONFIRMED bloquean horarios. CANCELLED, RESCHEDULED, COMPLETED y NO_SHOW no bloquean.
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              El simulador local de WhatsApp ya usa estos bloques para mostrar slots reales y revalidar antes de crear la cita.
            </div>
          </div>
        </article>

        <article className="surface-card p-6 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Clinica actual
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-ink">
            {authContext.clinic.name}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Configura la disponibilidad por doctor desde el panel protegido sin tocar la
            landing publica ni depender todavia de Meta Cloud API.
          </p>
        </article>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {doctors.length ? (
          doctors.map((doctor) => (
            <article key={doctor.id} className="surface-card p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                    {doctor.name}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {doctor.specialty ?? "Sin especialidad registrada"}
                  </p>
                </div>

                <span
                  className={
                    doctor.isActive
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
                      : "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                  }
                >
                  {doctor.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              {doctor.bio ? (
                <p className="mt-4 text-sm leading-7 text-muted">{doctor.bio}</p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Bloques activos
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                    {doctor.availabilityBlocks.length}
                  </p>
                </div>

                <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Ausencias futuras
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                    {doctor.timeOffs.length}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/app/doctors/${doctor.id}/availability`}
                  className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                >
                  Gestionar disponibilidad
                </Link>
              </div>
            </article>
          ))
        ) : (
          <article className="surface-card p-7 xl:col-span-2">
            <p className="text-lg font-semibold text-ink">
              Todavia no hay doctores cargados para esta clinica.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Ejecuta el seed demo o agrega doctores primero para empezar a configurar
              disponibilidad real.
            </p>
          </article>
        )}
      </div>
    </PanelPage>
  );
}
