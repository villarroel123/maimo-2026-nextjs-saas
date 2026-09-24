"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { useRouter, useSearchParams } from "next/navigation";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase/client";

async function persistSession(user) {
  const idToken = await user.getIdToken();

  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear la sesion en el servidor.");
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  async function finishLogin(userCredential) {
    setLoadingMessage("Creando sesion segura...");
    await persistSession(userCredential.user);

    setLoadingMessage("Redirigiendo al dashboard...");
    router.push(nextUrl);
    router.refresh();
  }

  function getGoogleLoginErrorMessage(err) {
    if (err?.code === "auth/unauthorized-domain") {
      return "Este dominio no está autorizado para iniciar sesión con Google.";
    }

    if (err?.code === "auth/operation-not-allowed") {
      return "El inicio de sesión con Google no está habilitado en Firebase.";
    }

    if (err?.code === "auth/popup-blocked") {
      return "El navegador bloqueó la ventana de Google. Habilitá las ventanas emergentes e intentá nuevamente.";
    }

    return "No se pudo iniciar sesión con Google. Intentá nuevamente.";
  }

  async function handleEmailSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setLoadingMessage(
      mode === "signup" ? "Creando cuenta..." : "Iniciando sesion...",
    );

    setError("");
    setNotice("");

    try {
      const action =
        mode === "signup"
          ? createUserWithEmailAndPassword
          : signInWithEmailAndPassword;

      await finishLogin(await action(getClientAuth(), email, password));
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesion.");
      setLoading(false);
      setLoadingMessage("");
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setLoadingMessage("Conectando con Google...");
    setError("");
    setNotice("");

    try {
      await finishLogin(
        await signInWithPopup(getClientAuth(), getGoogleProvider()),
      );
    } catch (err) {
      if (err?.code === "auth/popup-closed-by-user") {
        setNotice(
          "No se completó el inicio con Google. Elegí una cuenta y mantené abierta la ventana de Google. Si no aparece, abrí el sitio en Chrome o Edge y permití las ventanas emergentes.",
        );

        setLoading(false);
        setLoadingMessage("");
        return;
      }

      setError(getGoogleLoginErrorMessage(err));
      setLoading(false);
      setLoadingMessage("");
    }
  }

  return (
    <section
      className="w-full max-w-md rounded-3xl border border-[#823038]/30 bg-[#FDFDFF] p-5 shadow-[0_24px_80px_rgba(130,48,56,0.18)] sm:p-7"
      aria-labelledby="login-title"
    >
      <div
        className="mb-7 grid grid-cols-2 rounded-2xl border border-[#823038]/25 bg-[#FFE4F3] p-1"
        aria-label="Modo de autenticacion"
      >
        <button
          type="button"
          className={`h-10 rounded-xl text-sm font-semibold transition ${
            mode === "signin"
              ? "border border-[#823038] bg-[#823038] text-[#FDFDFF]"
              : "border border-transparent text-[#823038]/60 hover:text-[#823038]"
          }`}
          onClick={() => setMode("signin")}
          disabled={loading}
        >
          Ingresar
        </button>

        <button
          type="button"
          className={`h-10 rounded-xl text-sm font-semibold transition ${
            mode === "signup"
              ? "border border-[#823038] bg-[#823038] text-[#FDFDFF]"
              : "border border-transparent text-[#823038]/60 hover:text-[#823038]"
          }`}
          onClick={() => setMode("signup")}
          disabled={loading}
        >
          Crear cuenta
        </button>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#823038]">
        Narabi
      </p>

      <h1
        id="login-title"
        className="mt-3 text-2xl font-semibold tracking-normal text-[#823038] sm:text-3xl"
      >
        Unite a la comunidad !
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#823038]/65">
        Hecho por y para fans
      </p>

      <form onSubmit={handleEmailSubmit} className="mt-7 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-[#823038]">
          <span>Email</span>

          <input
            className="h-11 rounded-xl border border-[#823038]/25 bg-[#FDFDFF] px-3 text-[#823038] outline-none transition placeholder:text-[#823038]/35 focus:border-[#823038] focus:ring-1 focus:ring-[#823038]/20"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={loading}
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[#823038]">
          <span>Password</span>

          <input
            className="h-11 rounded-xl border border-[#823038]/25 bg-[#FDFDFF] px-3 text-[#823038] outline-none transition placeholder:text-[#823038]/35 focus:border-[#823038] focus:ring-1 focus:ring-[#823038]/20"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            minLength={6}
            disabled={loading}
            required
          />
        </label>

        <button
          type="submit"
          className="mt-2 h-11 rounded-xl border border-[#823038] bg-[#823038] px-4 text-sm font-semibold text-[#FDFDFF] transition hover:bg-[#6d272f] disabled:opacity-60"
          disabled={loading}
        >
          {loading
            ? "Procesando..."
            : mode === "signup"
              ? "Crear cuenta"
              : "Ingresar"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-[#823038]/45">
        <span className="h-px flex-1 bg-[#823038]/20" />
        <span>o</span>
        <span className="h-px flex-1 bg-[#823038]/20" />
      </div>

      <button
        type="button"
        className="h-11 w-full rounded-xl border border-[#823038]/30 bg-[#FFE4F3] px-4 text-sm font-semibold text-[#823038] transition hover:border-[#823038] hover:bg-[#FFE4F3]/70"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? "Procesando..." : "Continuar con Google"}
      </button>

      {error ? (
        <p className="mt-5 rounded-xl border border-[#823038]/40 bg-[#FFE4F3] p-3 text-sm leading-6 text-[#823038]">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-5 rounded-xl border border-[#823038]/30 bg-[#FFE4F3] p-3 text-sm leading-6 text-[#823038]">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#823038]/30 px-5 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-3xl border border-[#823038]/30 bg-[#FDFDFF] p-6 text-center shadow-[0_24px_80px_rgba(130,48,56,0.2)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-[#823038]/20 border-t-[#823038]" />

            <p className="mt-5 text-sm font-semibold text-[#823038]">
              {loadingMessage || "Procesando autenticacion..."}
            </p>

            <p className="mt-2 text-sm leading-6 text-[#823038]/55">
              Validando identidad y preparando la sesion.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}