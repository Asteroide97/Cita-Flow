import { WhatsAppMessageDirection } from "@prisma/client";

type ConversationThreadProps = {
  messages: Array<{
    id: string;
    body: string | null;
    direction: WhatsAppMessageDirection;
    createdAt: Date;
  }>;
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ConversationThread({ messages }: ConversationThreadProps) {
  if (!messages.length) {
    return (
      <div className="surface-card p-6 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Conversacion
        </p>
        <p className="mt-4 text-sm leading-7 text-muted">
          Aun no hay mensajes para este numero. Envia el primero desde el formulario.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Conversacion
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Vista local de mensajes entrantes y salientes del motor.
          </p>
        </div>
        <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1.5 text-xs font-semibold text-muted">
          {messages.length} mensajes
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {messages.map((message) => {
          const inbound = message.direction === WhatsAppMessageDirection.INBOUND;

          return (
            <article
              key={message.id}
              className={inbound ? "flex justify-start" : "flex justify-end"}
            >
              <div
                className={
                  inbound
                    ? "max-w-[88%] rounded-[24px] border border-line/80 bg-white px-4 py-4 shadow-soft"
                    : "max-w-[88%] rounded-[24px] border border-brand-200 bg-brand-600 px-4 py-4 text-white shadow-soft"
                }
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <span className={inbound ? "text-brand-700" : "text-blue-100"}>
                    {inbound ? "Inbound" : "Outbound"}
                  </span>
                  <span className={inbound ? "text-muted" : "text-blue-100/80"}>
                    {formatTime(message.createdAt)}
                  </span>
                </div>
                <p className={inbound ? "mt-3 text-sm leading-7 text-ink" : "mt-3 text-sm leading-7 text-white"}>
                  {message.body ?? "Mensaje sin cuerpo"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
