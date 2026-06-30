"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/lib/auth/actions";
import { initialRegisterActionState } from "@/lib/auth/form-state";

import { AuthField } from "./auth-field";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(
    registerAction,
    initialRegisterActionState,
  );

  return (
    <>
      {state.message ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AuthField
            label="Nombre"
            name="name"
            autoComplete="name"
            placeholder="Nombre del owner"
            defaultValue={state.values?.name ?? ""}
            error={state.fieldErrors?.name}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="owner@clinica.com"
            defaultValue={state.values?.email ?? ""}
            error={state.fieldErrors?.email}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <AuthField
            label="Contrasena"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            error={state.fieldErrors?.password}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <AuthField
            label="Nombre del consultorio"
            name="clinicName"
            autoComplete="organization"
            placeholder="Clinica Integral Norte"
            defaultValue={state.values?.clinicName ?? ""}
            error={state.fieldErrors?.clinicName}
            required
          />
        </div>

        <AuthField
          label="Slug del consultorio"
          name="clinicSlug"
          placeholder="clinica-integral-norte"
          defaultValue={state.values?.clinicSlug ?? ""}
          error={state.fieldErrors?.clinicSlug}
          hint="Usa minusculas, numeros y guiones."
          required
        />

        <AuthField
          label="Telefono (opcional)"
          name="phoneE164"
          type="tel"
          autoComplete="tel"
          placeholder="+525511223344"
          defaultValue={state.values?.phoneE164 ?? ""}
          error={state.fieldErrors?.phoneE164}
          hint="Guardalo en formato internacional."
        />

        <SubmitButton pendingLabel="Creando cuenta..." className="mt-2 w-full sm:col-span-2">
          Crear cuenta y entrar al panel
        </SubmitButton>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-600">
            Iniciar sesion
          </Link>
        </p>

        <Link href="/" className="font-semibold text-ink hover:text-brand-700">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
