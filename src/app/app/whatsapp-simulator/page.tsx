import type { Metadata } from "next";

import { PanelPage } from "@/components/app/panel-page";
import { BookingDraftCard } from "@/components/whatsapp/booking-draft-card";
import { ConversationThread } from "@/components/whatsapp/conversation-thread";
import { SimulatorComposer } from "@/components/whatsapp/simulator-composer";
import { requireAuthContext } from "@/lib/auth/session";
import {
  getWhatsAppSimulatorCatalog,
  getWhatsAppSimulatorSnapshot,
  normalizeWhatsAppPhone,
  type WhatsAppSimulatorSender,
} from "@/lib/whatsapp/engine";

export const metadata: Metadata = {
  title: "WhatsApp Simulator | Agenda Viva",
  description: "Simulador interno del motor conversacional de WhatsApp para Agenda Viva.",
};

type WhatsAppSimulatorPageProps = {
  searchParams: Promise<{
    sender?: string;
    phone?: string;
    error?: string;
  }>;
};

function resolveSenderRole(value?: string): WhatsAppSimulatorSender {
  return value === "clinic" ? "clinic" : "patient";
}

function resolveErrorMessage(error?: string) {
  switch (error) {
    case "invalid-phone":
      return "Ingresa un numero valido en formato E.164 o equivalente local.";
    case "empty-message":
      return "Escribe un mensaje antes de enviarlo al motor.";
    case "processing":
      return "Ocurrio un error procesando el flujo. Revisa Prisma y los datos del clinic.";
    default:
      return null;
  }
}

export default async function WhatsAppSimulatorPage({
  searchParams,
}: WhatsAppSimulatorPageProps) {
  const authContext = await requireAuthContext();
  const params = await searchParams;
  const senderRole = resolveSenderRole(params.sender);
  const requestedPhone = params.phone?.trim() ?? "";
  const normalizedPhone = requestedPhone ? normalizeWhatsAppPhone(requestedPhone) : null;
  const [conversation, catalog] = await Promise.all([
    normalizedPhone
      ? getWhatsAppSimulatorSnapshot(authContext.clinic.id, normalizedPhone)
      : Promise.resolve(null),
    getWhatsAppSimulatorCatalog(authContext.clinic.id),
  ]);
  const latestCommand = conversation?.commandLogs[0] ?? null;
  const latestDraft = conversation?.bookingDrafts[0] ?? null;
  const errorMessage = resolveErrorMessage(params.error);

  return (
    <PanelPage
      eyebrow="WhatsApp"
      title="Simulador local del motor conversacional"
      description="Prueba flujos de WhatsApp-first dentro del panel sin Twilio, sin Meta Cloud API real y sin enviar mensajes reales. Todo el estado queda aislado por negocio."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.86fr)]">
        <div className="grid gap-6">
          <article className="surface-card px-5 py-4 text-sm text-muted">
            Simulador local. No envia mensajes reales.
          </article>

          {errorMessage ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <SimulatorComposer
            defaultPhone={requestedPhone}
            defaultSender={senderRole}
          />

          <ConversationThread messages={conversation?.messages ?? []} />
        </div>

        <div className="grid gap-6">
          <BookingDraftCard
            conversationStatus={conversation?.status ?? "ACTIVE"}
            latestIntent={latestCommand?.parsedIntent ?? "Sin detectar"}
            latestCommandAt={latestCommand?.createdAt ?? null}
            draft={
              latestDraft
                ? {
                    id: latestDraft.id,
                    status: latestDraft.status,
                    patientName: latestDraft.patientName,
                    phoneE164: latestDraft.phoneE164,
                    preferredDate: latestDraft.preferredDate,
                    preferredTime: latestDraft.preferredTime,
                    service: latestDraft.service,
                    doctor: latestDraft.doctor,
                    appointment: latestDraft.appointment,
                  }
                : null
            }
          />

          <article className="surface-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Catalogo disponible
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                <p className="font-semibold text-ink">Servicios</p>
                <div className="mt-3 grid gap-2 text-sm text-muted">
                  {catalog.services.length ? (
                    catalog.services.map((service) => (
                      <p key={service.id}>
                        {service.name} · {service.durationMinutes} min
                      </p>
                    ))
                  ) : (
                    <p>No hay servicios activos cargados.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="font-semibold text-ink">Profesionales</p>
                <div className="mt-3 grid gap-2 text-sm text-muted">
                  {catalog.doctors.length ? (
                    catalog.doctors.map((doctor) => (
                      <p key={doctor.id}>
                        {doctor.name}
                        {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                      </p>
                    ))
                  ) : (
                    <p>No hay profesionales activos cargados.</p>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </PanelPage>
  );
}
