"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { formatMXN } from "@/lib/finance/engine";
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
} from "lucide-react";

export function AccessScreens() {
  const {
    activeScreen,
    setActiveScreen,
    loginWithEmail,
    registerWithEmail,
    monthProjection,
  } = useFinanceStore();

  const [name, setName] = useState("Sofía Ramírez");
  const [email, setEmail] = useState("sofia.ramirez@ejemplo.mx");
  const [password, setPassword] = useState("Finanzas2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [recoverySent, setRecoverySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // P01: Bienvenida
  if (activeScreen === "P01") {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0] text-[#26332D]">
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DCCB]/70 text-[#34483D] text-xs font-semibold mb-6">
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario Financiero Personal</span>
          </div>

          <h1 className="text-[28px] leading-[1.18] font-bold tracking-tight text-[#26332D] mb-3">
            Claridad total sobre tu dinero, día por día.
          </h1>
          <p className="text-sm text-[#68736B] leading-relaxed mb-6">
            Anticipa tus pagos, distingue gastos esenciales de flexibles y conoce exactamente con cuánto cerrarás el mes antes de gastar.
          </p>

          {/* Tarjeta editorial de vista previa */}
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-sm mb-6">
            <div className="flex items-center justify-between text-xs text-[#68736B] mb-3">
              <span className="font-medium">Panorama • Noviembre 2026</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#23845B] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#23845B]" />
                Proyección saludable
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-[#E4E6DE]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#68736B]">
                  Saldo actual
                </div>
                <div className="text-lg font-bold tabular-nums text-[#26332D] mt-0.5">
                  {formatMXN(monthProjection.currentBalance)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#68736B]">
                  Cierre proyectado
                </div>
                <div className="text-lg font-bold tabular-nums text-[#23845B] mt-0.5">
                  {formatMXN(monthProjection.projectedClosingBalance)}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D47A52]" />
                <span className="text-[#26332D] font-medium">Esencial</span>
                <span className="inline-block w-2 h-2 rotate-45 bg-[#D99A32] ml-1" />
                <span className="text-[#26332D] font-medium">Importante</span>
                <span className="inline-block w-2 h-2 rounded-full border-[1.75px] border-[#6E8CA3] ml-1" />
                <span className="text-[#26332D] font-medium">Flexible</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-[#68736B]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#23845B] shrink-0" />
              <span>
                Regla de corte inteligente: sin doble conteo entre tu saldo actual y tu historial.
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#D99A32] shrink-0" />
              <span>
                Proyección honesta: los ingresos atrasados no inflan tu dinero disponible.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => setActiveScreen("P02")}
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <span>Comenzar ahora</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen("P03")}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F1EB] text-[#26332D] font-semibold text-sm border border-[#E4E6DE] transition cursor-pointer"
          >
            Ya tengo una cuenta
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="w-full py-2 text-xs text-[#34483D] font-semibold underline underline-offset-4 hover:text-[#26332D] text-center cursor-pointer"
          >
            Explorar directamente con el Dataset Maestro de Sofía (PRD 8.3)
          </button>
        </div>
      </div>
    );
  }

  // P02: Registro
  if (activeScreen === "P02") {
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      await registerWithEmail(name, email, password);
      setSubmitting(false);
    };

    return (
      <div className="flex-1 flex flex-col p-6 bg-[#F6F5F0]">
        <button
          type="button"
          onClick={() => setActiveScreen("P01")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] mb-5 w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <h1 className="text-2xl font-bold text-[#26332D] mb-1">
          Crea tu cuenta
        </h1>
        <p className="text-xs text-[#68736B] mb-6">
          Configura tu calendario financiero personal en menos de 2 minutos.
        </p>

        <form onSubmit={handleRegister} className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
              Nombre completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Sofía Ramírez"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] focus:outline-none focus:border-[#34483D]"
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
                placeholder="tu@correo.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] focus:outline-none focus:border-[#34483D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
              Contraseña (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] focus:outline-none focus:border-[#34483D]"
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
              <span className="h-1 flex-1 rounded-full bg-[#23845B]" />
              <span className="h-1 flex-1 rounded-full bg-[#23845B]" />
              <span className="h-1 flex-1 rounded-full bg-[#23845B]" />
            </div>
            <p className="text-[11px] text-[#23845B] mt-1">
              Contraseña segura • Cumple con 8+ caracteres
            </p>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#68736B] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#E4E6DE] accent-[#34483D]"
            />
            <span>
              Acepto los Términos de Servicio y el Aviso de Privacidad para el resguardo cifrado de mis datos financieros.
            </span>
          </label>

          <button
            type="submit"
            disabled={!acceptedTerms || submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Creando cuenta..." : "Crear cuenta y configurar"}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#E4E6DE]" />
            <span className="flex-shrink mx-3 text-[11px] text-[#68736B] uppercase">
              o continúa con
            </span>
            <div className="flex-grow border-t border-[#E4E6DE]" />
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen("P05")}
            className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Continuar con Google</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#68736B] mt-6">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => setActiveScreen("P03")}
            className="font-semibold text-[#34483D] underline cursor-pointer"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    );
  }

  // P03: Inicio de sesión
  if (activeScreen === "P03") {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      await loginWithEmail(email, password);
      setSubmitting(false);
    };

    return (
      <div className="flex-1 flex flex-col p-6 bg-[#F6F5F0]">
        <button
          type="button"
          onClick={() => setActiveScreen("P01")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] mb-5 w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <h1 className="text-2xl font-bold text-[#26332D] mb-1">
          Hola de nuevo
        </h1>
        <p className="text-xs text-[#68736B] mb-6">
          Ingresa a tu calendario financiero para revisar tus compromisos del mes.
        </p>

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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] focus:outline-none focus:border-[#34483D]"
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
                onClick={() => setActiveScreen("P04")}
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
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] focus:outline-none focus:border-[#34483D]"
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
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer"
          >
            {submitting ? "Iniciando sesión..." : "Entrar a mi calendario"}
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Continuar con Google</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#68736B] mt-6">
          ¿Aún no tienes cuenta?{" "}
          <button
            type="button"
            onClick={() => setActiveScreen("P02")}
            className="font-semibold text-[#34483D] underline cursor-pointer"
          >
            Regístrate gratis
          </button>
        </p>
      </div>
    );
  }

  // P04: Recuperar contraseña
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
        Ingresa el correo asociado a tu cuenta y te enviaremos un enlace seguro para restablecer tu acceso.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-semibold text-[#26332D] mb-1.5">
            Correo electrónico registrado
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm text-[#26332D] focus:outline-none focus:border-[#34483D]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRecoverySent(true)}
          className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer"
        >
          Enviar enlace de recuperación
        </button>

        {recoverySent && (
          <div className="p-4 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] text-xs text-[#23845B] space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Enlace enviado a {email}</span>
            </div>
            <p className="text-[#26332D]">
              Revisa tu bandeja de entrada y carpeta de spam. El enlace es válido durante los próximos 30 minutos.
            </p>
          </div>
        )}
      </div>

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
