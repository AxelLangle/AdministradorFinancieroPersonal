"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import { formatDateDDMMYYYY, formatMXN } from "@/lib/finance/engine";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
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
} from "lucide-react";

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
  } = useFinanceStore();

  const [newIncomeTitle, setNewIncomeTitle] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseDay, setNewExpenseDay] = useState("15");
  const [newExpensePriority, setNewExpensePriority] =
    useState<PriorityLevel>("essential");

  const currentStepObj =
    ONBOARDING_STEPS.find((s) => s.id === activeScreen) || ONBOARDING_STEPS[0];

  const renderStepHeader = (prevScreen: ScreenId) => (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setActiveScreen(prevScreen)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <span className="text-xs font-bold text-[#34483D]">
          Paso {currentStepObj.step} de 5 • {currentStepObj.label}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {ONBOARDING_STEPS.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setActiveScreen(st.id)}
            className={`h-1.5 rounded-full transition cursor-pointer ${
              st.step <= currentStepObj.step ? "bg-[#34483D]" : "bg-[#E4E6DE]"
            }`}
          />
        ))}
      </div>
    </div>
  );

  // P05: Paso 1 - Saldo inicial
  if (activeScreen === "P05") {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]">
        <div>
          {renderStepHeader("P02")}

          <div className="w-10 h-10 rounded-2xl bg-[#34483D]/10 text-[#34483D] flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            ¿Con cuánto dinero cuentas hoy?
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-6">
            Ingresa el dinero líquido disponible hoy en tu cuenta principal (débito + efectivo disponible).
          </p>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-sm space-y-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Saldo disponible actual (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={onboardingDraft.openingBalance}
                  onChange={(e) =>
                    setOnboardingDraft((prev) => ({
                      ...prev,
                      openingBalance: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D] focus:outline-none focus:border-[#34483D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Fecha de corte del saldo inicial
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
                Formato local: {formatDateDDMMYYYY(onboardingDraft.openingDate)} • Zona horaria America/Mexico_City
              </span>
            </div>
          </div>

          {/* Nota crítica PRD 4.6 */}
          <div className="p-4 rounded-2xl bg-[#F0F5FA] border border-[#CFE0EE] flex items-start gap-3">
            <Info className="w-4 h-4 text-[#527A9A] shrink-0 mt-0.5" />
            <div className="text-xs text-[#26332D] leading-relaxed">
              <strong className="text-[#527A9A] block mb-0.5">
                Sin doble conteo en tu saldo
              </strong>
              Si después registras pagos o ingresos que ya ocurrieron antes del{" "}
              <strong>{formatDateDDMMYYYY(onboardingDraft.openingDate)}</strong>,
              se sumarán a tu historial y presupuesto del mes, pero no alterarán este saldo inicial porque ya están reflejados en tu dinero de hoy.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P06")}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Continuar al presupuesto</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // P06: Paso 2 - Presupuesto mensual
  if (activeScreen === "P06") {
    const presets = [12000, 15000, 20000, 25000];
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]">
        <div>
          {renderStepHeader("P05")}

          <div className="w-10 h-10 rounded-2xl bg-[#34483D]/10 text-[#34483D] flex items-center justify-center mb-3">
            <Target className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            Define tu presupuesto mensual
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-5">
            Es el techo total que deseas destinar a tus gastos del mes (tanto pagados como pendientes por pagar).
          </p>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-sm space-y-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Límite mensual de gastos (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B]">
                  $
                </span>
                <input
                  type="number"
                  step="100"
                  value={onboardingDraft.monthlyBudget}
                  onChange={(e) =>
                    setOnboardingDraft((prev) => ({
                      ...prev,
                      monthlyBudget: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D]"
                />
              </div>
            </div>

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
                      : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE] hover:bg-[#E8DCCB]/50"
                  }`}
                >
                  {formatMXN(val, { showPrefix: false })}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E4E6DE]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#26332D]">
                  Alerta preventiva de presupuesto
                </span>
                <span className="font-bold text-[#D99A32] tabular-nums">
                  Al llegar al {onboardingDraft.alertThresholdPercent}%
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
              <p className="text-[11px] text-[#68736B] mt-1">
                Colchón mínimo sugerido en cuenta (10%):{" "}
                <strong className="tabular-nums text-[#26332D]">
                  {formatMXN(onboardingDraft.monthlyBudget * 0.1)}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P07")}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Elegir categorías</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // P07: Paso 3 - Categorías iniciales
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
      <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]">
        <div>
          {renderStepHeader("P06")}

          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            Tus categorías y prioridades
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-4">
            Cada categoría asigna automáticamente una prioridad sugerida (Esencial, Importante o Flexible) para que sepas qué gastos puedes recortar si el mes se aprieta.
          </p>

          <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {activeCats.map((cat) => {
              const selected = onboardingDraft.selectedCategories.includes(
                cat.id
              );
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCat(cat.id)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition text-left cursor-pointer ${
                    selected
                      ? "bg-[#FFFFFF] border-[#34483D] shadow-xs"
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
                        {cat.kind === "income" ? "Ingreso" : "Gasto"}
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
          className="w-full mt-5 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Configurar ingresos esperados</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // P08: Paso 4 - Primeros ingresos
  if (activeScreen === "P08") {
    const handleAddIncome = () => {
      if (!newIncomeTitle.trim() || !newIncomeAmount) return;
      setOnboardingDraft((prev) => ({
        ...prev,
        incomes: [
          ...prev.incomes,
          {
            id: `onb-inc-${Date.now()}`,
            title: newIncomeTitle.trim(),
            amount: Number(newIncomeAmount) || 0,
            frequency: "monthly",
            dayOfMonth: 30,
          },
        ],
      }));
      setNewIncomeTitle("");
      setNewIncomeAmount("");
    };

    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]">
        <div>
          {renderStepHeader("P07")}

          <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
            Tus ingresos recurrentes
          </h1>
          <p className="text-xs text-[#68736B] leading-relaxed mb-5">
            Registra tu sueldo o ingresos fijos para que el calendario calcule cuánto te quedará libre antes y después de cada cobro.
          </p>

          <div className="space-y-2.5 mb-4">
            {onboardingDraft.incomes.map((inc) => (
              <div
                key={inc.id}
                className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E4E6DE] flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-[#26332D]">
                    {inc.title}
                  </div>
                  <div className="text-xs text-[#68736B]">
                    {inc.frequency === "semimonthly"
                      ? "Quincenal (Días 15 y fin de mes)"
                      : `Mensual (Día ${inc.dayOfMonth})`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-[#23845B]">
                    +{formatMXN(inc.amount)}
                  </span>
                  {onboardingDraft.incomes.length > 1 && (
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
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E4E6DE] space-y-3">
            <div className="text-xs font-bold text-[#26332D]">
              Agregar otro ingreso esperado
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newIncomeTitle}
                onChange={(e) => setNewIncomeTitle(e.target.value)}
                placeholder="Ej. Bono o Freelance"
                className="px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              />
              <input
                type="number"
                value={newIncomeAmount}
                onChange={(e) => setNewIncomeAmount(e.target.value)}
                placeholder="Monto MXN"
                className="px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs tabular-nums text-[#26332D]"
              />
            </div>
            <button
              type="button"
              onClick={handleAddIncome}
              className="w-full py-2 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#34483D] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir ingreso a la lista</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen("P09")}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Último paso: Gastos fijos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // P09: Paso 5 - Gastos fijos recurrentes
  const handleAddFixedExpense = () => {
    if (!newExpenseTitle.trim() || !newExpenseAmount) return;
    setOnboardingDraft((prev) => ({
      ...prev,
      fixedExpenses: [
        ...prev.fixedExpenses,
        {
          id: `onb-exp-${Date.now()}`,
          title: newExpenseTitle.trim(),
          amount: Number(newExpenseAmount) || 0,
          dayOfMonth: Number(newExpenseDay) || 15,
          priority: newExpensePriority,
          amountType: "fixed",
          categoryId: "cat-servicios",
        },
      ],
    }));
    setNewExpenseTitle("");
    setNewExpenseAmount("");
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#F6F5F0]">
      <div>
        {renderStepHeader("P08")}

        <h1 className="text-2xl font-bold text-[#26332D] mb-1.5">
          Gastos fijos y recurrentes
        </h1>
        <p className="text-xs text-[#68736B] leading-relaxed mb-4">
          Programa tus pagos de cada mes (renta, luz, internet, suscripciones) para verlos anticipadamente en tu calendario.
        </p>

        {/* Aviso de Regla de Tarjetas de Crédito (PRD 3.2 y 7.2) */}
        <div className="p-3.5 rounded-2xl bg-[#FEF9EE] border border-[#F5E1B9] flex items-start gap-2.5 mb-4">
          <CreditCard className="w-4 h-4 text-[#9A6712] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#26332D] leading-relaxed">
            <strong className="text-[#9A6712] block">
              ¿Usas tarjeta de crédito?
            </strong>
            Registra el <strong>pago mensual de tu tarjeta</strong> como un gasto recurrente en su fecha límite de pago (en lugar de registrar cada compra individual con tarjeta) para no duplicar salidas de tu cuenta líquida.
          </div>
        </div>

        <div className="space-y-2 mb-4 max-h-[34vh] overflow-y-auto pr-1">
          {onboardingDraft.fixedExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E4E6DE] flex items-center justify-between"
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

        <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E4E6DE] space-y-2.5">
          <div className="text-xs font-bold text-[#26332D]">
            Añadir otro compromiso fijo
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={newExpenseTitle}
              onChange={(e) => setNewExpenseTitle(e.target.value)}
              placeholder="Ej. Pago TDC"
              className="col-span-2 px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs"
            />
            <input
              type="number"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              placeholder="Monto $"
              className="px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs tabular-nums"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#68736B]">Día:</span>
              <input
                type="number"
                min={1}
                max={31}
                value={newExpenseDay}
                onChange={(e) => setNewExpenseDay(e.target.value)}
                className="w-14 px-2 py-1 rounded-lg bg-[#F0F1EB] border border-[#E4E6DE] text-xs tabular-nums"
              />
            </div>
            <select
              value={newExpensePriority}
              onChange={(e) =>
                setNewExpensePriority(e.target.value as PriorityLevel)
              }
              className="px-2.5 py-1 rounded-lg bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
            >
              <option value="essential">● Esencial</option>
              <option value="important">◆ Importante</option>
              <option value="flexible">○ Flexible</option>
            </select>
            <button
              type="button"
              onClick={handleAddFixedExpense}
              className="px-3 py-1.5 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#34483D] cursor-pointer"
            >
              + Agregar
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={completeOnboarding}
        className="w-full mt-5 py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
      >
        <span>Ir a mi calendario financiero</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
