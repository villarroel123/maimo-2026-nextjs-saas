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
      await finishLogin(await signInWithPopup(getClientAuth(), getGoogleProvider()));
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
      className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7"
      aria-labelledby="login-title"
    >
      <div
        className="mb-7 grid grid-cols-2 border border-zinc-800 bg-zinc-900/60 p-1"
        aria-label="Modo de autenticacion"
      >
        <button
          type="button"
          className={`h-10 text-sm font-semibold transition ${
            mode === "signin"
              ? "border border-zinc-700 bg-zinc-800 text-zinc-50"
              : "border border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
          onClick={() => setMode("signin")}
          disabled={loading}
        >
          Ingresar
        </button>
        <button
          type="button"
          className={`h-10 text-sm font-semibold transition ${
            mode === "signup"
              ? "border border-zinc-700 bg-zinc-800 text-zinc-50"
              : "border border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
          onClick={() => setMode("signup")}
          disabled={loading}
        >
          Crear cuenta
        </button>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
        Firebase Auth
      </p>
      <h1
        id="login-title"
        className="mt-3 text-2xl font-semibold tracking-normal text-zinc-50 sm:text-3xl"
      >
        SaaS Starter
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Boilerplate Next server-side con Firebase Auth, email/password y Google.
      </p>

      <form onSubmit={handleEmailSubmit} className="mt-7 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-zinc-300">
          <span>Email</span>
          <input
            className="h-11 border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={loading}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-300">
          <span>Password</span>
          <input
            className="h-11 border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            disabled={loading}
            required
          />
        </label>
        <button
          type="submit"
          className="mt-2 h-11 border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 disabled:hover:border-cyan-400 disabled:hover:bg-cyan-400"
          disabled={loading}
        >
          {loading ? "Procesando..." : mode === "signup" ? "Crear cuenta" : "Ingresar"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-800" />
        <span>o</span>
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <button
        type="button"
        className="h-11 w-full border border-zinc-800 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? "Procesando..." : "Continuar con Google"}
      </button>

      {error ? (
        <p className="mt-5 border border-red-900/70 bg-red-950/40 p-3 text-sm leading-6 text-red-300">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-5 border border-cyan-900/70 bg-cyan-950/40 p-3 text-sm leading-6 text-cyan-200">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/90 px-5 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-center">
            <div className="mx-auto h-10 w-10 animate-spin border border-zinc-700 border-t-cyan-300" />
            <p className="mt-5 text-sm font-semibold text-zinc-100">
              {loadingMessage || "Procesando autenticacion..."}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Validando identidad y preparando la sesion.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
