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
import type {
  AmountType,
  PriorityLevel,
  RecurrenceEditScope,
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
    confirmExpensePayment,
    confirmIncomeReceipt,
    rescheduleTransaction,
    cancelTransaction,
    referenceDate,
  } = useFinanceStore();

  // Estados compartidos para P12, P12B, P13, P13B
  const isIncomeScreen = activeScreen === "P13" || activeScreen === "P13B";
  const isSettledMode = activeScreen === "P12B" || activeScreen === "P13B";

  const [title, setTitle] = useState(
    isIncomeScreen
      ? isSettledMode
        ? "Reembolso gastos médicos"
        : "Bono trimestral productividad"
      : isSettledMode
      ? "Farmacia San Pablo"
      : "Servicio de agua SACMEX"
  );
  const [amountStr, setAmountStr] = useState(
    isIncomeScreen
      ? isSettledMode
        ? "1250.00"
        : "3500.00"
      : isSettledMode
      ? "480.00"
      : "420.00"
  );
  const [dateVal, setDateVal] = useState(
    isSettledMode ? "2026-11-12" : selectedDate || "2026-11-20"
  );
  const [categoryId, setCategoryId] = useState(
    isIncomeScreen
      ? "cat-freelance"
      : isSettledMode
      ? "cat-salud"
      : "cat-servicios"
  );
  const [priority, setPriority] = useState<PriorityLevel>(
    isSettledMode ? "important" : "essential"
  );
  const [amountType, setAmountType] = useState<AmountType>(
    isSettledMode ? "fixed" : "variable"
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (activeScreen === "P12") {
      setTitle("Servicio de agua SACMEX");
      setAmountStr("420.00");
      setDateVal("2026-11-20");
      setCategoryId("cat-servicios");
      setPriority("essential");
      setAmountType("variable");
    } else if (activeScreen === "P12B") {
      setTitle("Farmacia San Pablo");
      setAmountStr("480.00");
      setDateVal("2026-11-12"); // Fecha anterior al 18/11 para demostrar el banner azul informativo de corte
      setCategoryId("cat-salud");
      setPriority("important");
      setAmountType("fixed");
    } else if (activeScreen === "P13") {
      setTitle("Proyecto consultoría UX");
      setAmountStr("4500.00");
      setDateVal("2026-11-26");
      setCategoryId("cat-freelance");
      setPriority("important");
      setAmountType("variable");
    } else if (activeScreen === "P13B") {
      setTitle("Venta monitor usado");
      setAmountStr("1800.00");
      setDateVal("2026-11-10"); // Fecha anterior al 18/11 para demostrar el banner azul informativo de corte
      setCategoryId("cat-freelance");
      setPriority("flexible");
      setAmountType("fixed");
    }
  }, [activeScreen]);

  // Transacción seleccionada para P14, P15, P16, P17
  const selectedTx =
    transactions.find((t) => t.id === selectedTransactionId) ||
    transactions.find((t) => t.id === "tx-exp-05") ||
    transactions[0];

  const [confirmAmountStr, setConfirmAmountStr] = useState("680.00");
  const [confirmDateStr, setConfirmDateStr] = useState(referenceDate);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [rescheduleDateStr, setRescheduleDateStr] = useState("2026-11-20");

  // Estados para P17 (Alcance de edición recurrente)
  const [scopeChoice, setScopeChoice] =
    useState<RecurrenceEditScope>("future");
  const [scopeAmountStr, setScopeAmountStr] = useState("249.00");
  const [scopeTitleStr, setScopeTitleStr] = useState("Netflix estándar");

  useEffect(() => {
    if (activeScreen === "P15") {
      const target =
        selectedTx?.type === "expense"
          ? selectedTx
          : transactions.find((t) => t.id === "tx-exp-05") || selectedTx;
      const est = target?.estimated_amount ?? 650;
      // En P15 pre-llenamos $680 para mostrar el badge de diferencia (+$30.00 más de lo estimado) si es Luz CFE
      setConfirmAmountStr(
        target?.id === "tx-exp-05" ? "680.00" : String(est.toFixed(2))
      );
      setConfirmDateStr(referenceDate);
      setConfirmNotes(target?.notes || "");
    } else if (activeScreen === "P16") {
      const target =
        selectedTx?.type === "income"
          ? selectedTx
          : transactions.find((t) => t.id === "tx-inc-02") || selectedTx;
      const est = target?.estimated_amount ?? 3000;
      setConfirmAmountStr(String(est.toFixed(2)));
      setConfirmDateStr(referenceDate);
      setConfirmNotes(target?.notes || "");
    } else if (activeScreen === "P17") {
      const target =
        selectedTx?.recurrence_rule_id
          ? selectedTx
          : transactions.find((t) => t.id === "tx-exp-07") || selectedTx;
      setScopeTitleStr(target?.title || "Netflix estándar");
      setScopeAmountStr(String((target?.estimated_amount ?? 249).toFixed(2)));
    }
  }, [activeScreen, selectedTx, transactions, referenceDate]);

  // === P12, P12B, P13, P13B: Formulario Dinámico de Nuevo Gasto / Nuevo Ingreso ===
  if (
    activeScreen === "P12" ||
    activeScreen === "P12B" ||
    activeScreen === "P13" ||
    activeScreen === "P13B"
  ) {
    const parsedAmount = Number(amountStr) || 0;
    const isPriorToCutoff =
      isSettledMode && isDateBeforeOpeningBalance(dateVal, account);

    const availableCats = categories.filter(
      (c) =>
        c.is_active &&
        (c.kind === (isIncomeScreen ? "income" : "expense") ||
          c.kind === "both")
    );

    const handleSave = (e: React.FormEvent) => {
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

      const created = createTransaction({
        type: isIncomeScreen ? "income" : "expense",
        title: title.trim() || (isIncomeScreen ? "Ingreso" : "Gasto"),
        category_id: categoryId,
        priority,
        status,
        amount_type: amountType,
        estimated_amount: parsedAmount,
        actual_amount: isSettledMode ? parsedAmount : null,
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
            {isIncomeScreen ? "Nuevo ingreso" : "Nuevo gasto"}
          </h1>
          <span className="text-[11px] font-bold text-[#34483D] bg-[#E8DCCB] px-2 py-0.5 rounded-md">
            {activeScreen === "P12B"
              ? "P12-B"
              : activeScreen === "P13B"
              ? "P13-B"
              : activeScreen}
          </span>
        </div>

        {/* Conmutador de Tipo: Gasto vs Ingreso */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#E4E6DE]/70 mb-4">
          <button
            type="button"
            onClick={() =>
              setActiveScreen(isSettledMode ? "P12B" : "P12")
            }
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
            onClick={() =>
              setActiveScreen(isSettledMode ? "P13B" : "P13")
            }
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isIncomeScreen
                ? "bg-[#FFFFFF] text-[#23845B] shadow-xs"
                : "text-[#68736B]"
            }`}
          >
            Ingreso
          </button>
        </div>

        {/* Conmutador de Estado Dinámico (Pendiente/Programado vs Pagado/Recibido - PRD 6.4) */}
        <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E4E6DE] mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#68736B] mb-2">
            Estado del movimiento
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveScreen(isIncomeScreen ? "P13" : "P12")
              }
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
              onClick={() =>
                setActiveScreen(isIncomeScreen ? "P13B" : "P12B")
              }
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isSettledMode
                  ? "bg-[#23845B] text-white border-[#23845B]"
                  : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
              }`}
            >
              {isIncomeScreen ? "Ya recibido" : "Ya pagado"}
            </button>
          </div>
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
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B]">
                  {amountType === "variable" && !isSettledMode ? "~$" : "$"}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D]"
                />
              </div>
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
                placeholder="Ej. Recibo de luz CFE"
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

          {/* Banner informativo azul cuando la fecha real es anterior a opening_balance_date (PRD 4.6, P12-B y P13-B) */}
          {isPriorToCutoff && (
            <div className="p-3.5 rounded-2xl bg-[#F0F5FA] border border-[#CFE0EE] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#527A9A] shrink-0 mt-0.5" />
              <div className="text-xs text-[#26332D] leading-relaxed">
                <strong className="text-[#527A9A] block mb-0.5">
                  Movimiento anterior a tu fecha de corte (
                  {formatDateDDMMYYYY(account.opening_balance_date)})
                </strong>
                Este {isIncomeScreen ? "ingreso recibido" : "gasto pagado"} el{" "}
                <strong>{formatDateDDMMYYYY(dateVal)}</strong> se sumará a tus totales de noviembre y a tu presupuesto mensual, pero{" "}
                <strong>no modificará tu saldo actual ({formatMXN(account.opening_balance)})</strong> porque ya estaba contemplado cuando definiste tu saldo inicial.
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

            <div className="flex items-center justify-between pt-2 border-t border-[#E4E6DE]">
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

            <div>
              <label className="block text-xs font-semibold text-[#68736B] mb-1">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Referencia o método de pago"
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

  // === P14: Detalle de un Movimiento (con Tarjeta "Estimado vs. Real" y Bitácora) ===
  if (activeScreen === "P14") {
    const tx = selectedTx;
    const overdue = isExpenseOverdue(tx, referenceDate);
    const delayed = isIncomeDelayed(tx, referenceDate);
    const catName =
      categories.find((c) => c.id === tx.category_id)?.name || "Servicios";
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
            <span>Volver</span>
          </button>
          <span className="text-xs font-bold text-[#26332D]">
            Detalle de movimiento
          </span>
          <span className="text-[11px] font-bold text-[#34483D] bg-[#E8DCCB] px-2 py-0.5 rounded-md">
            P14
          </span>
        </div>

        {/* Selector rápido de movimiento de ejemplo para inspección en P14 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "tx-exp-05", label: "Luz CFE (Vencido)" },
            { id: "tx-exp-04", label: "Gasolina (Pagado c/dif)" },
            { id: "tx-inc-02", label: "Freelance (Atrasado)" },
            { id: "tx-exp-07", label: "Netflix (Recurrente)" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedTransactionId(item.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 border cursor-pointer ${
                tx.id === item.id
                  ? "bg-[#34483D] text-white border-[#34483D]"
                  : "bg-[#FFFFFF] text-[#68736B] border-[#E4E6DE]"
              }`}
            >
              {item.label}
            </button>
          ))}
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

        {/* Tarjeta comparativa "Estimado vs. Real" (PRD 6.3 / P14) */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
              Comparativa: Estimado vs. Real
            </h2>
            <span className="text-[11px] font-semibold text-[#34483D] bg-[#F0F1EB] px-2 py-0.5 rounded-md">
              {tx.amount_type === "variable" ? "Monto variable (~)" : "Monto fijo"}
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
                    Regla recurrente vinculada
                  </div>
                  <div className="text-[#68736B]">{linkedRule.notes}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreen("P17")}
                className="px-2.5 py-1 rounded-lg bg-[#F0F1EB] hover:bg-[#E8DCCB] text-[#34483D] font-semibold cursor-pointer"
              >
                Alcance (P17)
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

        {/* Historial de cambios (audit_log) */}
        {txAuditEntries.length > 0 && (
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#68736B]">
              <History className="w-3.5 h-3.5" />
              <span>Bitácora de cambios (audit_log)</span>
            </div>
            {txAuditEntries.map((entry) => (
              <div
                key={entry.id}
                className="text-[11px] text-[#68736B] flex items-center justify-between py-1 border-t border-[#E4E6DE]"
              >
                <span>
                  Campo <strong>{entry.field_changed}</strong>:{" "}
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
              <span>Confirmar pago (P15)</span>
            </button>
          )}

          {tx.type === "income" && tx.status !== "received" && (
            <button
              type="button"
              onClick={() => setActiveScreen("P16")}
              className="w-full py-3.5 px-4 rounded-xl bg-[#23845B] hover:bg-[#1D6E4B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar recepción de ingreso (P16)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen("P17")}
              className="py-2.5 px-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar alcance (P17)</span>
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
        </div>
      </div>
    );
  }

  // === P15: Confirmar Pago de Gasto (con vista previa en vivo "Así cambiará tu panorama") ===
  if (activeScreen === "P15") {
    const target =
      selectedTx?.type === "expense"
        ? selectedTx
        : transactions.find((t) => t.id === "tx-exp-05") || selectedTx;
    const estAmount = target?.estimated_amount ?? 650;
    const realAmount = Number(confirmAmountStr) || 0;
    const diff = roundCurrency(realAmount - estAmount);

    const newCurrentBalance = roundCurrency(
      monthProjection.currentBalance - realAmount
    );
    // El saldo proyectado ya restaba estAmount; al pagar realAmount, cambia en -diff
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
          <span className="text-[11px] font-bold text-[#34483D] bg-[#E8DCCB] px-2 py-0.5 rounded-md">
            P15
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
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={confirmAmountStr}
                  onChange={(e) => setConfirmAmountStr(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D]"
                />
              </div>

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
                placeholder="Ej. Pagado con tarjeta de débito terminación 4821"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs text-[#26332D]"
              />
            </div>
          </div>

          {/* Tarjeta "Así cambiará tu panorama" (PRD P15) */}
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

  // === P16: Confirmar Recepción de Ingreso (con vista previa en vivo "Así cambiará tu panorama") ===
  if (activeScreen === "P16") {
    const target =
      selectedTx?.type === "income"
        ? selectedTx
        : transactions.find((t) => t.id === "tx-inc-02") || selectedTx;
    const estAmount = target?.estimated_amount ?? 3000;
    const realAmount = Number(confirmAmountStr) || 0;
    const wasDelayed = isIncomeDelayed(target, referenceDate);

    const newCurrentBalance = roundCurrency(
      monthProjection.currentBalance + realAmount
    );
    // Si era un ingreso atrasado (como Proyecto freelance $3,000 del 16/11), estaba excluido del proyectado; al confirmarse ahora sí se suma completo al proyectado
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
          <span className="text-[11px] font-bold text-[#23845B] bg-[#EDF7F2] px-2 py-0.5 rounded-md">
            P16
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
              +{formatMXN(estAmount, { approximate: target.amount_type === "variable" })}
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
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#23845B]">
                  +$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={confirmAmountStr}
                  onChange={(e) => setConfirmAmountStr(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#23845B]"
                />
              </div>
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

  // === P17: Alcance de Edición Recurrente (PRD 4.4) ===
  const target =
    selectedTx?.recurrence_rule_id
      ? selectedTx
      : transactions.find((t) => t.id === "tx-exp-07") || selectedTx;

  const handleApplyScope = (e: React.FormEvent) => {
    e.preventDefault();
    updateTransaction(
      target.id,
      {
        title: scopeTitleStr,
        estimated_amount: Number(scopeAmountStr) || target.estimated_amount,
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
          Alcance de edición recurrente
        </span>
        <span className="text-[11px] font-bold text-[#34483D] bg-[#E8DCCB] px-2 py-0.5 rounded-md">
          P17
        </span>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#34483D] font-bold">
          <Repeat className="w-4 h-4" />
          <span>Editando compromiso periódico: {target.title}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Concepto
            </label>
            <input
              type="text"
              value={scopeTitleStr}
              onChange={(e) => setScopeTitleStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Nuevo monto (MXN)
            </label>
            <input
              type="number"
              step="0.01"
              value={scopeAmountStr}
              onChange={(e) => setScopeAmountStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleApplyScope} className="space-y-3 flex-1">
        <div className="text-xs font-bold text-[#26332D]">
          ¿A qué ocurrencias deseas aplicar este cambio?
        </div>

        {(
          [
            {
              id: "single",
              title: "Solo este pago",
              desc: `Modifica únicamente la ocurrencia del ${formatDateDDMMYYYY(
                target.expected_date
              )} como una excepción puntual. La regla general no cambia.`,
            },
            {
              id: "future",
              title: "Este y los siguientes",
              desc: `Actualiza esta ocurrencia (${formatDateDDMMYYYY(
                target.expected_date
              )}) y todas las futuras pendientes (ej. Diciembre 2026 en adelante).`,
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

        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white font-semibold text-sm transition cursor-pointer"
        >
          Aplicar cambio con este alcance
        </button>
      </form>
    </div>
  );
}
