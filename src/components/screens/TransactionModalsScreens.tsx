"use client";

import React, { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  formatDateDDMMYYYY,
  formatMXN,
  getEffectiveAmount,
  isDateBeforeOpeningBalance,
  isExpenseOverdue,
  isIncomeDelayed,
  roundCurrency,
} from "@/lib/finance/engine";
import {
  PriorityBadge,
  PriorityGeometryIcon,
  StatusBadge,
} from "@/components/ui/PriorityBadge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type {
  AmountType,
  PriorityLevel,
  RecurrenceEditScope,
  RecurrenceFrequency,
} from "@/lib/finance/types";
import {
  ArrowLeft,
  Info,
  Repeat,
  CheckCircle2,
  Calendar,
  FileText,
  Sparkles,
  History,
  XCircle,
  Edit3,
  ShieldAlert,
  Trash2,
} from "lucide-react";

export function TransactionModalsScreens() {
  const {
    activeScreen,
    setActiveScreen,
    selectedDate,
    selectedTransactionId,
    setSelectedTransactionId,
    account,
    categories,
    transactions,
    recurrenceRules,
    auditLog,
    monthProjection,
    budgetSummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    confirmExpensePayment,
    confirmIncomeReceipt,
    rescheduleTransaction,
    cancelTransaction,
    createRecurrenceRule,
    referenceDate,
  } = useFinanceStore();

  // Estados compartidos para formulario de Nuevo Gasto / Nuevo Ingreso
  const isIncomeScreen = activeScreen === "P13" || activeScreen === "P13B";
  const isSettledMode = activeScreen === "P12B" || activeScreen === "P13B";

  const [title, setTitle] = useState("");
  const [amountNum, setAmountNum] = useState(0);
  const [dateVal, setDateVal] = useState(selectedDate || referenceDate);
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState<PriorityLevel>("essential");
  const [amountType, setAmountType] = useState<AmountType>("fixed");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurrenceFrequency>("monthly");
  const [notes, setNotes] = useState("");

  const availableCats = categories.filter(
    (c) =>
      c.is_active &&
      (c.kind === (isIncomeScreen ? "income" : "expense") || c.kind === "both")
  );

  useEffect(() => {
    if (
      activeScreen === "P12" ||
      activeScreen === "P12B" ||
      activeScreen === "P13" ||
      activeScreen === "P13B"
    ) {
      setDateVal(selectedDate || referenceDate);
      const firstMatchingCat = categories.find(
        (c) =>
          c.is_active &&
          (c.kind ===
            (activeScreen === "P13" || activeScreen === "P13B"
              ? "income"
              : "expense") ||
            c.kind === "both")
      );
      if (firstMatchingCat) {
        setCategoryId(firstMatchingCat.id);
        setPriority(firstMatchingCat.default_priority);
      }
    }
  }, [activeScreen, selectedDate, referenceDate, categories]);

  // Transacción seleccionada para Detalle, Confirmación o Alcance
  const selectedTx =
    transactions.find((t) => t.id === selectedTransactionId) || transactions[0];

  const [confirmAmountNum, setConfirmAmountNum] = useState(0);
  const [confirmDateStr, setConfirmDateStr] = useState(referenceDate);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [rescheduleDateStr, setRescheduleDateStr] = useState(referenceDate);

  // Estados para Edición de Movimiento / Alcance Recurrente
  const [scopeChoice, setScopeChoice] =
    useState<RecurrenceEditScope>("future");
  const [scopeAmountNum, setScopeAmountNum] = useState(0);
  const [scopeTitleStr, setScopeTitleStr] = useState("");

  useEffect(() => {
    if (activeScreen === "P14" && selectedTx) {
      setRescheduleDateStr(selectedTx.expected_date);
    } else if (activeScreen === "P15" && selectedTx) {
      setConfirmAmountNum(
        selectedTx.actual_amount ?? selectedTx.estimated_amount ?? 0
      );
      setConfirmDateStr(referenceDate);
      setConfirmNotes(selectedTx.notes || "");
    } else if (activeScreen === "P16" && selectedTx) {
      setConfirmAmountNum(
        selectedTx.actual_amount ?? selectedTx.estimated_amount ?? 0
      );
      setConfirmDateStr(referenceDate);
      setConfirmNotes(selectedTx.notes || "");
    } else if (activeScreen === "P17" && selectedTx) {
      setScopeTitleStr(selectedTx.title);
      setScopeAmountNum(
        selectedTx.actual_amount ?? selectedTx.estimated_amount ?? 0
      );
      setScopeChoice(selectedTx.recurrence_rule_id ? "future" : "single");
    }
  }, [activeScreen, selectedTx, referenceDate]);

  // === Formulario Dinámico de Nuevo Gasto / Nuevo Ingreso ===
  if (
    activeScreen === "P12" ||
    activeScreen === "P12B" ||
    activeScreen === "P13" ||
    activeScreen === "P13B"
  ) {
    const isPriorToCutoff =
      isSettledMode && isDateBeforeOpeningBalance(dateVal, account);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const status = isIncomeScreen
        ? isSettledMode
          ? "received"
          : "scheduled"
        : isSettledMode
        ? "paid"
        : dateVal < referenceDate
        ? "overdue"
        : "pending";

      const dayOfMonth = Number(dateVal.split("-")[2]) || 1;

      if (isRecurring) {
        await createRecurrenceRule({
          type: isIncomeScreen ? "income" : "expense",
          title:
            title.trim() ||
            (isIncomeScreen ? "Ingreso recurrente" : "Gasto recurrente"),
          category_id: categoryId || null,
          priority,
          amount_type: amountType,
          default_amount: amountNum > 0 ? amountNum : null,
          frequency: recurringFrequency,
          interval_count: 1,
          day_of_month: dayOfMonth,
          semimonthly_days:
            recurringFrequency === "semimonthly" ? "15,last" : null,
          day_of_week: null,
          start_date: dateVal,
          end_date: null,
          status: "active",
          notes:
            notes.trim() ||
            `Frecuencia ${
              recurringFrequency === "monthly" ? "mensual" : "quincenal"
            }`,
        });
      } else {
        const created = await createTransaction({
          type: isIncomeScreen ? "income" : "expense",
          title: title.trim() || (isIncomeScreen ? "Ingreso" : "Gasto"),
          category_id: categoryId || null,
          priority,
          status,
          amount_type: amountType,
          estimated_amount:
            !isSettledMode && amountType === "variable" && amountNum === 0
              ? null
              : amountNum,
          actual_amount: isSettledMode ? amountNum : null,
          expected_date: dateVal,
          settled_date: isSettledMode ? dateVal : null,
          settled_at: isSettledMode
            ? isPriorToCutoff
              ? `${dateVal}T12:00:00.000Z`
              : new Date().toISOString()
            : null,
          recurrence_rule_id: null,
          occurrence_date: null,
          is_exception: false,
          notes: notes.trim() || null,
        });
        setSelectedTransactionId(created.id);
      }

      setTitle("");
      setAmountNum(0);
      setNotes("");
      setIsRecurring(false);
      setActiveScreen("P10");
    };

    return (
      <div className="flex-1 flex flex-col p-4 bg-[#F6F5F0]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          <h1 className="text-base font-bold text-[#26332D]">
            {isIncomeScreen ? "Registrar ingreso" : "Registrar gasto"}
          </h1>
          <span className="text-[11px] font-semibold text-[#34483D] bg-[#E8DCCB] px-2.5 py-0.5 rounded-full">
            {isIncomeScreen ? "Entrada" : "Salida"}
          </span>
        </div>

        {/* Conmutador de Tipo: Gasto vs Ingreso */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#E4E6DE]/70 mb-4">
          <button
            type="button"
            onClick={() => setActiveScreen(isSettledMode ? "P12B" : "P12")}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              !isIncomeScreen
                ? "bg-[#FFFFFF] text-[#26332D] shadow-xs"
                : "text-[#68736B]"
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setActiveScreen(isSettledMode ? "P13B" : "P13")}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isIncomeScreen
                ? "bg-[#FFFFFF] text-[#23845B] shadow-xs"
                : "text-[#68736B]"
            }`}
          >
            Ingreso
          </button>
        </div>

        {/* Conmutador de Estado Dinámico */}
        <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E4E6DE] mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#68736B] mb-2">
            ¿En qué estado se encuentra este movimiento?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen(isIncomeScreen ? "P13" : "P12")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                !isSettledMode
                  ? "bg-[#34483D] text-white border-[#34483D]"
                  : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
              }`}
            >
              {isIncomeScreen
                ? "Programado (Por recibir)"
                : "Pendiente (Por pagar)"}
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen(isIncomeScreen ? "P13B" : "P12B")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isSettledMode
                  ? "bg-[#23845B] text-white border-[#23845B]"
                  : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
              }`}
            >
              {isIncomeScreen ? "Ya recibido" : "Ya pagado"}
            </button>
          </div>
          <p className="text-[11px] text-[#68736B] mt-2 leading-relaxed">
            {!isSettledMode
              ? isIncomeScreen
                ? "Se agendará en el calendario y sumará a tu Saldo Proyectado hasta que confirmes su cobro."
                : "Se agendará en el calendario y se descontará de tu Saldo Proyectado y Presupuesto Disponible."
              : isIncomeScreen
              ? "Impactará de inmediato tu Saldo Actual porque el dinero ya ingresó a tu cuenta."
              : "Descontará de inmediato tu Saldo Actual porque el pago ya fue realizado."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 flex-1">
          {/* Tarjeta principal de Monto y Concepto */}
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                {isSettledMode
                  ? isIncomeScreen
                    ? "Monto real recibido (MXN)"
                    : "Monto real pagado (MXN)"
                  : "Monto estimado (MXN)"}
              </label>
              <CurrencyInput
                value={amountNum}
                onChange={(_, num) => setAmountNum(num)}
                prefix={
                  amountType === "variable" && !isSettledMode ? "~$" : "$"
                }
                placeholder={
                  isIncomeScreen ? "Ej. 12,000.00" : "Ej. 650.00"
                }
                required={isSettledMode || amountType === "fixed"}
              />
              {!isSettledMode && amountType === "variable" && (
                <p className="text-[11px] text-[#68736B] mt-1">
                  Si aún no conoces el monto aproximado del recibo, puedes dejarlo en <strong>0.00</strong> y se marcará como &ldquo;Monto por definir&rdquo;.
                </p>
              )}
            </div>

            {!isSettledMode && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#68736B]">
                  Naturaleza del monto:
                </span>
                <div className="inline-flex rounded-xl bg-[#F0F1EB] p-0.5 border border-[#E4E6DE]">
                  <button
                    type="button"
                    onClick={() => setAmountType("fixed")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      amountType === "fixed"
                        ? "bg-[#FFFFFF] text-[#26332D] shadow-2xs"
                        : "text-[#68736B]"
                    }`}
                  >
                    Fijo ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountType("variable")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      amountType === "variable"
                        ? "bg-[#FFFFFF] text-[#26332D] shadow-2xs"
                        : "text-[#68736B]"
                    }`}
                  >
                    Variable (~$)
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Concepto o título
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isIncomeScreen
                    ? "Ej. Quincena de nómina, Proyecto diseño, Venta..."
                    : "Ej. Recibo de luz CFE, Supermercado, Gasolina..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-medium text-[#26332D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                {isSettledMode
                  ? isIncomeScreen
                    ? "Fecha real de recepción"
                    : "Fecha real de pago"
                  : isIncomeScreen
                  ? "Fecha esperada de cobro"
                  : "Fecha esperada de vencimiento"}
              </label>
              <input
                type="date"
                required
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-medium text-[#26332D]"
              />
            </div>
          </div>

          {/* Banner informativo azul cuando la fecha real es anterior a opening_balance_date */}
          {isPriorToCutoff && (
            <div className="p-3.5 rounded-2xl bg-[#F0F5FA] border border-[#CFE0EE] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#527A9A] shrink-0 mt-0.5" />
              <div className="text-xs text-[#26332D] leading-relaxed">
                <strong className="text-[#527A9A] block mb-0.5">
                  Movimiento anterior a tu fecha de corte (
                  {formatDateDDMMYYYY(account.opening_balance_date)})
                </strong>
                Este {isIncomeScreen ? "ingreso recibido" : "gasto pagado"} el{" "}
                <strong>{formatDateDDMMYYYY(dateVal)}</strong> se sumará a tus estadísticas del mes y a tu presupuesto mensual, pero{" "}
                <strong>
                  no modificará tu saldo actual ({formatMXN(account.opening_balance)})
                </strong>{" "}
                porque ya estaba contemplado cuando definiste tu saldo inicial.
              </div>
            </div>
          )}

          {/* Categoría y Prioridad con Geometrías */}
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  const newCatId = e.target.value;
                  setCategoryId(newCatId);
                  const found = categories.find((c) => c.id === newCatId);
                  if (found) setPriority(found.default_priority);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-medium text-[#26332D]"
              >
                {availableCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {!isIncomeScreen && (
              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                  Prioridad del gasto (Forma + Etiqueta)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "essential", label: "Esencial" },
                      { id: "important", label: "Importante" },
                      { id: "flexible", label: "Flexible" },
                    ] as const
                  ).map((p) => {
                    const active = priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          active
                            ? "bg-[#34483D] text-white border-[#34483D]"
                            : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                        }`}
                      >
                        <PriorityGeometryIcon priority={p.id} size="sm" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E4E6DE] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#26332D]">
                  <Repeat className="w-4 h-4 text-[#34483D]" />
                  <span>¿Se repite periódicamente?</span>
                </div>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-[#34483D]"
                />
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRecurringFrequency("monthly")}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      recurringFrequency === "monthly"
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringFrequency("biweekly")}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      recurringFrequency === "biweekly"
                        ? "bg-[#34483D] text-white border-[#34483D]"
                        : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    Quincenal
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Número de referencia, tarjeta utilizada o recordatorio"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm shadow-sm transition cursor-pointer"
          >
            {isSettledMode
              ? isIncomeScreen
                ? "Guardar ingreso recibido"
                : "Guardar gasto pagado"
              : isIncomeScreen
              ? "Programar ingreso en calendario"
              : "Guardar compromiso en calendario"}
          </button>
        </form>
      </div>
    );
  }

  // Si no existe ningún movimiento seleccionado
  if (!selectedTx) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-sm font-bold text-[#26332D]">
          No hay ningún movimiento seleccionado
        </p>
        <button
          type="button"
          onClick={() => setActiveScreen("P10")}
          className="px-4 py-2.5 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
        >
          Volver al calendario
        </button>
      </div>
    );
  }

  // === Detalle de un Movimiento (con Tarjeta "Estimado vs. Real" y Bitácora) ===
  if (activeScreen === "P14") {
    const tx = selectedTx;
    const overdue = isExpenseOverdue(tx, referenceDate);
    const delayed = isIncomeDelayed(tx, referenceDate);
    const catName =
      categories.find((c) => c.id === tx.category_id)?.name || "General";
    const linkedRule = recurrenceRules.find(
      (r) => r.id === tx.recurrence_rule_id
    );
    const txAuditEntries = auditLog.filter((a) => a.entity_id === tx.id);

    const diff =
      tx.actual_amount !== null && tx.estimated_amount !== null
        ? roundCurrency(tx.actual_amount - tx.estimated_amount)
        : null;

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al calendario</span>
          </button>
          <span className="text-xs font-bold text-[#26332D]">
            Detalle de movimiento
          </span>
        </div>

        {/* Hero Card del Movimiento */}
        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <StatusBadge
              status={tx.status}
              isOverdueExpense={overdue}
              isDelayedIncome={delayed}
            />
            {tx.type === "expense" && (
              <PriorityBadge priority={tx.priority} />
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-[#68736B]">{catName}</div>
            <h1 className="text-xl font-bold text-[#26332D] mt-0.5">
              {tx.title}
            </h1>
            <div
              className={`text-3xl font-bold tabular-nums mt-2 ${
                tx.type === "income"
                  ? "text-[#23845B]"
                  : overdue
                  ? "text-[#C94C4C]"
                  : "text-[#26332D]"
              }`}
            >
              {formatMXN(getEffectiveAmount(tx), {
                showPlusSign: tx.type === "income",
                showMinusSign: tx.type === "expense",
                approximate:
                  tx.amount_type === "variable" &&
                  tx.status !== "paid" &&
                  tx.status !== "received",
              })}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E4E6DE] text-xs">
            <div>
              <span className="text-[#68736B] block">Fecha esperada</span>
              <span className="font-bold text-[#26332D] tabular-nums">
                {formatDateDDMMYYYY(tx.expected_date)}
              </span>
            </div>
            <div>
              <span className="text-[#68736B] block">
                {tx.type === "income"
                  ? "Fecha real de cobro"
                  : "Fecha real de pago"}
              </span>
              <span className="font-bold text-[#26332D] tabular-nums">
                {tx.settled_date
                  ? formatDateDDMMYYYY(tx.settled_date)
                  : "Pendiente por confirmar"}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta comparativa "Estimado vs. Real" */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
              Comparativa: Estimado vs. Real
            </h2>
            <span className="text-[11px] font-semibold text-[#34483D] bg-[#F0F1EB] px-2 py-0.5 rounded-md">
              {tx.amount_type === "variable"
                ? "Monto variable (~)"
                : "Monto fijo"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#F6F5F0]">
              <div className="text-[11px] text-[#68736B]">Monto estimado</div>
              <div className="text-sm font-bold tabular-nums text-[#26332D] mt-0.5">
                {formatMXN(tx.estimated_amount, {
                  approximate: tx.amount_type === "variable",
                })}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#F6F5F0]">
              <div className="text-[11px] text-[#68736B]">Monto real</div>
              <div className="text-sm font-bold tabular-nums text-[#26332D] mt-0.5">
                {tx.actual_amount !== null
                  ? formatMXN(tx.actual_amount)
                  : "Sin confirmar"}
              </div>
            </div>
          </div>

          {diff !== null && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                diff <= 0
                  ? "bg-[#EDF7F2] text-[#23845B]"
                  : "bg-[#FEF6E7] text-[#9A6712]"
              }`}
            >
              <span>Diferencia al liquidar:</span>
              <span className="tabular-nums">
                {diff === 0
                  ? "Exactamente igual a lo estimado"
                  : diff < 0
                  ? `${formatMXN(Math.abs(diff))} menos de lo estimado`
                  : `${formatMXN(diff)} más de lo estimado`}
              </span>
            </div>
          )}
        </div>

        {/* Regla recurrente y Notas */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3 text-xs">
          {linkedRule && (
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6DE]">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#34483D]" />
                <div>
                  <div className="font-bold text-[#26332D]">
                    Compromiso recurrente vinculado
                  </div>
                  <div className="text-[#68736B]">
                    {linkedRule.notes || "Se repite automáticamente"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreen("P17")}
                className="px-2.5 py-1 rounded-lg bg-[#F0F1EB] hover:bg-[#E8DCCB] text-[#34483D] font-semibold cursor-pointer"
              >
                Editar serie
              </button>
            </div>
          )}

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-[#68736B] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#26332D]">Notas</div>
              <p className="text-[#68736B] mt-0.5">
                {tx.notes || "Sin notas adicionales registradas."}
              </p>
            </div>
          </div>

          {/* Reprogramación rápida */}
          {tx.status !== "paid" && tx.status !== "received" && (
            <div className="pt-3 border-t border-[#E4E6DE] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#68736B]" />
                <input
                  type="date"
                  value={rescheduleDateStr}
                  onChange={(e) => setRescheduleDateStr(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#F0F1EB] border border-[#E4E6DE] text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => rescheduleTransaction(tx.id, rescheduleDateStr)}
                className="px-3 py-1.5 rounded-xl bg-[#F0F1EB] hover:bg-[#E8DCCB] text-[#26332D] font-semibold cursor-pointer"
              >
                Reprogramar fecha
              </button>
            </div>
          )}
        </div>

        {/* Historial de cambios */}
        {txAuditEntries.length > 0 && (
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#68736B]">
              <History className="w-3.5 h-3.5" />
              <span>Historial de actualizaciones</span>
            </div>
            {txAuditEntries.map((entry) => (
              <div
                key={entry.id}
                className="text-[11px] text-[#68736B] flex items-center justify-between py-1 border-t border-[#E4E6DE]"
              >
                <span>
                  Cambio en <strong>{entry.field_changed}</strong>:{" "}
                  {entry.old_value ?? "vacío"} →{" "}
                  <strong className="text-[#26332D]">{entry.new_value}</strong>
                </span>
                <span className="tabular-nums">
                  {formatDateDDMMYYYY(entry.changed_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Acciones principales del movimiento */}
        <div className="space-y-2 pt-1">
          {tx.type === "expense" && tx.status !== "paid" && (
            <button
              type="button"
              onClick={() => setActiveScreen("P15")}
              className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar pago</span>
            </button>
          )}

          {tx.type === "income" && tx.status !== "received" && (
            <button
              type="button"
              onClick={() => setActiveScreen("P16")}
              className="w-full py-3.5 px-4 rounded-xl bg-[#23845B] hover:bg-[#1D6E4B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar recepción de ingreso</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen("P17")}
              className="py-2.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar concepto o monto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                cancelTransaction(tx.id);
                setActiveScreen("P10");
              }}
              className="py-2.5 px-3 rounded-xl bg-[#FDF2F2] border border-[#F5CACA] text-xs font-semibold text-[#C94C4C] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar compromiso</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              deleteTransaction(tx.id);
              setActiveScreen("P10");
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-transparent hover:bg-[#FDF2F2] text-xs font-semibold text-[#C94C4C] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar movimiento permanentemente</span>
          </button>
        </div>
      </div>
    );
  }

  // === Confirmar Pago de Gasto (con vista previa en vivo "Así cambiará tu panorama") ===
  if (activeScreen === "P15") {
    const target = selectedTx;
    const estAmount = target.estimated_amount ?? 0;
    const realAmount = confirmAmountNum;
    const diff = roundCurrency(realAmount - estAmount);

    const newCurrentBalance = roundCurrency(
      monthProjection.currentBalance - realAmount
    );
    const newProjectedBalance = roundCurrency(
      (monthProjection.projectedClosingBalance ?? 0) - diff
    );
    const newAvailableBudget = roundCurrency(
      budgetSummary.availableBudget - diff
    );

    const handleConfirmExpense = (e: React.FormEvent) => {
      e.preventDefault();
      confirmExpensePayment({
        transactionId: target.id,
        actualAmount: realAmount,
        settledDate: confirmDateStr,
        notes: confirmNotes,
      });
      setActiveScreen("P10");
    };

    return (
      <div className="flex-1 flex flex-col p-4 bg-[#F6F5F0] space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen("P14")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
          <span className="text-sm font-bold text-[#26332D]">
            Confirmar pago de gasto
          </span>
        </div>

        {/* Resumen del gasto a confirmar */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#26332D]">
                {target.title}
              </span>
              <PriorityBadge priority={target.priority} compact />
            </div>
            <div className="text-xs text-[#68736B] mt-0.5">
              Vencimiento original: {formatDateDDMMYYYY(target.expected_date)} • Estimado:{" "}
              <strong className="tabular-nums">{formatMXN(estAmount)}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleConfirmExpense} className="space-y-4 flex-1">
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Monto real pagado (MXN)
              </label>
              <CurrencyInput
                value={confirmAmountNum}
                onChange={(_, num) => setConfirmAmountNum(num)}
                placeholder="Ej. 650.00"
                required
              />

              {/* Badge de diferencia contra estimado */}
              <div className="mt-2">
                {diff === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDF7F2] text-[#23845B] text-xs font-semibold">
                    Exactamente igual al monto estimado ({formatMXN(estAmount)})
                  </span>
                ) : diff > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF6E7] text-[#9A6712] text-xs font-semibold tabular-nums">
                    +{formatMXN(diff)} más de lo estimado ({formatMXN(estAmount)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EDF7F2] text-[#23845B] text-xs font-semibold tabular-nums">
                    {formatMXN(Math.abs(diff))} menos de lo estimado ({formatMXN(estAmount)})
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Fecha real en que realizaste el pago
              </label>
              <input
                type="date"
                required
                value={confirmDateStr}
                onChange={(e) => setConfirmDateStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-medium text-[#26332D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Nota o comprobante (opcional)
              </label>
              <input
                type="text"
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Ej. Pagado con tarjeta de débito o transferencia"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              />
            </div>
          </div>

          {/* Tarjeta "Así cambiará tu panorama" */}
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#34483D]">
              <Sparkles className="w-4 h-4 text-[#D99A32]" />
              <span>Así cambiará tu panorama al confirmar</span>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between py-1 border-b border-[#E4E6DE]">
                <span className="text-[#68736B]">Saldo actual en cuenta:</span>
                <span className="font-bold tabular-nums text-[#26332D]">
                  {formatMXN(monthProjection.currentBalance)} →{" "}
                  <span className="text-[#34483D]">
                    {formatMXN(newCurrentBalance)}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E4E6DE]">
                <span className="text-[#68736B]">
                  Saldo proyectado fin de mes:
                </span>
                <span className="font-bold tabular-nums text-[#26332D]">
                  {formatMXN(monthProjection.projectedClosingBalance)} →{" "}
                  <span className="text-[#23845B]">
                    {formatMXN(newProjectedBalance)}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#68736B]">
                  Disponible en presupuesto:
                </span>
                <span className="font-bold tabular-nums text-[#26332D]">
                  {formatMXN(budgetSummary.availableBudget)} →{" "}
                  <span className="text-[#23845B]">
                    {formatMXN(newAvailableBudget)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar como pagado</span>
          </button>
        </form>
      </div>
    );
  }

  // === Confirmar Recepción de Ingreso (con vista previa en vivo "Así cambiará tu panorama") ===
  if (activeScreen === "P16") {
    const target = selectedTx;
    const estAmount = target.estimated_amount ?? 0;
    const realAmount = confirmAmountNum;
    const wasDelayed = isIncomeDelayed(target, referenceDate);

    const newCurrentBalance = roundCurrency(
      monthProjection.currentBalance + realAmount
    );
    const newProjectedBalance = wasDelayed
      ? roundCurrency(
          (monthProjection.projectedClosingBalance ?? 0) + realAmount
        )
      : roundCurrency(
          (monthProjection.projectedClosingBalance ?? 0) +
            (realAmount - estAmount)
        );

    const handleConfirmIncome = (e: React.FormEvent) => {
      e.preventDefault();
      confirmIncomeReceipt({
        transactionId: target.id,
        actualAmount: realAmount,
        settledDate: confirmDateStr,
        notes: confirmNotes,
      });
      setActiveScreen("P10");
    };

    return (
      <div className="flex-1 flex flex-col p-4 bg-[#F6F5F0] space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveScreen("P14")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
          <span className="text-sm font-bold text-[#26332D]">
            Confirmar recepción de ingreso
          </span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE]">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-[#26332D]">
              {target.title}
            </span>
            <StatusBadge
              status={target.status}
              isDelayedIncome={wasDelayed}
              compact
            />
          </div>
          <div className="text-xs text-[#68736B] mt-1">
            Fecha esperada: {formatDateDDMMYYYY(target.expected_date)} • Monto esperado:{" "}
            <strong className="tabular-nums text-[#23845B]">
              +
              {formatMXN(estAmount, {
                approximate: target.amount_type === "variable",
              })}
            </strong>
          </div>
        </div>

        {wasDelayed && (
          <div className="p-3.5 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] text-xs text-[#26332D] leading-relaxed">
            <strong className="text-[#23845B] block mb-0.5">
              Ingreso atrasado que se incorpora a tu saldo
            </strong>
            Como este ingreso estaba atrasado desde el{" "}
            {formatDateDDMMYYYY(target.expected_date)}, por seguridad no estaba sumado a tu saldo proyectado. Al confirmarlo hoy, se sumará tanto a tu saldo actual como a tu cierre proyectado del mes.
          </div>
        )}

        <form onSubmit={handleConfirmIncome} className="space-y-4 flex-1">
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                Monto real recibido (MXN)
              </label>
              <CurrencyInput
                value={confirmAmountNum}
                onChange={(_, num) => setConfirmAmountNum(num)}
                prefix="+$"
                placeholder="Ej. 3,000.00"
                required
                inputClassName="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#23845B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Fecha real de recepción
              </label>
              <input
                type="date"
                required
                value={confirmDateStr}
                onChange={(e) => setConfirmDateStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-medium text-[#26332D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Nota o referencia (opcional)
              </label>
              <input
                type="text"
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Ej. Transferencia SPEI recibida"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              />
            </div>
          </div>

          {/* Tarjeta "Así cambiará tu panorama" */}
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#23845B]">
              <Sparkles className="w-4 h-4" />
              <span>Así cambiará tu panorama al confirmar cobro</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-[#E4E6DE]">
              <span className="text-[#68736B]">Saldo actual:</span>
              <span className="font-bold tabular-nums text-[#26332D]">
                {formatMXN(monthProjection.currentBalance)} →{" "}
                <span className="text-[#23845B]">
                  {formatMXN(newCurrentBalance)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#68736B]">
                Saldo proyectado fin de mes:
              </span>
              <span className="font-bold tabular-nums text-[#26332D]">
                {formatMXN(monthProjection.projectedClosingBalance)} →{" "}
                <span className="text-[#23845B]">
                  {formatMXN(newProjectedBalance)}
                </span>
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[#23845B] hover:bg-[#1D6E4B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar ingreso recibido</span>
          </button>
        </form>
      </div>
    );
  }

  // === Editar Movimiento y Alcance de Edición Recurrente ===
  const target = selectedTx;

  const handleApplyScope = (e: React.FormEvent) => {
    e.preventDefault();
    updateTransaction(
      target.id,
      {
        title: scopeTitleStr.trim() || target.title,
        estimated_amount: scopeAmountNum,
        actual_amount:
          target.status === "paid" || target.status === "received"
            ? scopeAmountNum
            : target.actual_amount,
      },
      scopeChoice
    );
    setActiveScreen("P14");
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#F6F5F0] space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveScreen("P14")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68736B] hover:text-[#26332D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
        <span className="text-sm font-bold text-[#26332D]">
          {target.recurrence_rule_id
            ? "Editar compromiso recurrente"
            : "Editar movimiento"}
        </span>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#34483D] font-bold">
          <Repeat className="w-4 h-4" />
          <span>Editando: {target.title}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Concepto
            </label>
            <input
              type="text"
              value={scopeTitleStr}
              onChange={(e) => setScopeTitleStr(e.target.value)}
              placeholder="Ej. Netflix estándar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-sm font-semibold text-[#26332D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Monto (MXN)
            </label>
            <CurrencyInput
              value={scopeAmountNum}
              onChange={(_, num) => setScopeAmountNum(num)}
              placeholder="Ej. 249.00"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleApplyScope} className="space-y-3 flex-1">
        {target.recurrence_rule_id && (
          <>
            <div className="text-xs font-bold text-[#26332D]">
              ¿A qué ocurrencias deseas aplicar este cambio?
            </div>

            {(
              [
                {
                  id: "single",
                  title: "Solo este movimiento",
                  desc: `Modifica únicamente la ocurrencia del ${formatDateDDMMYYYY(
                    target.expected_date
                  )} como una excepción puntual. La regla general no cambia.`,
                },
                {
                  id: "future",
                  title: "Este y los siguientes",
                  desc: `Actualiza esta ocurrencia (${formatDateDDMMYYYY(
                    target.expected_date
                  )}) y todas las futuras pendientes de la serie.`,
                },
                {
                  id: "all_pending",
                  title: "Todos los pendientes",
                  desc: "Actualiza todas las ocurrencias pendientes o vencidas aún no liquidadas de esta regla.",
                },
              ] as const
            ).map((opt) => {
              const selected = scopeChoice === opt.id;
              return (
                <label
                  key={opt.id}
                  onClick={() => setScopeChoice(opt.id)}
                  className={`block p-4 rounded-2xl border transition cursor-pointer ${
                    selected
                      ? "bg-[#FFFFFF] border-[#34483D] shadow-xs"
                      : "bg-[#F0F1EB]/70 border-[#E4E6DE]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="recurrenceScope"
                      checked={selected}
                      onChange={() => setScopeChoice(opt.id)}
                      className="accent-[#34483D]"
                    />
                    <span className="text-sm font-bold text-[#26332D]">
                      {opt.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#68736B] mt-1.5 pl-6 leading-relaxed">
                    {opt.desc}
                  </p>
                </label>
              );
            })}

            <div className="p-3.5 rounded-2xl bg-[#F0F5FA] border border-[#CFE0EE] flex items-start gap-2.5 text-xs text-[#26332D]">
              <ShieldAlert className="w-4 h-4 text-[#527A9A] shrink-0 mt-0.5" />
              <span>
                <strong>Protección de historial:</strong> Los pagos o ingresos que ya fueron confirmados como liquidados en el pasado nunca se alteran con cambios masivos.
              </span>
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
