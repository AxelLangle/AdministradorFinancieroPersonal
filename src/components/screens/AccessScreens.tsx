"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export function AccessScreens() {
  const {
    activeScreen,
    setActiveScreen,
    loginWithEmail,
    registerWithEmail,
    signInWithGoogle,
    sendPasswordResetEmail,
  } = useFinanceStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsEmailNotice, setNeedsEmailNotice] = useState(false);

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    const res = await signInWithGoogle();
    if (!res.ok && res.error) {
      setErrorMessage(res.error);
      setSubmitting(false);
    }
  };

  // Bienvenida
  if (activeScreen === "P01") {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0] text-[#26332D]">
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DCCB]/70 text-[#34483D] text-xs font-semibold mb-5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Plataforma de Administración Financiera</span>
          </div>

          <h1 className="text-[28px] leading-[1.18] font-bold tracking-tight text-[#26332D] mb-3">
            Claridad total sobre tu dinero, día por día.
          </h1>
          <p className="text-sm text-[#68736B] leading-relaxed mb-6">
            Organiza tus ingresos y compromisos en un calendario inteligente, anticipa cuánto dinero te quedará al cerrar el mes y toma decisiones con calma antes de gastar.
          </p>

          {/* Tarjeta ilustrativa del funcionamiento */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-sm mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#68736B]">
              <span className="font-semibold">¿Qué obtienes al crear tu cuenta?</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#23845B] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#23845B]" />
                Espacio privado
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-[#26332D]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#23845B] shrink-0 mt-0.5" />
                <span>
                  <strong>Proyección honesta de liquidez:</strong> Conoce cuánto saldo tendrás después de cubrir todos tus recibos y compromisos pendientes.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#D99A32] shrink-0 mt-0.5" />
                <span>
                  <strong>Prioridades claras:</strong> Identifica tus gastos como{" "}
                  <strong>● Esencial</strong>, <strong>◆ Importante</strong> o{" "}
                  <strong>○ Flexible</strong> para saber qué ajustar si el mes se aprieta.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveScreen("P02");
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <span>Crear mi cuenta gratis</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveScreen("P03");
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F1EB] text-[#26332D] font-semibold text-sm border border-[#E4E6DE] transition cursor-pointer"
          >
            Ya tengo una cuenta • Iniciar sesión
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen("MANUAL")}
            className="w-full py-2 text-xs text-[#34483D] font-semibold flex items-center justify-center gap-1.5 hover:underline cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Consultar el Manual Completo de Funcionamiento</span>
          </button>
        </div>
      </div>
    );
  }

  // Registro de nuevo usuario
  if (activeScreen === "P02") {
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSubmitting(true);
      const res = await registerWithEmail(name, email, password);
      setSubmitting(false);
      if (!res.ok && res.error) {
        setErrorMessage(res.error);
      } else if (res.needsEmailConfirmation) {
        setNeedsEmailNotice(true);
      }
    };

    return (
      <div className="flex-1 flex flex-col p-6 bg-[#F6F5F0]">
        <button
          type="button"
          onClick={() => setActiveScreen("P01")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] mb-5 w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>

        <h1 className="text-2xl font-bold text-[#26332D] mb-1">
          Crea tu cuenta personal
        </h1>
        <p className="text-xs text-[#68736B] mb-5">
          Tus datos están protegidos en tu propio espacio privado. Configura tu calendario en 5 pasos sencillos.
        </p>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FDF2F2] border border-[#F5CACA] text-xs text-[#C94C4C] flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {needsEmailNotice && (
          <div className="p-4 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] text-xs text-[#23845B] space-y-1.5 mb-4">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Revisa tu correo para activar tu cuenta!</span>
            </div>
            <p className="text-[#26332D]">
              Te enviamos un enlace de confirmación a <strong>{email}</strong>. Una vez confirmado, inicia sesión para configurar tu calendario.
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
              Tu nombre o cómo te gusta que te llamen
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Alejandro Martínez"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] placeholder:text-[#68736B]/60 focus:outline-none focus:border-[#34483D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. alejandro@correo.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] placeholder:text-[#68736B]/60 focus:outline-none focus:border-[#34483D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
              Crea una contraseña segura
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres (letras y números)"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] placeholder:text-[#68736B]/60 focus:outline-none focus:border-[#34483D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736B] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex gap-1.5 mt-2">
              <span
                className={`h-1 flex-1 rounded-full ${
                  password.length >= 4 ? "bg-[#23845B]" : "bg-[#E4E6DE]"
                }`}
              />
              <span
                className={`h-1 flex-1 rounded-full ${
                  password.length >= 6 ? "bg-[#23845B]" : "bg-[#E4E6DE]"
                }`}
              />
              <span
                className={`h-1 flex-1 rounded-full ${
                  password.length >= 8 ? "bg-[#23845B]" : "bg-[#E4E6DE]"
                }`}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#68736B] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#E4E6DE] accent-[#34483D]"
            />
            <span>
              Acepto los Términos de Uso y el Aviso de Privacidad para el resguardo seguro de mi información financiera.
            </span>
          </label>

          <button
            type="submit"
            disabled={!acceptedTerms || submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? "Creando tu espacio financiero..."
              : "Crear cuenta y comenzar"}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#E4E6DE]" />
            <span className="flex-shrink mx-3 text-[11px] text-[#68736B] uppercase">
              o regístrate con
            </span>
            <div className="flex-grow border-t border-[#E4E6DE]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] flex items-center justify-center gap-2.5 transition cursor-pointer shadow-2xs"
          >
            <GoogleIcon />
            <span>Continuar con Google</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#68736B] mt-6">
          ¿Ya tienes una cuenta?{" "}
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveScreen("P03");
            }}
            className="font-semibold text-[#34483D] underline cursor-pointer"
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    );
  }

  // Inicio de sesión
  if (activeScreen === "P03") {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);
      setSubmitting(true);
      const res = await loginWithEmail(email, password);
      setSubmitting(false);
      if (!res.ok && res.error) {
        setErrorMessage(res.error);
      }
    };

    return (
      <div className="flex-1 flex flex-col p-6 bg-[#F6F5F0]">
        <button
          type="button"
          onClick={() => setActiveScreen("P01")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] mb-5 w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>

        <h1 className="text-2xl font-bold text-[#26332D] mb-1">
          Iniciar sesión
        </h1>
        <p className="text-xs text-[#68736B] mb-5">
          Ingresa con tu cuenta para consultar tu calendario financiero y compromisos del mes.
        </p>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FDF2F2] border border-[#F5CACA] text-xs text-[#C94C4C] flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo registrado"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] placeholder:text-[#68736B]/60 focus:outline-none focus:border-[#34483D]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#26332D]">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setActiveScreen("P04");
                }}
                className="text-xs font-semibold text-[#34483D] hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] placeholder:text-[#68736B]/60 focus:outline-none focus:border-[#34483D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736B] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Verificando acceso..." : "Entrar a mi calendario"}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#E4E6DE]" />
            <span className="flex-shrink mx-3 text-[11px] text-[#68736B] uppercase">
              o inicia sesión con
            </span>
            <div className="flex-grow border-t border-[#E4E6DE]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] flex items-center justify-center gap-2.5 transition cursor-pointer shadow-2xs"
          >
            <GoogleIcon />
            <span>Iniciar sesión con Google</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#68736B] mt-6">
          ¿Aún no tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setActiveScreen("P02");
            }}
            className="font-semibold text-[#34483D] underline cursor-pointer"
          >
            Crear cuenta nueva
          </button>
        </p>
      </div>
    );
  }

  // Recuperar contraseña
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    const res = await sendPasswordResetEmail(email);
    setSubmitting(false);
    if (!res.ok && res.error) {
      setErrorMessage(res.error);
    } else {
      setRecoverySent(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#F6F5F0]">
      <button
        type="button"
        onClick={() => setActiveScreen("P03")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] mb-5 w-fit cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a inicio de sesión</span>
      </button>

      <h1 className="text-2xl font-bold text-[#26332D] mb-1">
        Recuperar contraseña
      </h1>
      <p className="text-xs text-[#68736B] mb-6 leading-relaxed">
        Escribe el correo electrónico con el que te registraste y te enviaremos un enlace seguro para restablecer tu contraseña.
      </p>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-[#FDF2F2] border border-[#F5CACA] text-xs text-[#C94C4C] flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleRecovery} className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
            Correo electrónico registrado
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej. tu@correo.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] placeholder:text-[#68736B]/60 focus:outline-none focus:border-[#34483D]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50"
        >
          {submitting
            ? "Enviando enlace..."
            : "Enviar enlace de recuperación"}
        </button>

        {recoverySent && (
          <div className="p-4 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] text-xs text-[#23845B] space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Enlace enviado a {email}</span>
            </div>
            <p className="text-[#26332D]">
              Revisa tu bandeja de entrada y tu carpeta de correo no deseado (spam).
            </p>
          </div>
        )}
      </form>

      <button
        type="button"
        onClick={() => setActiveScreen("P03")}
        className="w-full py-3 rounded-xl border border-[#E4E6DE] bg-[#FFFFFF] text-xs font-semibold text-[#26332D] cursor-pointer"
      >
        Regresar a Iniciar sesión
      </button>
    </div>
  );
}
