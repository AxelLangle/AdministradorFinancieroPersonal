"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { formatDateDDMMYYYY, formatMXN } from "@/lib/finance/engine";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { PriorityLevel, ScreenId } from "@/lib/finance/types";
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
} from "lucide-react";
import { useHorizontalSwipe } from "@/lib/hooks/useSwipeGesture";

const ONBOARDING_STEPS: { id: ScreenId; step: number; label: string }[] = [
  { id: "P05", step: 1, label: "Saldo inicial" },
  { id: "P06", step: 2, label: "Presupuesto" },
  { id: "P07", step: 3, label: "Categorías" },
  { id: "P08", step: 4, label: "Ingresos" },
  { id: "P09", step: 5, label: "Gastos fijos" },
];

export function OnboardingScreens() {
  const {
    activeScreen,
    setActiveScreen,
    onboardingDraft,
    setOnboardingDraft,
    categories,
    completeOnboarding,
    setIsTutorialOpen,
  } = useFinanceStore();

  const [newIncomeTitle, setNewIncomeTitle] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newIncomeFreq, setNewIncomeFreq] = useState<"semimonthly" | "monthly">(
    "semimonthly"
  );
  const [newIncomeDay, setNewIncomeDay] = useState("15");

  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseDay, setNewExpenseDay] = useState("1");
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

  const onboardingSwipeHandlers = useHorizontalSwipe({
    threshold: 52,
    onSwipeLeft: () => {
      if (currentStepIdx < ONBOARDING_STEPS.length - 1) {
        setActiveScreen(ONBOARDING_STEPS[currentStepIdx + 1].id);
      }
    },
    onSwipeRight: () => {
      if (currentStepIdx > 0) {
        setActiveScreen(ONBOARDING_STEPS[currentStepIdx - 1].id);
      }
    },
  });

  const renderStepHeader = (prevScreen: ScreenId) => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setActiveScreen(prevScreen)}
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
          onClick={() => setIsTutorialOpen(true)}
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
            onClick={() => setActiveScreen(st.id)}
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

          {/* Tarjeta introductoria para el nuevo usuario */}
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

          {/* Explicación de las 3 prioridades */}
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
                        {cat.kind === "income" ? "Categoría de ingreso" : "Categoría de gasto"}
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

  // Paso 4: Primeros ingresos
  if (activeScreen === "P08") {
    const handleAddIncome = () => {
      const numeric = Number(String(newIncomeAmount).replace(/,/g, "")) || 0;
      if (!newIncomeTitle.trim() || numeric <= 0) return;
      setOnboardingDraft((prev) => ({
        ...prev,
        incomes: [
          ...prev.incomes,
          {
            id: `onb-inc-${Date.now()}`,
            title: newIncomeTitle.trim(),
            amount: numeric,
            frequency: newIncomeFreq,
            dayOfMonth: Number(newIncomeDay) || 15,
          },
        ],
      }));
      setNewIncomeTitle("");
      setNewIncomeAmount("");
    };

    return (
      <div
      {...onboardingSwipeHandlers}
      className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]"
    >
        <div>
          {renderStepHeader("P07")}

          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            4. ¿Qué ingresos fijos recibes en el mes?
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-4">
            Agrega tu sueldo, nómina o ingresos periódicos. Esto le permite al calendario calcular cuánto dinero te quedará antes y después de cada fecha de cobro. (Opcional: también puedes agregarlos después).
          </p>

          {onboardingDraft.incomes.length > 0 && (
            <div className="space-y-2 mb-4">
              {onboardingDraft.incomes.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E4E6DE] flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-[#26332D]">
                      {inc.title}
                    </div>
                    <div className="text-xs text-[#68736B]">
                      {inc.frequency === "semimonthly"
                        ? "Quincenal (Días 15 y último de mes)"
                        : `Mensual (Día ${inc.dayOfMonth} de cada mes)`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-[#23845B]">
                      +{formatMXN(inc.amount)}
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

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E4E6DE] space-y-3">
            <div className="text-xs font-bold text-[#26332D]">
              Agregar un ingreso esperado
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                Concepto del ingreso
              </label>
              <input
                type="text"
                value={newIncomeTitle}
                onChange={(e) => setNewIncomeTitle(e.target.value)}
                placeholder="Ej. Nómina quincenal, Sueldo o Renta cobrada"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D] placeholder:text-[#68736B]/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                Monto por cada cobro (MXN)
              </label>
              <CurrencyInput
                value={newIncomeAmount}
                placeholder="Ej. 9,000.00"
                onChange={(raw) => setNewIncomeAmount(raw)}
                inputClassName="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-bold tabular-nums text-[#26332D] placeholder:text-[#68736B]/60 placeholder:font-normal"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                  ¿Cada cuánto lo recibes?
                </label>
                <select
                  value={newIncomeFreq}
                  onChange={(e) =>
                    setNewIncomeFreq(
                      e.target.value as "semimonthly" | "monthly"
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
                >
                  <option value="semimonthly">Quincenal (15 y fin de mes)</option>
                  <option value="monthly">Mensual (1 vez al mes)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                  Día de cobro (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newIncomeDay}
                  onChange={(e) =>
                    setNewIncomeDay(e.target.value.replace(/^0+(?=\d)/, ""))
                  }
                  placeholder="Ej. 15"
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs tabular-nums text-[#26332D]"
                />
              </div>
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
    setOnboardingDraft((prev) => ({
      ...prev,
      fixedExpenses: [
        ...prev.fixedExpenses,
        {
          id: `onb-exp-${Date.now()}`,
          title: newExpenseTitle.trim(),
          amount: numeric,
          dayOfMonth: Number(newExpenseDay) || 1,
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
          5. Programa tus gastos fijos de cada mes
        </h1>
        <p className="text-xs text-[#68736B] leading-relaxed mb-3">
          Agrega tus pagos recurrentes como renta, internet, luz o suscripciones para que aparezcan en tu calendario y descuenten de tu proyección antes de que los gastes en otra cosa.
        </p>

        {/* Recomendación de tarjetas de crédito */}
        <div className="p-3.5 rounded-2xl bg-[#FEF9EE] border border-[#F5E1B9] flex items-start gap-2.5 mb-3">
          <CreditCard className="w-4 h-4 text-[#9A6712] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#26332D] leading-relaxed">
            <strong className="text-[#9A6712] block">
              Consejo clave si usas tarjeta de crédito:
            </strong>
            Registra aquí el <strong>pago mensual de tu tarjeta</strong> en su fecha límite de pago (en lugar de anotar cada compra individual hecha con la tarjeta) para no duplicar salidas de tu cuenta bancaria.
          </div>
        </div>

        {onboardingDraft.fixedExpenses.length > 0 && (
          <div className="space-y-2 mb-3 max-h-[26vh] overflow-y-auto pr-1">
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
                    Día {exp.dayOfMonth} de cada mes •{" "}
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
            Añadir un gasto recurrente mensual
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
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#68736B] shrink-0">
                Día del mes:
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
                className="w-full px-2.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs tabular-nums text-[#26332D]"
              />
            </div>
          </div>

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
            <span>Agregar este compromiso a la lista</span>
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
