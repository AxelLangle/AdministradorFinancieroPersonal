"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  describeRecurrenceRuleSchedule,
  formatDateDDMMYYYY,
  formatMXN,
  serializeRecurrenceSchedule,
} from "@/lib/finance/engine";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type {
  CustomScheduleDayItem,
  PriorityLevel,
  RecurrenceFrequency,
  ScreenId,
} from "@/lib/finance/types";
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Wallet,
  Target,
  Sparkles,
  HelpCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  X,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import {
  useBottomSheetDragToDismiss,
  useHorizontalSwipe,
} from "@/lib/hooks/useSwipeGesture";

const ONBOARDING_STEPS: { id: ScreenId; step: number; label: string }[] = [
  { id: "P05", step: 1, label: "Saldo inicial" },
  { id: "P06", step: 2, label: "Presupuesto" },
  { id: "P07", step: 3, label: "Categorías" },
  { id: "P08", step: 4, label: "Ingresos" },
  { id: "P09", step: 5, label: "Gastos fijos" },
];

type IncomeScheduleKind =
  | "semimonthly"
  | "biweekly"
  | "calendar_multi"
  | "weekly"
  | "monthly";

const WEEKDAYS_OPTIONS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface OnboardingStepHelpItem {
  field: string;
  explanation: string;
  tip?: string;
}

interface OnboardingStepGuide {
  stepNumber: number;
  title: string;
  summary: string;
  whyItMatters: string;
  fields: OnboardingStepHelpItem[];
  example: string;
  note: string;
}

const ONBOARDING_STEP_GUIDES: Partial<Record<ScreenId, OnboardingStepGuide>> = {
  P05: {
    stepNumber: 1,
    title: "¿Cómo funciona el Paso 1: Saldo inicial y corte?",
    summary:
      "Aquí defines cuánto dinero real y disponible tienes HOY antes de empezar a registrar movimientos en tu calendario.",
    whyItMatters:
      "La aplicación toma esta cantidad como punto de partida para calcular tu Saldo Actual hoy y proyectar con cuánto terminarás el mes.",
    fields: [
      {
        field: "Dinero disponible hoy ($)",
        explanation:
          "Suma el dinero que ya tienes en tu cuenta de débito, nómina y efectivo en cartera. Al empezar a escribir un número, el cero inicial desaparece automáticamente.",
        tip: "No sumes líneas de crédito ni sueldos que aún no te depositan.",
      },
      {
        field: "Fecha de inicio / corte",
        explanation:
          "Es el día exacto desde el cual empieza a contar tu saldo actual. Por defecto es hoy.",
        tip: "Si capturas algún gasto o ingreso pasado anterior a esta fecha, solo quedará como historial informativo y no alterará tu saldo actual para no descontarlo doble.",
      },
      {
        field: "Botones rápidos ($2,500, $5,000, $10,000)",
        explanation:
          "Son atajos opcionales por si quieres llenar una cifra base en un toque y ajustarla después.",
      },
    ],
    example:
      "Si hoy tienes $4,200 en tu tarjeta de débito y $300 en efectivo, escribe $4,500 y deja la fecha de hoy.",
    note: "Si te equivocas o quieres ajustar tu punto de arranque después, podrás modificarlo desde el menú Más → Saldo y fecha de corte.",
  },
  P06: {
    stepNumber: 2,
    title: "¿Cómo funciona el Paso 2: Presupuesto mensual?",
    summary:
      "Aquí estableces un techo máximo de gasto para el mes completo. Es tu límite saludable para no gastar de más.",
    whyItMatters:
      "Mientras avanzan los días, la app compara todo lo que ya pagaste más lo que tienes programado contra este límite y te avisa si te acercas al tope.",
    fields: [
      {
        field: "Techo máximo de gasto del mes ($)",
        explanation:
          "Es el monto total que planeas gastar en todo el mes sumando servicios, comida, salidas y compromisos.",
        tip: "Idealmente debe ser menor a tus ingresos mensuales para que te quede margen de ahorro.",
      },
      {
        field: "Alerta preventiva (80%) y Colchón sugerido (10%)",
        explanation:
          "Al llegar al 80% de tu presupuesto verás una advertencia amarilla (Ajustado). El colchón del 10% sirve como reserva de seguridad para imprevistos.",
      },
    ],
    example:
      "Si ganas $18,000 al mes y quieres ahorrar $3,000, escribe $15,000 como techo mensual.",
    note: "No pasa nada si lo ajustas después: dentro de la pestaña Presupuesto tienes el botón «Ajustar techo» para cambiarlo en cualquier momento.",
  },
  P07: {
    stepNumber: 3,
    title: "¿Cómo funciona el Paso 3: Categorías y prioridades?",
    summary:
      "Aquí revisas cómo se clasifican tus gastos y qué nivel de importancia tiene cada categoría por defecto.",
    whyItMatters:
      "Las prioridades ayudan a identificar rápido qué pagos son intocables y cuáles puedes recortar o posponer si algún mes se vuelve apretado.",
    fields: [
      {
        field: "● Esencial (rojo terracota)",
        explanation:
          "Pagos obligatorios que debes cubrir primero: vivienda, luz, agua, despensa básica, salud y tarjetas/créditos.",
      },
      {
        field: "◆ Importante (ámbar)",
        explanation:
          "Gastos necesarios para tu rutina o trabajo, con cierto margen de ajuste: transporte, educación, herramientas.",
      },
      {
        field: "○ Flexible (verde oliva/gris)",
        explanation:
          "Gustos, salidas, entretenimiento o compras no urgentes. Son los primeros que conviene pausar si tu proyección baja.",
      },
      {
        field: "Selector en cada fila",
        explanation:
          "Toca Esencial, Importante o Flexible junto a cualquier categoría para cambiar su prioridad predeterminada desde ahora.",
      },
    ],
    example:
      "Puedes marcar Vivienda y Servicios como ● Esencial, Transporte como ◆ Importante y Entretenimiento como ○ Flexible.",
    note: "Más adelante podrás crear categorías nuevas o renombrar las existentes desde Más → Categorías y prioridades.",
  },
  P08: {
    stepNumber: 4,
    title: "¿Cómo funciona el Paso 4: Ingresos esperados?",
    summary:
      "Aquí registras tus entradas de dinero repetitivas (sueldo, quincena, catorcena, rentas o cobros periódicos) para llenar automáticamente tu calendario.",
    whyItMatters:
      "Conociendo qué días te pagan y cuánto entra, la app calcula tu cierre de mes y te muestra cuánto dinero te debe rendir «Hasta tu próximo ingreso».",
    fields: [
      {
        field: "Esquema de cobros",
        explanation:
          "Elige el que coincide contigo: Quincenal (presets como 15 y fin de mes), Catorcenal cada 14 días exactos (detecta meses con 3 pagos), Calendario libre multi-día (toca varios días del 1 al 31), Semanal o Mensual.",
      },
      {
        field: "¿Recibes un cobro grande y otro pequeño?",
        explanation:
          "Si activas «Sí, montos distintos», puedes escribir por separado cuánto entra en tu cobro grande y cuánto en el pequeño (o personalizar el monto de cada día del calendario).",
        tip: "Útil si recibes bonos o vales solo en una quincena o catorcena.",
      },
      {
        field: "Monto fijo ($) vs Variable (~$)",
        explanation:
          "Elige Monto fijo si siempre entra lo mismo; usa Variable (~$) si depende de comisiones, propinas o ventas.",
      },
      {
        field: "Mover fin de semana a viernes",
        explanation:
          "Si tu día de pago cae en sábado o domingo y tu empresa adelanta el depósito al viernes, deja marcada esta casilla.",
      },
    ],
    example:
      "Si recibes catorcena alternada de $9,500 y $8,500 los viernes, elige Catorcenal cada 14 días, activa «Sí, montos distintos» y captura ambos montos.",
    note: "Si algún día recibes dinero extra ocasional (reembolso o venta), lo agregarás después con el botón + en vez de ponerlo aquí.",
  },
  P09: {
    stepNumber: 5,
    title: "¿Cómo funciona el Paso 5: Gastos fijos recurrentes?",
    summary:
      "Aquí registras únicamente los pagos que se repiten con fecha conocida (como renta, luz, internet o tarjeta) para apartarlos en tu calendario desde el día 1.",
    whyItMatters:
      "Te evita la ilusión de tener dinero de más: aunque todavía no venza un recibo, el calendario ya lo considera apartado en tu proyección del mes.",
    fields: [
      {
        field: "¿Qué SÍ va aquí vs qué NO va?",
        explanation:
          "SÍ van: renta/hipoteca, luz, agua, gas, internet, celular, colegiaturas, suscripciones y pago de tarjeta/créditos. NO van: súper, gasolina, cafés o antojos (esos van después con +).",
      },
      {
        field: "Frecuencia y día de vencimiento",
        explanation:
          "Soporta pagos Mensuales, Bimestrales (como CFE), Quincenales, Catorcenales o Semanales, indicando su día de pago (1–31).",
      },
      {
        field: "Prioridad y Tipo de monto (Fijo vs Variable ~$)",
        explanation:
          "Usa Fijo ($) si pagas siempre la misma cantidad (Internet) y Variable (~$) si varía cada recibo (Luz o Tarjeta); cuando pagues el recibo real podrás capturar el monto exacto.",
      },
      {
        field: "Tarjetas de crédito",
        explanation:
          "Registra aquí la fecha límite de pago de tu tarjeta con un estimado mensual para no duplicar gastos cuando compres a meses o uses la tarjeta.",
      },
    ],
    example:
      "Renta de $6,500 Mensual el día 1 (● Esencial, Fijo) y Luz CFE de $600 Bimestral el día 18 (● Esencial, Variable ~$).",
    note: "Este paso es opcional si prefieres empezar ya; siempre podrás agregar, pausar o editar reglas en Más → Compromisos recurrentes.",
  },
};

