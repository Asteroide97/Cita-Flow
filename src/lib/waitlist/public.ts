export type PublicWaitlistOfferAction = "accept" | "reject";

export function buildPublicWaitlistOfferPath(
  action: PublicWaitlistOfferAction,
  token: string,
  params: {
    error?: string | null;
  } = {},
) {
  const query = new URLSearchParams();

  if (params.error) {
    query.set("error", params.error);
  }

  const serialized = query.toString();

  return `/espera/${action === "accept" ? "aceptar" : "rechazar"}/${token}${serialized ? `?${serialized}` : ""}`;
}

export function resolveWaitlistOfferFlashMessage(error?: string) {
  if (!error) {
    return null;
  }

  switch (error) {
    case "offer-unavailable":
      return {
        tone: "error" as const,
        message:
          "La oferta ya no tiene un horario valido asociado. Solicita una nueva confirmacion al consultorio.",
      };
    case "slot-unavailable":
      return {
        tone: "error" as const,
        message:
          "Ese horario ya fue ocupado. Mantendremos tu solicitud activa por si se libera otro espacio.",
      };
    default:
      return {
        tone: "error" as const,
        message: "No pudimos completar la accion sobre esta oferta.",
      };
  }
}

export function resolveWaitlistTokenErrorCopy(
  reason:
    | "TOKEN_NOT_FOUND"
    | "TOKEN_EXPIRED"
    | "TOKEN_CONSUMED"
    | "OFFER_NOT_PENDING"
    | "CLINIC_INACTIVE"
    | "WAITLIST_ENTRY_NOT_FOUND"
    | "WAITLIST_ENTRY_NOT_ACTIVE",
) {
  switch (reason) {
    case "TOKEN_EXPIRED":
      return {
        title: "Esta oferta ya expiro",
        description:
          "El horario liberado ya no esta reservado para esta solicitud. Si sigues interesado, espera una nueva coincidencia.",
      };
    case "TOKEN_CONSUMED":
      return {
        title: "Este enlace ya fue usado",
        description:
          "La oferta ya fue aceptada, rechazada o procesada anteriormente.",
      };
    case "OFFER_NOT_PENDING":
      return {
        title: "La oferta ya no esta disponible",
        description:
          "El consultorio ya cerro esta oferta o cambio su estado.",
      };
    case "CLINIC_INACTIVE":
      return {
        title: "El consultorio no esta disponible",
        description:
          "La clinica ya no esta aceptando acciones publicas sobre esta lista de espera.",
      };
    case "WAITLIST_ENTRY_NOT_ACTIVE":
      return {
        title: "La solicitud ya no esta activa",
        description:
          "La entrada de lista de espera fue convertida, cancelada o expiro.",
      };
    case "WAITLIST_ENTRY_NOT_FOUND":
    case "TOKEN_NOT_FOUND":
    default:
      return {
        title: "No pudimos validar este enlace",
        description:
          "La oferta no existe, ya no esta disponible o el enlace fue modificado.",
      };
  }
}
