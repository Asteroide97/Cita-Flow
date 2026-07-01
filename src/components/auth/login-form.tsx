"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { loginAction } from "@/lib/auth/actions";
import { initialLoginActionState } from "@/lib/auth/form-state";

import { AuthField } from "./auth-field";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialLoginActionState);
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session-expired";

  return (
    <>
      {sessionExpired ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
          Tu sesión expiró. Ingresa de nuevo para continuar.
        </div>
      ) : null}

      {state.message ? (
        <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-5">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@negocio.com"
          defaultValue={state.values?.email ?? ""}
          error={state.fieldErrors?.email}
          required
        />

        <AuthField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Ingresa tu contraseña"
          error={state.fieldErrors?.password}
          required
        />

        <SubmitButton pendingLabel="Validando acceso..." className="mt-2 w-full">
          Iniciar sesión
        </SubmitButton>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          ¿Aún no tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-700 hover:text-brand-600">
            Crear negocio
          </Link>
        </p>

        <Link href="/" className="font-semibold text-ink hover:text-brand-700">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