export function OnboardingScreens() {
  const {
    activeScreen,
    setActiveScreen,
    onboardingDraft,
    setOnboardingDraft,
    categories,
    completeOnboarding,
    referenceDate,
  } = useFinanceStore();

  const [isStepHelpOpen, setIsStepHelpOpen] = useState(false);

  // Estados de Ingresos (Paso 4 - P08)
  const [newIncomeTitle, setNewIncomeTitle] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeSecondAmount, setNewIncomeSecondAmount] = useState("");
  const [hasDifferentAmounts, setHasDifferentAmounts] = useState(false);
  const [newIncomeAmountType, setNewIncomeAmountType] = useState<
    "fixed" | "variable"
  >("fixed");
  const [incomeScheduleKind, setIncomeScheduleKind] =
    useState<IncomeScheduleKind>("semimonthly");
  const [semimonthlyPreset, setSemimonthlyPreset] = useState<
    "15,last" | "10,25" | "5,20" | "1,15"
  >("15,last");
  const [newIncomeDay, setNewIncomeDay] = useState("15");
  const [newIncomeWeekday, setNewIncomeWeekday] = useState<number>(5);
  const [newIncomeBiweeklyStart, setNewIncomeBiweeklyStart] =
    useState<string>(referenceDate);
  const [selectedCalendarDays, setSelectedCalendarDays] = useState<
    Array<number | "last">
  >([15, "last"]);
  const [customDayAmounts, setCustomDayAmounts] = useState<
    Record<string, string>
  >({});
  const [weekendToFriday, setWeekendToFriday] = useState(true);

  // Estados de Gastos Fijos (Paso 5 - P09)
  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseDay, setNewExpenseDay] = useState("1");
  const [newExpenseFreq, setNewExpenseFreq] =
    useState<RecurrenceFrequency>("monthly");
  const [newExpenseWeekday, setNewExpenseWeekday] = useState<number>(1);
  const [newExpensePriority, setNewExpensePriority] =
    useState<PriorityLevel>("essential");
  const [newExpenseAmountType, setNewExpenseAmountType] = useState<
    "fixed" | "variable"
  >("fixed");

  const currentStepIdx = Math.max(
    0,
    ONBOARDING_STEPS.findIndex((s) => s.id === activeScreen)
  );
  const currentStepObj = ONBOARDING_STEPS[currentStepIdx] || ONBOARDING_STEPS[0];
  const currentStepGuide = ONBOARDING_STEP_GUIDES[activeScreen];

  const stepHelpSheetDrag = useBottomSheetDragToDismiss({
    enabled: isStepHelpOpen,
    onClose: () => setIsStepHelpOpen(false),
  });

  const navigateOnboardingStep = (nextScreen: ScreenId) => {
    setIsStepHelpOpen(false);
    setActiveScreen(nextScreen);
  };

  const onboardingSwipeHandlers = useHorizontalSwipe({
    threshold: 52,
    onSwipeLeft: () => {
      if (currentStepIdx < ONBOARDING_STEPS.length - 1) {
        navigateOnboardingStep(ONBOARDING_STEPS[currentStepIdx + 1].id);
      }
    },
    onSwipeRight: () => {
      if (currentStepIdx > 0) {
        navigateOnboardingStep(ONBOARDING_STEPS[currentStepIdx - 1].id);
      }
    },
  });

  const toggleCalendarDay = (dayVal: number | "last") => {
    setSelectedCalendarDays((prev) => {
      const exists = prev.includes(dayVal);
      if (exists) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== dayVal);
      }
      const next = [...prev, dayVal];
      return next.sort((a, b) => {
        const na = a === "last" ? 99 : a;
        const nb = b === "last" ? 99 : b;
        return na - nb;
      });
    });
  };

  const renderStepHeader = (prevScreen: ScreenId) => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => navigateOnboardingStep(prevScreen)}
          className="min-h-[44px] px-2 -ml-2 rounded-xl inline-flex items-center gap-1 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <span className="text-xs font-bold text-[#34483D]">
          Paso {currentStepObj.step} de 5 • {currentStepObj.label}
        </span>
        <button
          type="button"
          onClick={() => setIsStepHelpOpen(true)}
          className="min-h-[44px] px-2 -mr-2 rounded-xl inline-flex items-center gap-1 text-xs font-semibold text-[#34483D] hover:underline cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>¿Cómo funciona?</span>
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {ONBOARDING_STEPS.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => navigateOnboardingStep(st.id)}
            aria-label={`Ir al paso ${st.step}: ${st.label}`}
            className="min-h-[24px] flex items-center cursor-pointer"
          >
            <span
              className={`block w-full h-1.5 rounded-full transition ${
                st.step <= currentStepObj.step ? "bg-[#34483D]" : "bg-[#E4E6DE]"
              }`}
            />
          </button>
        ))}
      </div>

      {isStepHelpOpen && currentStepGuide && (
        <div
          onClick={stepHelpSheetDrag.handleBackdropClick}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            {...stepHelpSheetDrag.sheetTouchHandlers}
            style={stepHelpSheetDrag.sheetStyle}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E4E6DE] shadow-2xl max-h-[88dvh] overflow-y-auto space-y-3.5"
          >
            <div className="w-12 h-1.5 rounded-full bg-[#E4E6DE] mx-auto sm:hidden" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F1EB] text-[10px] font-bold text-[#34483D] border border-[#E4E6DE] mb-1">
                  <BookOpen className="w-3 h-3" />
                  <span>Guía del Paso {currentStepGuide.stepNumber} de 5</span>
                </span>
                <h3 className="text-base font-bold text-[#26332D] leading-snug">
                  {currentStepGuide.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStepHelpOpen(false)}
                aria-label="Cerrar ayuda del paso"
                className="p-2 rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-1.5 text-xs">
              <div className="font-bold text-[#26332D]">¿Qué es esta sección?</div>
              <p className="text-[#68736B] leading-relaxed">
                {currentStepGuide.summary}
              </p>
              <div className="font-bold text-[#34483D] pt-1">
                ¿Para qué le sirve a tu calendario?
              </div>
              <p className="text-[#26332D] leading-relaxed">
                {currentStepGuide.whyItMatters}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[#26332D]">
                Qué llenar en cada campo de este formulario:
              </div>
              {currentStepGuide.fields.map((item) => (
                <div
                  key={item.field}
                  className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] space-y-1 text-xs"
                >
                  <div className="font-bold text-[#34483D]">{item.field}</div>
                  <p className="text-[#26332D] leading-relaxed">
                    {item.explanation}
                  </p>
                  {item.tip && (
                    <div className="text-[11px] text-[#68736B] bg-[#F6F5F0] px-2.5 py-1.5 rounded-lg border border-[#E4E6DE]/80">
                      💡 {item.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] text-xs space-y-1">
              <div className="font-bold text-[#23845B] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Ejemplo práctico</span>
              </div>
              <p className="text-[#26332D] leading-relaxed">
                {currentStepGuide.example}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FEF7EC] border border-[#F5DDA8] text-[11px] text-[#26332D] leading-relaxed">
              <strong>Nota útil:</strong> {currentStepGuide.note}
            </div>

            <button
              type="button"
              onClick={() => setIsStepHelpOpen(false)}
              className="w-full py-3 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white text-xs font-semibold cursor-pointer"
            >
              Entendido, seguir completando este paso
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Paso 1: Saldo inicial y Fecha de corte
  if (activeScreen === "P05") {
    return (
      <div
        {...onboardingSwipeHandlers}
        className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]"
      >
        <div>
          {renderStepHeader("P01")}

          <div className="p-3.5 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] mb-4 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#23845B] shrink-0 mt-0.5" />
            <div className="text-xs text-[#26332D] leading-relaxed">
              <strong className="text-[#23845B] block mb-0.5">
                ¡Bienvenido! Vamos a configurar tu calendario en 2 minutos
              </strong>
              Esta app te ayuda a saber con exactitud cuánto dinero tendrás disponible cada día del mes después de cubrir tus recibos y gastos pendientes.
            </div>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-[#34483D]/10 text-[#34483D] flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            1. ¿Con cuánto dinero líquido cuentas hoy?
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-5">
            Escribe el dinero real disponible hoy para gastar o pagar recibos (la suma de tu cuenta de débito/nómina más tu efectivo disponible).
          </p>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-sm space-y-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Saldo disponible actual (MXN)
              </label>
              <CurrencyInput
                value={onboardingDraft.openingBalance || ""}
                placeholder="Ej. 6,480.50"
                onChange={(_, num) =>
                  setOnboardingDraft((prev) => ({
                    ...prev,
                    openingBalance: num,
                  }))
                }
              />
              <span className="block text-[11px] text-[#68736B] mt-1">
                Se agregan comas automáticamente cada 3 dígitos y punto para centavos.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Fecha de corte de este saldo inicial
              </label>
              <input
                type="date"
                value={onboardingDraft.openingDate}
                onChange={(e) =>
                  setOnboardingDraft((prev) => ({
                    ...prev,
                    openingDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-medium text-[#26332D]"
              />
              <span className="block text-[11px] text-[#68736B] mt-1">
                Fecha seleccionada: {formatDateDDMMYYYY(onboardingDraft.openingDate)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0F5FA] border border-[#CFE0EE] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#527A9A] shrink-0 mt-0.5" />
            <div className="text-xs text-[#26332D] leading-relaxed">
              <strong className="text-[#527A9A] block mb-0.5">
                ¿Para qué sirve la fecha de corte?
              </strong>
              Si más adelante decides anotar gastos o ingresos que ocurrieron{" "}
              <strong>antes del {formatDateDDMMYYYY(onboardingDraft.openingDate)}</strong>{" "}
              para llevar el historial de tu mes, el sistema no los volverá a descontar de tu saldo actual porque ya están reflejados en el dinero que tienes hoy.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P06")}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Siguiente: Tu presupuesto mensual</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Paso 2: Presupuesto mensual
  if (activeScreen === "P06") {
    const presets = [10000, 15000, 20000, 30000];
    return (
      <div
        {...onboardingSwipeHandlers}
        className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]"
      >
        <div>
          {renderStepHeader("P05")}

          <div className="w-10 h-10 rounded-2xl bg-[#34483D]/10 text-[#34483D] flex items-center justify-center mb-3">
            <Target className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            2. Define tu techo de gasto mensual
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-5">
            ¿Cuál es el monto máximo que deseas gastar en total durante el mes (sumando lo que ya pagaste y los recibos pendientes por pagar)?
          </p>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-sm space-y-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Presupuesto total mensual (MXN)
              </label>
              <CurrencyInput
                value={onboardingDraft.monthlyBudget || ""}
                placeholder="Ej. 20,000.00"
                onChange={(_, num) =>
                  setOnboardingDraft((prev) => ({
                    ...prev,
                    monthlyBudget: num,
                  }))
                }
              />
            </div>

            <div>
              <span className="block text-[11px] text-[#68736B] mb-1.5">
                O elige una cantidad rápida de referencia:
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setOnboardingDraft((prev) => ({
                        ...prev,
                        monthlyBudget: val,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer tabular-nums ${
                      onboardingDraft.monthlyBudget === val
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    {formatMXN(val, { showPrefix: false })}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E6DE]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#26332D]">
                  Recibir alerta preventiva al llegar a:
                </span>
                <span className="font-bold text-[#D99A32] tabular-nums">
                  {onboardingDraft.alertThresholdPercent}% del presupuesto
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={onboardingDraft.alertThresholdPercent}
                onChange={(e) =>
                  setOnboardingDraft((prev) => ({
                    ...prev,
                    alertThresholdPercent: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#34483D]"
              />
              <p className="text-[11px] text-[#68736B] mt-1 leading-relaxed">
                También cuidaremos un <strong>colchón mínimo de seguridad (10%)</strong> de{" "}
                <strong className="tabular-nums text-[#26332D]">
                  {formatMXN(onboardingDraft.monthlyBudget * 0.1)}
                </strong>{" "}
                para avisarte si algún día del mes tu cuenta baja demasiado.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P07")}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Siguiente: Categorías y prioridades</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Paso 3: Categorías y Prioridades
  if (activeScreen === "P07") {
    const activeCats = categories.filter((c) => c.is_active);
    const toggleCat = (id: string) => {
      setOnboardingDraft((prev) => {
        const exists = prev.selectedCategories.includes(id);
        return {
          ...prev,
          selectedCategories: exists
            ? prev.selectedCategories.filter((x) => x !== id)
            : [...prev.selectedCategories, id],
        };
      });
    };

    return (
      <div
        {...onboardingSwipeHandlers}
        className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]"
      >
        <div>
          {renderStepHeader("P06")}

          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            3. Tus categorías y prioridades
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-3">
            Cada categoría asigna automáticamente un nivel de prioridad a tus gastos para ayudarte a distinguir lo obligatorio de lo opcional:
          </p>

          <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E4E6DE] mb-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <PriorityBadge priority="essential" compact />
              <span className="text-[#68736B]">
                Indispensables (vivienda, luz, agua, despensa).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority="important" compact />
              <span className="text-[#68736B]">
                Necesarios pero ajustables (transporte, seguros, salud).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority="flexible" compact />
              <span className="text-[#68736B]">
                Opcionales o recortables (salidas, streaming, gustos).
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
            {activeCats.map((cat) => {
              const selected = onboardingDraft.selectedCategories.includes(
                cat.id
              );
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCat(cat.id)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between transition text-left cursor-pointer ${
                    selected
                      ? "bg-[#FFFFFF] border-[#34483D] shadow-2xs"
                      : "bg-[#F0F1EB]/70 border-[#E4E6DE] opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        selected
                          ? "bg-[#34483D] border-[#34483D] text-white"
                          : "border-[#68736B]"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#26332D]">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-[#68736B]">
                        {cat.kind === "income"
                          ? "Categoría de ingreso"
                          : "Categoría de gasto"}
                      </div>
                    </div>
                  </div>
                  <PriorityBadge priority={cat.default_priority} compact />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P08")}
          className="w-full mt-4 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Siguiente: Tus ingresos esperados</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Paso 4: Primeros ingresos (con Catorcena grande/pequeña, Quincenal flexible, Semanal, Mensual y Calendario Multi-selección)
  if (activeScreen === "P08") {
    const handleAddIncome = () => {
      const baseAmount = Number(String(newIncomeAmount).replace(/,/g, "")) || 0;
      const secondAmount =
        Number(String(newIncomeSecondAmount).replace(/,/g, "")) || 0;
      if (!newIncomeTitle.trim() || baseAmount <= 0) return;

      let frequency: RecurrenceFrequency = "monthly";
      let dayOfMonth = Number(newIncomeDay) || 15;
      let semimonthlyDays: string | null = null;
      let dayOfWeek: number | null = null;
      let startDate = `${referenceDate.slice(0, 7)}-01`;

      const weekendShift = weekendToFriday ? "friday" : "none";

      if (incomeScheduleKind === "biweekly") {
        frequency = "biweekly";
        startDate = newIncomeBiweeklyStart || referenceDate;
        dayOfMonth = Number(startDate.slice(8, 10)) || 15;
        semimonthlyDays = serializeRecurrenceSchedule({
          alternateAmount:
            hasDifferentAmounts && secondAmount > 0 ? secondAmount : null,
          weekendShift,
        });
      } else if (incomeScheduleKind === "weekly") {
        frequency = "weekly";
        dayOfWeek = newIncomeWeekday;
        semimonthlyDays = serializeRecurrenceSchedule({
          alternateAmount:
            hasDifferentAmounts && secondAmount > 0 ? secondAmount : null,
          weekendShift: "none",
        });
      } else if (incomeScheduleKind === "semimonthly") {
        frequency = "semimonthly";
        const [d1Raw, d2Raw] = semimonthlyPreset.split(",");
        const d1: number | "last" =
          d1Raw === "last" ? "last" : Number(d1Raw) || 15;
        const d2: number | "last" =
          d2Raw === "last" ? "last" : Number(d2Raw) || 30;
        dayOfMonth = typeof d1 === "number" ? d1 : 15;
        const items: CustomScheduleDayItem[] = [
          { day: d1, amount: baseAmount },
          {
            day: d2,
            amount:
              hasDifferentAmounts && secondAmount > 0
                ? secondAmount
                : baseAmount,
          },
        ];
        semimonthlyDays = serializeRecurrenceSchedule({
          items,
          weekendShift,
        });
      } else if (incomeScheduleKind === "calendar_multi") {
        frequency = selectedCalendarDays.length === 2 ? "semimonthly" : "monthly";
        const firstDay = selectedCalendarDays[0];
        dayOfMonth = typeof firstDay === "number" ? firstDay : 15;
        const items: CustomScheduleDayItem[] = selectedCalendarDays.map((d) => {
          const key = String(d);
          const customVal =
            Number(String(customDayAmounts[key] || "").replace(/,/g, "")) || 0;
          return {
            day: d,
            amount:
              hasDifferentAmounts && customVal > 0 ? customVal : baseAmount,
          };
        });
        semimonthlyDays = serializeRecurrenceSchedule({
          items,
          weekendShift,
        });
      } else {
        frequency = "monthly";
        dayOfMonth = Math.min(31, Math.max(1, Number(newIncomeDay) || 15));
        semimonthlyDays = serializeRecurrenceSchedule({
          items: [{ day: dayOfMonth === 31 ? "last" : dayOfMonth }],
          weekendShift,
        });
      }

      const scheduleSummary = describeRecurrenceRuleSchedule({
        id: "preview",
        workspace_id: "",
        account_id: "",
        type: "income",
        title: newIncomeTitle.trim(),
        category_id: null,
        priority: "essential",
        amount_type: newIncomeAmountType,
        default_amount: baseAmount,
        frequency,
        interval_count: 1,
        day_of_month: dayOfMonth,
        semimonthly_days: semimonthlyDays,
        day_of_week: dayOfWeek,
        start_date: startDate,
        end_date: null,
        status: "active",
        notes: null,
      });

      setOnboardingDraft((prev) => ({
        ...prev,
        incomes: [
          ...prev.incomes,
          {
            id: `onb-inc-${Date.now()}`,
            title: newIncomeTitle.trim(),
            amount: baseAmount,
            amountType: newIncomeAmountType,
            frequency,
            dayOfMonth,
            semimonthlyDays,
            dayOfWeek,
            startDate,
            scheduleSummary,
          },
        ],
      }));
      setNewIncomeTitle("");
      setNewIncomeAmount("");
      setNewIncomeSecondAmount("");
      setCustomDayAmounts({});
    };

    return (
      <div
        {...onboardingSwipeHandlers}
        className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]"
      >
        <div>
          {renderStepHeader("P07")}

          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            4. ¿Cómo y cuándo recibes tus ingresos?
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-3">
            Adapta tus cobros a tu realidad: quincenal, catorcenal (incluso si recibes una <strong>catorcena grande y otra pequeña</strong>), semanal, mensual o eligiendo varios días directamente en el calendario.
          </p>

          {onboardingDraft.incomes.length > 0 && (
            <div className="space-y-2 mb-4">
              {onboardingDraft.incomes.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E4E6DE] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-[#26332D]">
                      {inc.title}
                    </div>
                    <div className="text-[11px] text-[#68736B]">
                      {inc.scheduleSummary ||
                        (inc.frequency === "semimonthly"
                          ? "Quincenal (Días 15 y último de mes)"
                          : `Mensual (Día ${inc.dayOfMonth} de cada mes)`)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-[#23845B]">
                      +{formatMXN(inc.amount, { approximate: inc.amountType === "variable" })}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setOnboardingDraft((prev) => ({
                          ...prev,
                          incomes: prev.incomes.filter((i) => i.id !== inc.id),
                        }))
                      }
                      className="p-1.5 text-[#68736B] hover:text-[#C94C4C] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E4E6DE] space-y-3.5">
            <div className="text-xs font-bold text-[#26332D]">
              Configurar fuente de ingreso
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                Concepto del ingreso
              </label>
              <input
                type="text"
                value={newIncomeTitle}
                onChange={(e) => setNewIncomeTitle(e.target.value)}
                placeholder="Ej. Nómina catorcenal, Sueldo quincenal, Comisiones o Renta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D] placeholder:text-[#68736B]/60"
              />
            </div>

            {/* Selector visual de esquema de cobro */}
            <div>
              <label className="block text-[11px] font-semibold text-[#68736B] mb-1.5">
                ¿Con qué frecuencia o esquema lo recibes?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: "semimonthly", label: "Quincenal (2/mes)" },
                  { id: "biweekly", label: "Catorcenal (14 días)" },
                  { id: "calendar_multi", label: "Calendario (Multi-día)" },
                  { id: "weekly", label: "Semanal (7 días)" },
                  { id: "monthly", label: "Mensual (1/mes)" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setIncomeScheduleKind(opt.id as IncomeScheduleKind)
                    }
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                      incomeScheduleKind === opt.id
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración específica según el esquema elegido */}
            {incomeScheduleKind === "semimonthly" && (
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2.5">
                <label className="block text-[11px] font-semibold text-[#26332D]">
                  ¿Qué par de días del mes cobras tus quincenas?
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: "15,last", label: "Días 15 y fin de mes" },
                      { id: "10,25", label: "Días 10 y 25" },
                      { id: "5,20", label: "Días 5 y 20" },
                      { id: "1,15", label: "Días 1 y 15" },
                    ] as const
                  ).map((pair) => (
                    <button
                      key={pair.id}
                      type="button"
                      onClick={() => setSemimonthlyPreset(pair.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        semimonthlyPreset === pair.id
                          ? "bg-[#23845B] text-white border-[#23845B]"
                          : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                      }`}
                    >
                      {pair.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {incomeScheduleKind === "biweekly" && (
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#26332D] mb-1">
                    Fecha de un cobro catorcenal tuyo (sirve de punto de partida cada 14 días)
                  </label>
                  <input
                    type="date"
                    value={newIncomeBiweeklyStart}
                    onChange={(e) => setNewIncomeBiweeklyStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
                  />
                  <span className="block text-[10px] text-[#68736B] mt-1">
                    Calcularemos cada 14 días exactos (incluyendo cuando un mes trae 3 catorcenas).
                  </span>
                </div>
              </div>
            )}

            {incomeScheduleKind === "calendar_multi" && (
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#26332D] flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#23845B]" />
                    <span>Toca todos los días del mes en que recibes este ingreso:</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#23845B]">
                    {selectedCalendarDays.length} seleccionado(s)
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                    const isSelected = selectedCalendarDays.includes(dayNum);
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => toggleCalendarDay(dayNum)}
                        className={`h-8 rounded-lg text-xs font-bold tabular-nums border transition cursor-pointer ${
                          isSelected
                            ? "bg-[#23845B] text-white border-[#23845B] shadow-2xs"
                            : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE] hover:border-[#91A68C]"
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => toggleCalendarDay("last")}
                  className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedCalendarDays.includes("last")
                      ? "bg-[#23845B] text-white border-[#23845B]"
                      : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Último día de cada mes (28, 30 o 31 según el mes)</span>
                </button>
              </div>
            )}

            {incomeScheduleKind === "weekly" && (
              <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE]">
                <label className="block text-[11px] font-semibold text-[#26332D] mb-1.5">
                  ¿Qué día de la semana te pagan?
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {WEEKDAYS_OPTIONS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setNewIncomeWeekday(w.value)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        newIncomeWeekday === w.value
                          ? "bg-[#23845B] text-white border-[#23845B]"
                          : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {incomeScheduleKind === "monthly" && (
              <div>
                <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                  Día de cobro del mes (1–31, usa 31 para fin de mes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newIncomeDay}
                  onChange={(e) =>
                    setNewIncomeDay(e.target.value.replace(/^0+(?=\d)/, ""))
                  }
                  placeholder="Ej. 15 o 30"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                />
              </div>
            )}

            {/* Opción de Montos Alternados / Diferenciados (ej. Catorcena grande $9,500 y pequeña $8,500) */}
            {(incomeScheduleKind === "biweekly" ||
              incomeScheduleKind === "semimonthly" ||
              (incomeScheduleKind === "calendar_multi" &&
                selectedCalendarDays.length > 1) ||
              incomeScheduleKind === "weekly") && (
              <div className="p-3 rounded-xl bg-[#EDF7F2]/70 border border-[#C6E7D6] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-[#26332D]">
                    ¿Recibes un cobro grande y otro pequeño?
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasDifferentAmounts((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      hasDifferentAmounts
                        ? "bg-[#23845B] text-white border-[#23845B]"
                        : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    {hasDifferentAmounts
                      ? "Sí, montos distintos"
                      : "No, siempre igual"}
                  </button>
                </div>
                <p className="text-[10px] text-[#68736B] leading-relaxed">
                  Ideal si te llega una <strong>catorcena/quincena grande</strong> (ej. $9,500 con vales o bono) y otra <strong>pequeña</strong> (ej. $8,500).
                </p>
              </div>
            )}

            {/* Campos de Monto según si son iguales o diferenciados */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                  {hasDifferentAmounts &&
                  (incomeScheduleKind === "biweekly" ||
                    incomeScheduleKind === "semimonthly" ||
                    incomeScheduleKind === "weekly")
                    ? "Monto del 1er cobro (ej. Catorcena / Quincena grande)"
                    : "Monto base por cobro (MXN)"}
                </label>
                <CurrencyInput
                  value={newIncomeAmount}
                  placeholder="Ej. 9,500.00"
                  onChange={(raw) => setNewIncomeAmount(raw)}
                  inputClassName="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-bold tabular-nums text-[#26332D] placeholder:text-[#68736B]/60 placeholder:font-normal"
                />
              </div>

              {hasDifferentAmounts &&
                (incomeScheduleKind === "biweekly" ||
                  incomeScheduleKind === "semimonthly" ||
                  incomeScheduleKind === "weekly") && (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                      Monto del 2do cobro alternado (ej. Catorcena / Quincena pequeña)
                    </label>
                    <CurrencyInput
                      value={newIncomeSecondAmount}
                      placeholder="Ej. 8,500.00"
                      onChange={(raw) => setNewIncomeSecondAmount(raw)}
                      inputClassName="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-bold tabular-nums text-[#26332D] placeholder:text-[#68736B]/60 placeholder:font-normal"
                    />
                  </div>
                )}

              {hasDifferentAmounts &&
                incomeScheduleKind === "calendar_multi" &&
                selectedCalendarDays.length > 1 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-semibold text-[#26332D]">
                      Personaliza el monto de cada día seleccionado (si dejas alguno vacío usará el monto base):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCalendarDays.map((d) => {
                        const key = String(d);
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#34483D] w-20 shrink-0">
                              {d === "last" ? "Fin de mes:" : `Día ${d}:`}
                            </span>
                            <div className="flex-1">
                              <CurrencyInput
                                value={customDayAmounts[key] || ""}
                                placeholder={newIncomeAmount || "Ej. 8,500"}
                                onChange={(raw) =>
                                  setCustomDayAmounts((prev) => ({
                                    ...prev,
                                    [key]: raw,
                                  }))
                                }
                                inputClassName="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {/* Opciones de adaptabilidad: Fijo vs Variable y Fin de Semana */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <select
                value={newIncomeAmountType}
                onChange={(e) =>
                  setNewIncomeAmountType(
                    e.target.value as "fixed" | "variable"
                  )
                }
                className="px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              >
                <option value="fixed">Monto fijo ($ seguro)</option>
                <option value="variable">Monto variable / comisión (~$)</option>
              </select>

              {incomeScheduleKind !== "weekly" && (
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-[11px] text-[#26332D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weekendToFriday}
                    onChange={(e) => setWeekendToFriday(e.target.checked)}
                    className="accent-[#34483D]"
                  />
                  <span>Si cae en sáb/dom, mover a viernes</span>
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddIncome}
              className="w-full py-2.5 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#34483D] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir ingreso a mi calendario</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P09")}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Último paso: Tus gastos fijos del mes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Paso 5: Gastos fijos recurrentes
  const handleAddFixedExpense = () => {
    const numeric = Number(String(newExpenseAmount).replace(/,/g, "")) || 0;
    if (!newExpenseTitle.trim() || numeric <= 0) return;

    const dayOfMonth = Math.min(31, Math.max(1, Number(newExpenseDay) || 1));
    const semimonthlyDays =
      newExpenseFreq === "semimonthly" ? "15,last" : null;
    const dayOfWeek =
      newExpenseFreq === "weekly" ? newExpenseWeekday : null;
    const startDate =
      newExpenseFreq === "biweekly"
        ? referenceDate
        : `${referenceDate.slice(0, 7)}-01`;

    const scheduleSummary = describeRecurrenceRuleSchedule({
      id: "preview-exp",
      workspace_id: "",
      account_id: "",
      type: "expense",
      title: newExpenseTitle.trim(),
      category_id: categories[0]?.id || "cat-servicios",
      priority: newExpensePriority,
      amount_type: newExpenseAmountType,
      default_amount: numeric,
      frequency: newExpenseFreq,
      interval_count: 1,
      day_of_month: dayOfMonth,
      semimonthly_days: semimonthlyDays,
      day_of_week: dayOfWeek,
      start_date: startDate,
      end_date: null,
      status: "active",
      notes: null,
    });

    setOnboardingDraft((prev) => ({
      ...prev,
      fixedExpenses: [
        ...prev.fixedExpenses,
        {
          id: `onb-exp-${Date.now()}`,
          title: newExpenseTitle.trim(),
          amount: numeric,
          dayOfMonth,
          frequency: newExpenseFreq,
          semimonthlyDays,
          dayOfWeek,
          startDate,
          scheduleSummary,
          priority: newExpensePriority,
          amountType: newExpenseAmountType,
          categoryId: categories[0]?.id || "cat-servicios",
        },
      ],
    }));
    setNewExpenseTitle("");
    setNewExpenseAmount("");
  };

  return (
    <div
      {...onboardingSwipeHandlers}
      className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]"
    >
      <div>
        {renderStepHeader("P08")}

        <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
          5. Programa tus gastos recurrentes
        </h1>
        <p className="text-xs text-[#68736B] leading-relaxed mb-3">
          Registra aquí únicamente los compromisos periódicos que se repiten para que el calendario los aparte automáticamente de tu dinero disponible.
        </p>

        {/* Guía clara: ¿Qué gastos SÍ encajan aquí y cuáles NO? */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          <div className="p-3 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] text-[11px] text-[#26332D] leading-relaxed">
            <div className="font-bold text-[#23845B] flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>¿Qué gastos SÍ van aquí?</span>
            </div>
            <p>
              Pagos que se repiten con fecha fija cada mes, bimestre o semana:{" "}
              <strong>
                renta, hipoteca, internet, luz (CFE), agua, gas, plan celular, colegiaturas, suscripciones (Netflix, gimnasio)
              </strong>{" "}
              y el pago mensual de tu tarjeta o crédito.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#F0F5FA] border border-[#CFE0EE] text-[11px] text-[#26332D] leading-relaxed">
            <div className="font-bold text-[#527A9A] flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>¿Cuáles NO van aquí? (Se agregan después)</span>
            </div>
            <p>
              <strong>
                Comidas fuera, cafés, antojos, salidas, ropa, regalos o compras únicas.
              </strong>{" "}
              No los pongas aquí: esos gastos del día a día los podrás agregar después en cualquier momento con el botón{" "}
              <strong>+</strong> dentro de tu calendario.
            </p>
          </div>
        </div>

        {/* Recomendación de tarjetas de crédito */}
        <div className="p-3 rounded-2xl bg-[#FEF9EE] border border-[#F5E1B9] flex items-start gap-2.5 mb-3">
          <CreditCard className="w-4 h-4 text-[#9A6712] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#26332D] leading-relaxed">
            <strong className="text-[#9A6712] block">
              Consejo clave si usas tarjeta de crédito:
            </strong>
            Registra aquí el <strong>pago mensual de tu tarjeta</strong> en su fecha límite de pago (en lugar de anotar cada compra individual hecha con la tarjeta) para no duplicar salidas de tu cuenta bancaria.
          </div>
        </div>

        {onboardingDraft.fixedExpenses.length > 0 && (
          <div className="space-y-2 mb-3 max-h-[24vh] overflow-y-auto pr-1">
            {onboardingDraft.fixedExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#E4E6DE] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#26332D]">
                      {exp.title}
                    </span>
                    <PriorityBadge priority={exp.priority} compact />
                  </div>
                  <div className="text-[11px] text-[#68736B] mt-0.5">
                    {exp.scheduleSummary || `Día ${exp.dayOfMonth} de cada mes`} •{" "}
                    {exp.amountType === "variable"
                      ? "Monto estimado (~)"
                      : "Monto fijo"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums text-[#26332D]">
                    {formatMXN(exp.amount, {
                      approximate: exp.amountType === "variable",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOnboardingDraft((prev) => ({
                        ...prev,
                        fixedExpenses: prev.fixedExpenses.filter(
                          (x) => x.id !== exp.id
                        ),
                      }))
                    }
                    className="p-1 text-[#68736B] hover:text-[#C94C4C] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E4E6DE] space-y-2.5">
          <div className="text-xs font-bold text-[#26332D]">
            Añadir un compromiso recurrente
          </div>
          <div>
            <input
              type="text"
              value={newExpenseTitle}
              onChange={(e) => setNewExpenseTitle(e.target.value)}
              placeholder="Ej. Renta departamento, Recibo Luz CFE, Internet o Netflix"
              className="w-full px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D] placeholder:text-[#68736B]/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CurrencyInput
              value={newExpenseAmount}
              placeholder="Monto ej. 6,500.00"
              onChange={(raw) => setNewExpenseAmount(raw)}
              inputClassName="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D] placeholder:text-[#68736B]/60 placeholder:font-normal"
            />
            <select
              value={newExpenseFreq}
              onChange={(e) =>
                setNewExpenseFreq(e.target.value as RecurrenceFrequency)
              }
              className="px-2.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
            >
              <option value="monthly">Mensual (cada mes)</option>
              <option value="bimonthly">Bimestral (ej. Luz CFE)</option>
              <option value="semimonthly">Quincenal (15 y fin)</option>
              <option value="biweekly">Catorcenal (cada 14 días)</option>
              <option value="weekly">Semanal (cada 7 días)</option>
            </select>
          </div>

          {newExpenseFreq === "weekly" ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#68736B] shrink-0">
                Día de pago:
              </span>
              <select
                value={newExpenseWeekday}
                onChange={(e) => setNewExpenseWeekday(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              >
                {WEEKDAYS_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>
                    Cada {w.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            newExpenseFreq !== "semimonthly" &&
            newExpenseFreq !== "biweekly" && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#68736B] shrink-0">
                  Día de vencimiento en el mes (1–31):
                </span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newExpenseDay}
                  onChange={(e) =>
                    setNewExpenseDay(e.target.value.replace(/^0+(?=\d)/, ""))
                  }
                  placeholder="1–31"
                  className="w-24 px-2.5 py-1.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                />
              </div>
            )
          )}

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newExpensePriority}
              onChange={(e) =>
                setNewExpensePriority(e.target.value as PriorityLevel)
              }
              className="px-2.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
            >
              <option value="essential">● Prioridad Esencial</option>
              <option value="important">◆ Prioridad Importante</option>
              <option value="flexible">○ Prioridad Flexible</option>
            </select>

            <select
              value={newExpenseAmountType}
              onChange={(e) =>
                setNewExpenseAmountType(
                  e.target.value as "fixed" | "variable"
                )
              }
              className="px-2.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
            >
              <option value="fixed">Monto Fijo ($)</option>
              <option value="variable">Monto Variable (~$)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddFixedExpense}
            className="w-full py-2 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#34483D] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar este compromiso recurrente</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={completeOnboarding}
        className="w-full mt-4 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
      >
        <span>Finalizar y abrir mi Calendario Financiero</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

