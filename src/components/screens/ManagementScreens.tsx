"use client";

import React, { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  formatDateDDMMYYYY,
  formatMXN,
  formatNumberWithCommas,
  getEffectiveAmount,
} from "@/lib/finance/engine";
import {
  PriorityBadge,
  PriorityGeometryIcon,
} from "@/components/ui/PriorityBadge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type {
  AmountType,
  PriorityLevel,
  RecurrenceFrequency,
  TransactionType,
} from "@/lib/finance/types";
import {
  ArrowLeft,
  Plus,
  Repeat,
  Tag,
  Bell,
  Settings,
  PauseCircle,
  PlayCircle,
  Lock,
  ChevronRight,
  Database,
  History,
  LogOut,
  BookOpen,
  Sparkles,
  Moon,
  Sun,
  Trash2,
  Target,
} from "lucide-react";

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Cada 2 semanas",
  semimonthly: "Quincenal (15 y último)",
  monthly: "Mensual",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
};

export function ManagementScreens() {
  const {
    activeScreen,
    setActiveScreen,
    user,
    logout,
    syncWithSupabase,
    isSyncing,
    syncStatusMessage,
    account,
    updateAccountOpeningBalance,
    budget,
    updateBudget,
    recurrenceRules,
    selectedRuleId,
    setSelectedRuleId,
    createRecurrenceRule,
    updateRecurrenceRule,
    deleteRecurrenceRule,
    toggleRecurrenceRuleStatus,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    createCategory,
    updateCategory,
    transactions,
    setSelectedTransactionId,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    auditLog,
    theme,
    toggleTheme,
    setIsTutorialOpen,
    referenceDate,
  } = useFinanceStore();

  const [ruleTab, setRuleTab] = useState<"active" | "paused">("active");

  // Estados para Reglas recurrentes
  const [ruleType, setRuleType] = useState<TransactionType>("expense");
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleAmountNum, setRuleAmountNum] = useState(0);
  const [ruleAmountType, setRuleAmountType] = useState<AmountType>("fixed");
  const [ruleFreq, setRuleFreq] = useState<RecurrenceFrequency>("monthly");
  const [ruleDay, setRuleDay] = useState("1");
  const [rulePriority, setRulePriority] = useState<PriorityLevel>("essential");
  const [ruleCategoryId, setRuleCategoryId] = useState("");
  const [ruleNotes, setRuleNotes] = useState("");

  // Estados para Categorías
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState<"expense" | "income" | "both">(
    "expense"
  );
  const [catPriority, setCatPriority] = useState<PriorityLevel>("important");
  const [catActive, setCatActive] = useState(true);

  // Estados para Configuración de Saldo Inicial, Corte y Límite mensual
  const [cfgBalanceNum, setCfgBalanceNum] = useState(account.opening_balance);
  const [cfgDate, setCfgDate] = useState(account.opening_balance_date);
  const [cfgBudgetLimitNum, setCfgBudgetLimitNum] = useState(
    budget.total_limit
  );

  const selectedRule =
    recurrenceRules.find((r) => r.id === selectedRuleId) ||
    recurrenceRules[0];

  const selectedCat =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  useEffect(() => {
    if (activeScreen === "P24" && selectedRule) {
      setRuleType(selectedRule.type);
      setRuleTitle(selectedRule.title);
      setRuleAmountNum(selectedRule.default_amount ?? 0);
      setRuleAmountType(selectedRule.amount_type);
      setRuleFreq(selectedRule.frequency);
      setRuleDay(String(selectedRule.day_of_month ?? 1));
      setRulePriority(selectedRule.priority);
      setRuleCategoryId(
        selectedRule.category_id || categories[0]?.id || ""
      );
      setRuleNotes(selectedRule.notes || "");
    } else if (activeScreen === "P23") {
      setRuleType("expense");
      setRuleTitle("");
      setRuleAmountNum(0);
      setRuleAmountType("fixed");
      setRuleFreq("monthly");
      setRuleDay("1");
      setRulePriority("essential");
      setRuleCategoryId(categories[0]?.id || "");
      setRuleNotes("");
    } else if (activeScreen === "P27" && selectedCat) {
      setCatName(selectedCat.name);
      setCatKind(selectedCat.kind);
      setCatPriority(selectedCat.default_priority);
      setCatActive(selectedCat.is_active);
    } else if (activeScreen === "P26") {
      setCatName("");
      setCatKind("expense");
      setCatPriority("important");
      setCatActive(true);
    } else if (activeScreen === "P29") {
      setCfgBalanceNum(account.opening_balance);
      setCfgDate(account.opening_balance_date);
      setCfgBudgetLimitNum(budget.total_limit);
    }
  }, [activeScreen, selectedRule, selectedCat, account, budget.total_limit, categories]);

  // === Lista de Reglas Recurrentes (Activas / Pausadas) ===
  if (activeScreen === "P22") {
    const shownRules = recurrenceRules.filter((r) => r.status === ruleTab);
    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen("P28")}
              className="p-1.5 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#68736B] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
                Compromisos periódicos
              </span>
              <h1 className="text-xl font-bold text-[#26332D]">Recurrentes</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen("P23")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva regla</span>
          </button>
        </div>

        {/* Pestañas Activas vs Pausadas */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#E4E6DE]/70">
          <button
            type="button"
            onClick={() => setRuleTab("active")}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              ruleTab === "active"
                ? "bg-[#FFFFFF] text-[#26332D] shadow-2xs"
                : "text-[#68736B]"
            }`}
          >
            Activas (
            {recurrenceRules.filter((r) => r.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setRuleTab("paused")}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              ruleTab === "paused"
                ? "bg-[#FFFFFF] text-[#26332D] shadow-2xs"
                : "text-[#68736B]"
            }`}
          >
            Pausadas (
            {recurrenceRules.filter((r) => r.status === "paused").length})
          </button>
        </div>

        <div className="space-y-2.5 flex-1">
          {shownRules.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E4E6DE] text-center space-y-2">
              <div className="text-sm font-bold text-[#26332D]">
                No tienes reglas {ruleTab === "active" ? "activas" : "pausadas"}
              </div>
              <p className="text-xs text-[#68736B]">
                Automatiza tus ingresos fijos (nómina) y tus gastos periódicos (renta, luz, internet, suscripciones) para que se programen cada mes.
              </p>
              {ruleTab === "active" && (
                <button
                  type="button"
                  onClick={() => setActiveScreen("P23")}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#34483D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear primera regla recurrente</span>
                </button>
              )}
            </div>
          ) : (
            shownRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => {
                  setSelectedRuleId(rule.id);
                  setActiveScreen("P24");
                }}
                className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] hover:border-[#91A68C] transition flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#26332D]">
                      {rule.title}
                    </span>
                    {rule.type === "expense" && (
                      <PriorityBadge priority={rule.priority} compact />
                    )}
                  </div>
                  <div className="text-xs text-[#68736B]">
                    {FREQ_LABELS[rule.frequency]} •{" "}
                    {rule.frequency === "semimonthly"
                      ? "Días 15 y fin de mes"
                      : `Día ${rule.day_of_month} de cada periodo`}
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      rule.type === "income"
                        ? "text-[#23845B]"
                        : "text-[#26332D]"
                    }`}
                  >
                    {formatMXN(rule.default_amount, {
                      showPrefix: false,
                      showPlusSign: rule.type === "income",
                      showMinusSign: rule.type === "expense",
                      approximate: rule.amount_type === "variable",
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRecurrenceRuleStatus(rule.id);
                    }}
                    className="text-[11px] font-semibold text-[#34483D] underline cursor-pointer"
                  >
                    {rule.status === "active" ? "Pausar" : "Reactivar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // === Nueva Regla Recurrente y Editar Regla Recurrente con Historial Bloqueado ===
  if (activeScreen === "P23" || activeScreen === "P24") {
    const isEdit = activeScreen === "P24" && Boolean(selectedRule);
    const ruleOccurrences =
      isEdit && selectedRule
        ? transactions.filter((t) => t.recurrence_rule_id === selectedRule.id)
        : [];
    const settledOccurrences = ruleOccurrences.filter(
      (t) => t.status === "paid" || t.status === "received"
    );
    const pendingOccurrences = ruleOccurrences.filter(
      (t) => t.status !== "paid" && t.status !== "received"
    );

    const handleSaveRule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isEdit && selectedRule) {
        await updateRecurrenceRule(selectedRule.id, {
          type: ruleType,
          title: ruleTitle.trim() || selectedRule.title,
          default_amount: ruleAmountNum,
          amount_type: ruleAmountType,
          frequency: ruleFreq,
          day_of_month: Number(ruleDay) || 1,
          priority: rulePriority,
          category_id: ruleCategoryId || null,
          notes: ruleNotes,
        });
      } else {
        await createRecurrenceRule({
          type: ruleType,
          title: ruleTitle.trim() || "Compromiso recurrente",
          category_id: ruleCategoryId || null,
          priority: rulePriority,
          amount_type: ruleAmountType,
          default_amount: ruleAmountNum,
          frequency: ruleFreq,
          interval_count: 1,
          day_of_month: Number(ruleDay) || 1,
          semimonthly_days: ruleFreq === "semimonthly" ? "15,last" : null,
          day_of_week: null,
          start_date: referenceDate,
          end_date: null,
          status: "active",
          notes: ruleNotes || null,
        });
      }
      setActiveScreen("P22");
    };

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen("P22")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Recurrentes</span>
          </button>
          <span className="text-sm font-bold text-[#26332D]">
            {isEdit ? "Editar regla recurrente" : "Nueva regla recurrente"}
          </span>
        </div>

        <form onSubmit={handleSaveRule} className="space-y-4 flex-1">
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRuleType("expense")}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  ruleType === "expense"
                    ? "bg-[#34483D] text-white border-[#34483D]"
                    : "bg-[#F0F1EB] text-[#68736B] border-[#E4E6DE]"
                }`}
              >
                Gasto recurrente
              </button>
              <button
                type="button"
                onClick={() => setRuleType("income")}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  ruleType === "income"
                    ? "bg-[#23845B] text-white border-[#23845B]"
                    : "bg-[#F0F1EB] text-[#68736B] border-[#E4E6DE]"
                }`}
              >
                Ingreso recurrente
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Concepto de la regla
              </label>
              <input
                type="text"
                required
                value={ruleTitle}
                onChange={(e) => setRuleTitle(e.target.value)}
                placeholder={
                  ruleType === "income"
                    ? "Ej. Nómina quincenal, Renta cobrada..."
                    : "Ej. Renta departamento, Internet, Netflix, Gimnasio..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-semibold text-[#26332D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Monto base (MXN)
              </label>
              <CurrencyInput
                value={ruleAmountNum}
                onChange={(_, num) => setRuleAmountNum(num)}
                prefix={ruleAmountType === "variable" ? "~$" : "$"}
                placeholder="Ej. 1,200.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1">
                  Tipo de monto
                </label>
                <select
                  value={ruleAmountType}
                  onChange={(e) =>
                    setRuleAmountType(e.target.value as AmountType)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
                >
                  <option value="fixed">Fijo ($ exacto)</option>
                  <option value="variable">Variable (~$ estimado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1">
                  Categoría
                </label>
                <select
                  value={ruleCategoryId}
                  onChange={(e) => setRuleCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
                >
                  {categories
                    .filter((c) => c.is_active)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1">
                  Frecuencia
                </label>
                <select
                  value={ruleFreq}
                  onChange={(e) =>
                    setRuleFreq(e.target.value as RecurrenceFrequency)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
                >
                  {Object.entries(FREQ_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1">
                  Día del mes (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={ruleDay}
                  onChange={(e) =>
                    setRuleDay(e.target.value.replace(/^0+(?=\d)/, ""))
                  }
                  placeholder="Ej. 15"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                />
              </div>
            </div>

            {ruleType === "expense" && (
              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                  Prioridad del compromiso
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "essential", label: "Esencial" },
                      { id: "important", label: "Importante" },
                      { id: "flexible", label: "Flexible" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRulePriority(p.id)}
                      className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        rulePriority === p.id
                          ? "bg-[#34483D] text-white border-[#34483D]"
                          : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                      }`}
                    >
                      <PriorityGeometryIcon priority={p.id} size="sm" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={ruleNotes}
                onChange={(e) => setRuleNotes(e.target.value)}
                placeholder="Ej. Cargo domiciliado o número de contrato"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              />
            </div>
          </div>

          {/* En edición mostramos las próximas ocurrencias pendientes y las ya pagadas bloqueadas con candado */}
          {isEdit && selectedRule && (
            <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
                  Ocurrencias generadas ({ruleOccurrences.length})
                </h3>
                <button
                  type="button"
                  onClick={() => toggleRecurrenceRuleStatus(selectedRule.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#34483D] cursor-pointer"
                >
                  {selectedRule.status === "active" ? (
                    <>
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Pausar regla</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Reactivar regla</span>
                    </>
                  )}
                </button>
              </div>

              {pendingOccurrences.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#23845B]">
                    Próximas ocurrencias pendientes (Se actualizarán al guardar):
                  </div>
                  {pendingOccurrences.map((occ) => (
                    <div
                      key={occ.id}
                      className="p-2.5 rounded-xl bg-[#F6F5F0] flex items-center justify-between text-xs"
                    >
                      <span>{formatDateDDMMYYYY(occ.expected_date)}</span>
                      <span className="font-bold tabular-nums">
                        {formatMXN(getEffectiveAmount(occ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {settledOccurrences.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#E4E6DE]">
                  <div className="text-[11px] font-semibold text-[#68736B] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>
                      Historial ya liquidado (Protegido, no se altera):
                    </span>
                  </div>
                  {settledOccurrences.map((occ) => (
                    <div
                      key={occ.id}
                      className="p-2.5 rounded-xl bg-[#F0F1EB]/70 flex items-center justify-between text-xs text-[#68736B]"
                    >
                      <span>
                        {formatDateDDMMYYYY(
                          occ.settled_date || occ.expected_date
                        )}{" "}
                        • Confirmado
                      </span>
                      <span className="font-bold tabular-nums">
                        {formatMXN(getEffectiveAmount(occ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm cursor-pointer"
          >
            {isEdit
              ? "Guardar cambios en regla recurrente"
              : "Crear regla recurrente"}
          </button>

          {isEdit && selectedRule && (
            <button
              type="button"
              onClick={() => {
                deleteRecurrenceRule(selectedRule.id);
                setActiveScreen("P22");
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-[#FDF2F2] text-xs font-semibold text-[#C94C4C] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar regla recurrente</span>
            </button>
          )}
        </form>
      </div>
    );
  }

  // === Categorías (Activas e Inactivas que conservan historial) ===
  if (activeScreen === "P25") {
    const activeCats = categories.filter((c) => c.is_active);
    const inactiveCats = categories.filter((c) => !c.is_active);

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen("P28")}
              className="p-1.5 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#68736B] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
                Clasificación y prioridad
              </span>
              <h1 className="text-xl font-bold text-[#26332D]">Categorías</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen("P26")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva</span>
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
            Categorías activas ({activeCats.length})
          </h2>
          {activeCats.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setActiveScreen("P27");
              }}
              className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E4E6DE] hover:border-[#91A68C] flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-sm font-bold text-[#26332D]">
                  {cat.name}
                </div>
                <div className="text-[11px] text-[#68736B]">
                  {cat.kind === "income"
                    ? "Ingreso"
                    : cat.kind === "both"
                    ? "Ingreso y Gasto"
                    : "Gasto"}{" "}
                  • Toca para editar
                </div>
              </div>
              <PriorityBadge priority={cat.default_priority} compact />
            </div>
          ))}
        </div>

        {inactiveCats.length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
              Inactivas • Conservan historial ({inactiveCats.length})
            </h2>
            {inactiveCats.map((cat) => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setActiveScreen("P27");
                }}
                className="bg-[#F0F1EB] rounded-2xl p-3.5 border border-[#E4E6DE] flex items-center justify-between opacity-80 cursor-pointer"
              >
                <div>
                  <div className="text-sm font-bold text-[#68736B]">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-[#68736B]">
                    Desactivada • Sus movimientos pasados se conservan
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#34483D] underline">
                  Reactivar
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === Nueva Categoría y Editar Categoría ===
  if (activeScreen === "P26" || activeScreen === "P27") {
    const isEdit = activeScreen === "P27" && Boolean(selectedCat);
    const handleSaveCat = (e: React.FormEvent) => {
      e.preventDefault();
      if (isEdit && selectedCat) {
        updateCategory(selectedCat.id, {
          name: catName.trim() || selectedCat.name,
          kind: catKind,
          default_priority: catPriority,
          is_active: catActive,
        });
      } else {
        createCategory({
          name: catName.trim() || "Nueva categoría",
          kind: catKind,
          default_priority: catPriority,
          icon: "tag",
          color_token: "forest",
          is_active: true,
        });
      }
      setActiveScreen("P25");
    };

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen("P25")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Categorías</span>
          </button>
          <span className="text-sm font-bold text-[#26332D]">
            {isEdit ? "Editar categoría" : "Nueva categoría"}
          </span>
        </div>

        <form onSubmit={handleSaveCat} className="space-y-4 flex-1">
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Nombre de la categoría
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ej. Mascotas, Educación, Viajes..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-semibold text-[#26332D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Tipo de movimientos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "expense", label: "Gastos" },
                    { id: "income", label: "Ingresos" },
                    { id: "both", label: "Ambos" },
                  ] as const
                ).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setCatKind(k.id)}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      catKind === k.id
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Prioridad sugerida por defecto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "essential", label: "Esencial" },
                    { id: "important", label: "Importante" },
                    { id: "flexible", label: "Flexible" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCatPriority(p.id)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                      catPriority === p.id
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    <PriorityGeometryIcon priority={p.id} size="sm" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {isEdit && (
              <div className="pt-3 border-t border-[#E4E6DE] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#26332D]">
                    Categoría activa para nuevos registros
                  </div>
                  <div className="text-[11px] text-[#68736B]">
                    Si la desactivas, no se borran tus movimientos históricos.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                  className="w-4 h-4 accent-[#34483D]"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm cursor-pointer"
          >
            {isEdit ? "Guardar cambios en categoría" : "Crear categoría"}
          </button>
        </form>
      </div>
    );
  }

  // === Configuración (Límite Mensual, Saldo Inicial, Fecha de Corte y Bitácora) ===
  if (activeScreen === "P29") {
    const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      updateAccountOpeningBalance(cfgBalanceNum, cfgDate);
    };

    const handleSaveMonthlyLimit = async (e: React.FormEvent) => {
      e.preventDefault();
      const newTotal = cfgBudgetLimitNum > 0 ? cfgBudgetLimitNum : 0;
      const pct = budget.min_cushion_percent || 10;
      await updateBudget({
        total_limit: newTotal,
        min_cushion_amount: Math.round(newTotal * (pct / 100) * 100) / 100,
      });
    };

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen("P28")}
            className="min-h-[44px] px-2 -ml-2 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Más</span>
          </button>
          <span className="text-sm font-bold text-[#26332D]">
            Configuración de cuenta
          </span>
        </div>

        {/* Límite de gasto mensual */}
        <form onSubmit={handleSaveMonthlyLimit} className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
                Límite de gasto mensual
              </h2>
              <button
                type="button"
                onClick={() => setActiveScreen("P21")}
                className="text-[11px] font-semibold text-[#34483D] underline cursor-pointer"
              >
                Alertas y colchón
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Límite máximo mensual (MXN)
              </label>
              <CurrencyInput
                value={cfgBudgetLimitNum}
                onChange={(_, num) => setCfgBudgetLimitNum(num)}
                placeholder="Ej. 20,000.00"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[5000, 10000, 15000, 20000, 30000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCfgBudgetLimitNum(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                      cfgBudgetLimitNum === preset
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE] hover:border-[#91A68C]"
                    }`}
                  >
                    ${formatNumberWithCommas(preset, 0)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#68736B] mt-1.5 leading-relaxed">
                Límite actual:{" "}
                <strong className="text-[#26332D]">
                  {formatMXN(budget.total_limit)}
                </strong>
                . Puedes subirlo o bajarlo cuando lo necesites.
              </p>
            </div>

            <button
              type="submit"
              className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white text-xs font-semibold cursor-pointer"
            >
              Guardar límite de gasto mensual
            </button>
          </div>
        </form>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
              Cuenta principal y Regla de Corte
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Saldo inicial verificado (MXN)
              </label>
              <CurrencyInput
                value={cfgBalanceNum}
                onChange={(_, num) => setCfgBalanceNum(num)}
                placeholder="Ej. 6,480.50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Fecha de corte del saldo inicial
              </label>
              <input
                type="date"
                value={cfgDate}
                onChange={(e) => setCfgDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
              />
              <p className="text-[11px] text-[#68736B] mt-1 leading-relaxed">
                Los pagos o ingresos confirmados con fecha anterior al{" "}
                <strong>{formatDateDDMMYYYY(cfgDate)}</strong> no modifican el saldo actual para evitar doble conteo.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
            >
              Actualizar saldo inicial y fecha de corte
            </button>
          </div>
        </form>

        {/* Preferencias Regionales */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-2.5 text-xs">
          <h2 className="font-bold uppercase tracking-wider text-[#68736B]">
            Preferencias regionales
          </h2>
          <div className="flex justify-between py-1 border-b border-[#E4E6DE]">
            <span className="text-[#68736B]">Moneda predeterminada</span>
            <strong className="text-[#26332D]">MXN ($ Peso Mexicano)</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E4E6DE]">
            <span className="text-[#68736B]">Zona horaria</span>
            <strong className="text-[#26332D]">America/Mexico_City</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#68736B]">Inicio de semana</span>
            <strong className="text-[#26332D]">Lunes</strong>
          </div>
        </div>

        {/* Bitácora de Auditoría */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#26332D]">
            <History className="w-4 h-4 text-[#34483D]" />
            <span>Historial de auditoría ({auditLog.length})</span>
          </div>
          {auditLog.length === 0 ? (
            <p className="text-xs text-[#68736B]">
              Aún no se han registrado cambios auditables en tu cuenta.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditLog.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#F6F5F0] text-[11px] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[#26332D]">
                      {item.entity_type} ({item.field_changed}):
                    </span>{" "}
                    <span className="text-[#68736B]">
                      {item.old_value ?? "vacío"} →{" "}
                      <strong className="text-[#23845B]">
                        {item.new_value}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[#68736B] tabular-nums">
                    {formatDateDDMMYYYY(item.changed_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === Centro de Avisos ===
  if (activeScreen === "P30") {
    const unreadNotifs = notifications.filter((n) => !n.read_at);
    const readNotifs = notifications.filter((n) => Boolean(n.read_at));

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen("P10")}
              className="p-1.5 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#68736B] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
                Alertas proactivas
              </span>
              <h1 className="text-xl font-bold text-[#26332D]">
                Centro de avisos
              </h1>
            </div>
          </div>

          {unreadNotifs.length > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-semibold text-[#34483D] underline cursor-pointer"
            >
              Marcar todo leído
            </button>
          )}
        </div>

        {/* Sección Hoy (No leídas) */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#26332D]">
            Nuevos avisos ({unreadNotifs.length})
          </h2>
          {unreadNotifs.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs text-[#68736B]">
              No tienes avisos pendientes de leer.
            </div>
          ) : (
            unreadNotifs.map((n) => (
              <div
                key={n.id}
                className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#34483D]/30 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      title="No leído"
                      className="w-2.5 h-2.5 rounded-full bg-[#23845B] shrink-0"
                    />
                    <h3 className="text-sm font-bold text-[#26332D]">
                      {n.title}
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#68736B] shrink-0">
                    {formatDateDDMMYYYY(n.scheduled_for)}
                  </span>
                </div>

                <p className="text-xs text-[#68736B] leading-relaxed pl-4">
                  {n.body}
                </p>

                <div className="flex items-center gap-2 pl-4 pt-1">
                  {n.type === "overdue" && n.related_transaction_id && (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        setSelectedTransactionId(n.related_transaction_id);
                        setActiveScreen("P15");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirmar pago ahora
                    </button>
                  )}
                  {n.type === "delayed_income" && n.related_transaction_id && (
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        setSelectedTransactionId(n.related_transaction_id);
                        setActiveScreen("P16");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#23845B] text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirmar cobro recibido
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => markNotificationAsRead(n.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#F0F1EB] text-[#68736B] text-xs font-semibold cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sección Leídas */}
        {readNotifs.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
              Avisos anteriores ({readNotifs.length})
            </h2>
            {readNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.related_transaction_id) {
                    setSelectedTransactionId(n.related_transaction_id);
                    setActiveScreen("P14");
                  } else {
                    setActiveScreen("P20");
                  }
                }}
                className="bg-[#FFFFFF]/80 rounded-2xl p-3.5 border border-[#E4E6DE] space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#26332D]">{n.title}</h3>
                  <span className="text-[10px] text-[#68736B]">Leído</span>
                </div>
                <p className="text-xs text-[#68736B] leading-relaxed">
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === Menú Más (Hub de Gestión, Manual, Tutorial, Tema y Sincronización) ===
  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
          Administración y cuenta
        </span>
        <h1 className="text-xl font-bold text-[#26332D]">Más opciones</h1>
      </div>

      {/* Tarjeta de Perfil y Estado de Nube */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#34483D] text-white font-bold text-base flex items-center justify-center">
              {(user.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-[#26332D]">
                {user.name || "Mi cuenta"}
              </div>
              <div className="text-xs text-[#68736B]">
                {user.email || "Espacio personal"}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#EDF7F2] text-[#23845B] text-[11px] font-semibold">
            Cuenta activa
          </span>
        </div>

        <div className="pt-3 border-t border-[#E4E6DE] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[#68736B]">
            <Database className="w-4 h-4 text-[#23845B]" />
            <span>Respaldo seguro en la nube</span>
          </div>
          <button
            type="button"
            onClick={() => syncWithSupabase()}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-[#23845B] text-white text-xs font-semibold cursor-pointer"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>

        {syncStatusMessage && (
          <p className="text-[11px] text-[#23845B] bg-[#EDF7F2] p-2.5 rounded-xl">
            {syncStatusMessage}
          </p>
        )}
      </div>

      {/* Enlaces principales de gestión */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E4E6DE] divide-y divide-[#E4E6DE]">
        <button
          type="button"
          onClick={() => setActiveScreen("P22")}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-[#34483D]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Reglas recurrentes
              </div>
              <div className="text-xs text-[#68736B]">
                Ingresos y gastos fijos periódicos ({recurrenceRules.length})
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen("P25")}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-[#34483D]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Categorías y prioridades
              </div>
              <div className="text-xs text-[#68736B]">
                Esencial, Importante y Flexible ({categories.length})
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen("P30")}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#34483D]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Centro de avisos
              </div>
              <div className="text-xs text-[#68736B]">
                Vencimientos, ingresos atrasados y alertas de presupuesto
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen("P21")}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-[#34483D]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Límite de gasto mensual
              </div>
              <div className="text-xs text-[#68736B]">
                Tope actual: {formatMXN(budget.total_limit)} • Toca para cambiar
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveScreen("P29")}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#34483D]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Configuración y Corte de Saldo
              </div>
              <div className="text-xs text-[#68736B]">
                Saldo inicial ({formatMXN(account.opening_balance)}), límite mensual e historial
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>
      </div>

      {/* Centro de Ayuda, Tutorial y Apariencia */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E4E6DE] divide-y divide-[#E4E6DE]">
        <button
          type="button"
          onClick={() => setActiveScreen("MANUAL")}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#34483D]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Manual completo de la aplicación
              </div>
              <div className="text-xs text-[#68736B]">
                Guía detallada de cada sección, fórmulas y preguntas frecuentes
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>

        <button
          type="button"
          onClick={() => setIsTutorialOpen(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#23845B]" />
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Tutorial interactivo para nuevos usuarios
              </div>
              <div className="text-xs text-[#68736B]">
                Recorrido paso a paso por las funciones principales
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#68736B]" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F6F5F0] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-[#D99A32]" />
            ) : (
              <Moon className="w-5 h-5 text-[#34483D]" />
            )}
            <div className="text-left">
              <div className="text-sm font-bold text-[#26332D]">
                Apariencia: {theme === "dark" ? "Modo Oscuro activo" : "Modo Claro activo"}
              </div>
              <div className="text-xs text-[#68736B]">
                Toca para cambiar a {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-[#F0F1EB] text-[#26332D] text-xs font-semibold">
            Cambiar
          </span>
        </button>
      </div>

      {/* Acciones de sesión y asistente inicial */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => setActiveScreen("P05")}
          className="py-3 px-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] cursor-pointer"
        >
          Asistente inicial
        </button>
        <button
          type="button"
          onClick={logout}
          className="py-3 px-3 rounded-xl bg-[#FDF2F2] border border-[#F5CACA] text-xs font-semibold text-[#C94C4C] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
