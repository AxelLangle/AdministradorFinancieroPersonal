"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  filterTransactions,
  formatDateDDMMYYYY,
  formatMonthYearEs,
  formatMXN,
  getEffectiveAmount,
  getEffectiveDate,
  isExpenseOverdue,
  isIncomeDelayed,
  roundCurrency,
} from "@/lib/finance/engine";
import {
  PriorityBadge,
  PriorityGeometryIcon,
  StatusBadge,
} from "@/components/ui/PriorityBadge";
import type { PriorityLevel, TransactionStatus } from "@/lib/finance/types";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Edit3,
  TrendingDown,
  CalendarClock,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export function HistoryAndBudgetScreens() {
  const {
    activeScreen,
    setActiveScreen,
    currentYearMonth,
    referenceDate,
    transactions,
    categories,
    filters,
    setFilters,
    resetFilters,
    setSelectedTransactionId,
    budget,
    updateBudget,
    monthProjection,
    budgetSummary,
    nextIncomeStretch,
  } = useFinanceStore();

  // Estados para P21 (Editar Presupuesto)
  const [limitInput, setLimitInput] = useState(String(budget.total_limit));
  const [thresholdInput, setThresholdInput] = useState(
    budget.alert_threshold_percent
  );
  const [cushionPercentInput, setCushionPercentInput] = useState(
    budget.min_cushion_percent
  );

  // === P18 (Movimientos) y P19 (Bottom Sheet de Filtros Combinables) ===
  if (activeScreen === "P18" || activeScreen === "P19") {
    // Filtrar movimientos del mes actual o general según búsqueda
    const monthTxs = transactions.filter((tx) =>
      getEffectiveDate(tx).startsWith(currentYearMonth)
    );
    const filtered = filterTransactions(
      monthTxs,
      filters,
      referenceDate
    ).sort((a, b) => getEffectiveDate(b).localeCompare(getEffectiveDate(a)));

    // Agrupar por fecha efectiva
    const groupedByDate = filtered.reduce<Record<string, typeof filtered>>(
      (acc, tx) => {
        const d = getEffectiveDate(tx);
        if (!acc[d]) acc[d] = [];
        acc[d].push(tx);
        return acc;
      },
      {}
    );

    const activeFilterCount =
      (filters.type !== "all" ? 1 : 0) +
      filters.statuses.length +
      filters.priorities.length +
      filters.categoryIds.length +
      (filters.recurrenceFilter !== "all" ? 1 : 0);

    const toggleStatusFilter = (st: TransactionStatus) => {
      setFilters((prev) => ({
        ...prev,
        statuses: prev.statuses.includes(st)
          ? prev.statuses.filter((x) => x !== st)
          : [...prev.statuses, st],
      }));
    };

    const togglePriorityFilter = (pr: PriorityLevel) => {
      setFilters((prev) => ({
        ...prev,
        priorities: prev.priorities.includes(pr)
          ? prev.priorities.filter((x) => x !== pr)
          : [...prev.priorities, pr],
      }));
    };

    const toggleCategoryFilter = (catId: string) => {
      setFilters((prev) => ({
        ...prev,
        categoryIds: prev.categoryIds.includes(catId)
          ? prev.categoryIds.filter((x) => x !== catId)
          : [...prev.categoryIds, catId],
      }));
    };

    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
              Historial y agenda • {formatMonthYearEs(currentYearMonth)}
            </span>
            <h1 className="text-xl font-bold text-[#26332D]">Movimientos</h1>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen("P19")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] hover:bg-[#F0F1EB] shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#34483D]" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#34483D] text-white text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Buscador y pestañas rápidas */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#68736B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              placeholder="Buscar por concepto o nota (ej. CFE, Renta, Gasolina)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs text-[#26332D] focus:outline-none focus:border-[#34483D]"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, searchQuery: "" }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: "all", label: "Todos" },
                { id: "expense", label: "Gastos" },
                { id: "income", label: "Ingresos" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, type: t.id }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  filters.type === t.id
                    ? "bg-[#34483D] text-white border-[#34483D]"
                    : "bg-[#FFFFFF] text-[#68736B] border-[#E4E6DE]"
                }`}
              >
                {t.label}
              </button>
            ))}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[#C94C4C] bg-[#FDF2F2] border border-[#F5CACA] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista agrupada por fecha */}
        <div className="space-y-4 flex-1">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#E4E6DE] text-center space-y-2">
              <div className="text-sm font-bold text-[#26332D]">
                No se encontraron movimientos con estos filtros
              </div>
              <p className="text-xs text-[#68736B]">
                Prueba limpiando los filtros activos o cambiando tu búsqueda.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateKey, dayTxs]) => (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-[#68736B]">
                    {formatDateDDMMYYYY(dateKey)}
                    {dateKey === referenceDate ? " • Hoy" : ""}
                  </span>
                  <span className="text-[11px] text-[#68736B]">
                    {dayTxs.length}{" "}
                    {dayTxs.length === 1 ? "movimiento" : "movimientos"}
                  </span>
                </div>

                {dayTxs.map((tx) => {
                  const overdue = isExpenseOverdue(tx, referenceDate);
                  const delayed = isIncomeDelayed(tx, referenceDate);
                  const catName =
                    categories.find((c) => c.id === tx.category_id)?.name ||
                    "General";
                  const diff =
                    tx.actual_amount !== null && tx.estimated_amount !== null
                      ? roundCurrency(tx.actual_amount - tx.estimated_amount)
                      : 0;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        setSelectedTransactionId(tx.id);
                        setActiveScreen("P14");
                      }}
                      className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E4E6DE] hover:border-[#91A68C] transition flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#26332D] truncate">
                            {tx.title}
                          </span>
                          {tx.type === "expense" && (
                            <PriorityBadge priority={tx.priority} compact />
                          )}
                          <StatusBadge
                            status={tx.status}
                            isOverdueExpense={overdue}
                            isDelayedIncome={delayed}
                            compact
                          />
                        </div>
                        <div className="text-xs text-[#68736B] mt-1">
                          {catName}
                          {diff !== 0 && (
                            <span className="ml-2 text-[#23845B] font-semibold">
                              • Est. {formatMXN(tx.estimated_amount)} (
                              {diff < 0
                                ? `${formatMXN(Math.abs(diff), {
                                    showPrefix: false,
                                  })} menos`
                                : `${formatMXN(diff, {
                                    showPrefix: false,
                                  })} más`}
                              )
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-bold tabular-nums ${
                            tx.type === "income"
                              ? "text-[#23845B]"
                              : overdue
                              ? "text-[#C94C4C]"
                              : "text-[#26332D]"
                          }`}
                        >
                          {formatMXN(getEffectiveAmount(tx), {
                            showPrefix: false,
                            showPlusSign: tx.type === "income",
                            showMinusSign: tx.type === "expense",
                            approximate:
                              tx.amount_type === "variable" &&
                              tx.status !== "paid" &&
                              tx.status !== "received",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* P19: Bottom Sheet de Filtros Combinables */}
        {activeScreen === "P19" && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center">
            <div className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl max-h-[85vh] flex flex-col">
              <div className="w-10 h-1 rounded-full bg-[#E4E6DE] mx-auto mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-[#E4E6DE]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#34483D]">
                    P19 • Filtros combinables
                  </span>
                  <h3 className="text-lg font-bold text-[#26332D]">
                    Filtrar movimientos
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveScreen("P18")}
                  className="p-2 rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Estado */}
                <div>
                  <div className="text-xs font-bold text-[#26332D] mb-2">
                    Por estado
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "overdue", label: "Vencido" },
                        { id: "pending", label: "Pendiente" },
                        { id: "paid", label: "Pagado" },
                        { id: "scheduled", label: "Programado" },
                        { id: "received", label: "Recibido" },
                      ] as const
                    ).map((st) => {
                      const active = filters.statuses.includes(st.id);
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => toggleStatusFilter(st.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? "bg-[#34483D] text-white border-[#34483D]"
                              : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <div className="text-xs font-bold text-[#26332D] mb-2">
                    Por prioridad (Geometría + Etiqueta)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "essential", label: "Esencial" },
                        { id: "important", label: "Importante" },
                        { id: "flexible", label: "Flexible" },
                      ] as const
                    ).map((pr) => {
                      const active = filters.priorities.includes(pr.id);
                      return (
                        <button
                          key={pr.id}
                          type="button"
                          onClick={() => togglePriorityFilter(pr.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                            active
                              ? "bg-[#34483D] text-white border-[#34483D]"
                              : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                          }`}
                        >
                          <PriorityGeometryIcon priority={pr.id} size="sm" />
                          <span>{pr.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categorías */}
                <div>
                  <div className="text-xs font-bold text-[#26332D] mb-2">
                    Por categoría
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories
                      .filter((c) => c.is_active)
                      .map((cat) => {
                        const active = filters.categoryIds.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategoryFilter(cat.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                              active
                                ? "bg-[#34483D] text-white border-[#34483D]"
                                : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Recurrencia */}
                <div>
                  <div className="text-xs font-bold text-[#26332D] mb-2">
                    Frecuencia
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "all", label: "Todos" },
                        { id: "recurring", label: "Recurrentes" },
                        { id: "one_off", label: "Únicos" },
                      ] as const
                    ).map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            recurrenceFilter: rec.id,
                          }))
                        }
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          filters.recurrenceFilter === rec.id
                            ? "bg-[#34483D] text-white border-[#34483D]"
                            : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE]"
                        }`}
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4E6DE] flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="py-3 px-4 rounded-xl bg-[#F0F1EB] text-[#26332D] text-xs font-semibold cursor-pointer"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen("P18")}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
                >
                  Ver {filtered.length} resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === P20 (Presupuesto Mensual) y P21 (Editar Presupuesto Mensual) ===
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newTotal = Number(limitInput) || 20000;
    updateBudget({
      total_limit: newTotal,
      alert_threshold_percent: thresholdInput,
      min_cushion_percent: cushionPercentInput,
      min_cushion_amount: roundCurrency(
        newTotal * (cushionPercentInput / 100)
      ),
    });
    setActiveScreen("P20");
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
            Control de techo mensual • {formatMonthYearEs(currentYearMonth)}
          </span>
          <h1 className="text-xl font-bold text-[#26332D]">
            Presupuesto mensual
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setLimitInput(String(budget.total_limit));
            setThresholdInput(budget.alert_threshold_percent);
            setCushionPercentInput(budget.min_cushion_percent);
            setActiveScreen("P21");
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#34483D] hover:bg-[#F0F1EB] cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar límite</span>
        </button>
      </div>

      {/* Tarjeta Principal con Anillo Dona 63% y Barra Segmentada */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-xs space-y-4">
        <div className="flex items-center gap-5">
          {/* Anillo SVG Dona */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#F0F1EB"
                strokeWidth="12"
              />
              {/* Comprometido total (Pagado + Pendiente = 63%) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#91A68C"
                strokeWidth="12"
                strokeDasharray={`${
                  Math.min(100, budgetSummary.committedPercent) * 2.513
                } 251.3`}
                strokeLinecap="round"
              />
              {/* Pagado (46.6%) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#34483D"
                strokeWidth="12"
                strokeDasharray={`${
                  Math.min(100, budgetSummary.paidPercent) * 2.513
                } 251.3`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums text-[#26332D]">
                {budgetSummary.committedPercent}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#68736B]">
                Usado
              </span>
            </div>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="text-xs text-[#68736B]">
              Límite mensual:{" "}
              <strong className="text-[#26332D] tabular-nums">
                {formatMXN(budgetSummary.totalLimit)}
              </strong>
            </div>
            <div>
              <div className="text-[11px] text-[#68736B]">
                Total comprometido (Pagado + Pendiente)
              </div>
              <div className="text-lg font-bold tabular-nums text-[#26332D]">
                {formatMXN(budgetSummary.committedExpense)}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#23845B] text-xs font-bold tabular-nums">
              <span>Disponible: {formatMXN(budgetSummary.availableBudget)}</span>
            </div>
          </div>
        </div>

        {/* Barra segmentada: Pagado vs Pendiente vs Disponible */}
        <div className="space-y-2 pt-2 border-t border-[#E4E6DE]">
          <div className="w-full h-3 rounded-full bg-[#F0F1EB] overflow-hidden flex">
            <div
              style={{ width: `${Math.min(100, budgetSummary.paidPercent)}%` }}
              className="bg-[#34483D] h-full"
            />
            <div
              style={{
                width: `${Math.min(
                  100 - Math.min(100, budgetSummary.paidPercent),
                  budgetSummary.pendingPercent
                )}%`,
              }}
              className="bg-[#91A68C] h-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div>
              <div className="flex items-center gap-1.5 text-[#68736B]">
                <span className="w-2 h-2 rounded-full bg-[#34483D]" />
                <span>Pagado</span>
              </div>
              <div className="font-bold tabular-nums text-[#26332D] mt-0.5">
                {formatMXN(budgetSummary.paidExpense, { showPrefix: false })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[#68736B]">
                <span className="w-2 h-2 rounded-full bg-[#91A68C]" />
                <span>Pendiente</span>
              </div>
              <div className="font-bold tabular-nums text-[#26332D] mt-0.5">
                {formatMXN(budgetSummary.pendingExpense, { showPrefix: false })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[#68736B]">
                <span className="w-2 h-2 rounded-full bg-[#E4E6DE]" />
                <span>Disponible</span>
              </div>
              <div className="font-bold tabular-nums text-[#23845B] mt-0.5">
                {formatMXN(budgetSummary.availableBudget, { showPrefix: false })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta Comparativa: Cuenta vs. Presupuesto (PRD 6.3 / P20) */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#26332D]">
          <Wallet className="w-4 h-4 text-[#34483D]" />
          <span>Comparativa: Dinero en cuenta vs. Presupuesto</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F6F5F0]">
            <span className="text-[#68736B] block">
              Cierre proyectado en cuenta
            </span>
            <span className="text-base font-bold tabular-nums text-[#23845B] mt-0.5 block">
              {formatMXN(monthProjection.projectedClosingBalance)}
            </span>
            <span className="text-[11px] text-[#68736B]">
              Dinero real al 30 Nov
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F6F5F0]">
            <span className="text-[#68736B] block">
              Margen libre de presupuesto
            </span>
            <span className="text-base font-bold tabular-nums text-[#26332D] mt-0.5 block">
              {formatMXN(budgetSummary.availableBudget)}
            </span>
            <span className="text-[11px] text-[#68736B]">
              Restante de tu techo de $20k
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta "Hasta tu próximo ingreso" + Punto más bajo del mes (PRD 8.3: $3,200.50 el 28/11/2026) */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#26332D]">
            <CalendarClock className="w-4 h-4 text-[#34483D]" />
            <span>Hasta tu próximo ingreso</span>
          </div>
          {nextIncomeStretch.daysUntilNextIncome !== null && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8DCCB] text-[#26332D] text-[11px] font-bold">
              Faltan {nextIncomeStretch.daysUntilNextIncome} días (30 Nov)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F6F5F0]">
            <div className="text-[#68736B]">Pagos antes del 30 Nov</div>
            <div className="text-sm font-bold tabular-nums text-[#C94C4C] mt-0.5">
              -{formatMXN(nextIncomeStretch.pendingExpensesBeforeNextIncome)}
            </div>
            <div className="text-[11px] text-[#68736B] mt-0.5">
              {nextIncomeStretch.pendingExpensesCountBeforeNextIncome} compromisos por cubrir
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F5F0]">
            <div className="text-[#68736B]">Saldo antes del cobro</div>
            <div className="text-sm font-bold tabular-nums text-[#26332D] mt-0.5">
              {formatMXN(nextIncomeStretch.balanceJustBeforeNextIncome)}
            </div>
            <div className="text-[11px] text-[#23845B] mt-0.5">
              Cubre todos tus pagos previos
            </div>
          </div>
        </div>

        {/* Punto más bajo del mes y colchón mínimo */}
        <div className="p-3 rounded-xl bg-[#EDF7F2] border border-[#C6E7D6] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#23845B] shrink-0" />
            <div>
              <span className="font-bold text-[#26332D] block">
                Punto más bajo del mes:{" "}
                <span className="tabular-nums text-[#23845B]">
                  {formatMXN(nextIncomeStretch.lowestPointOfMonth.balance)}
                </span>
              </span>
              <span className="text-[11px] text-[#68736B]">
                Ocurre el{" "}
                {formatDateDDMMYYYY(nextIncomeStretch.lowestPointOfMonth.date)}{" "}
                • Supera tu colchón mínimo de{" "}
                {formatMXN(monthProjection.minCushionAmount)}
              </span>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#23845B] shrink-0" />
        </div>
      </div>

      {/* Desglose por Prioridad (Esencial $9,249 / Importante $2,000 / Flexible $1,351) */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#68736B]">
          Desglose de gastos por prioridad
        </h2>

        <div className="space-y-3">
          {budgetSummary.priorityBreakdown.map((item) => (
            <div
              key={item.priority}
              className="p-3 rounded-xl bg-[#F6F5F0] space-y-2"
            >
              <div className="flex items-center justify-between">
                <PriorityBadge priority={item.priority} />
                <span className="text-sm font-bold tabular-nums text-[#26332D]">
                  {formatMXN(item.total)}{" "}
                  <span className="text-xs font-normal text-[#68736B]">
                    ({item.percentOfBudget}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#68736B] tabular-nums">
                <span>Pagado: {formatMXN(item.paid)}</span>
                <span>Pendiente: {formatMXN(item.pending)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* P21: Bottom Sheet Editar Presupuesto Mensual */}
      {activeScreen === "P21" && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center">
          <div className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-[#E4E6DE] mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6DE]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#34483D]">
                  P21 • Configuración de techo
                </span>
                <h3 className="text-lg font-bold text-[#26332D]">
                  Editar presupuesto mensual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreen("P20")}
                className="p-2 rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                  Límite total del mes (MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B]">
                    $
                  </span>
                  <input
                    type="number"
                    step="100"
                    required
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#26332D]">
                    Umbral de alerta preventiva (Ámbar)
                  </span>
                  <span className="font-bold text-[#D99A32] tabular-nums">
                    {thresholdInput}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(Number(e.target.value))}
                  className="w-full accent-[#34483D]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#26332D]">
                    Colchón mínimo de seguridad en cuenta
                  </span>
                  <span className="font-bold text-[#23845B] tabular-nums">
                    {cushionPercentInput}% (
                    {formatMXN(
                      (Number(limitInput) || 0) * (cushionPercentInput / 100)
                    )}
                    )
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={cushionPercentInput}
                  onChange={(e) =>
                    setCushionPercentInput(Number(e.target.value))
                  }
                  className="w-full accent-[#34483D]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#F6F5F0] text-xs flex items-center justify-between">
                <span className="text-[#68736B]">
                  Nuevo disponible con gasto actual ({formatMXN(budgetSummary.committedExpense)}):
                </span>
                <strong className="tabular-nums text-[#23845B]">
                  {formatMXN(
                    (Number(limitInput) || 0) - budgetSummary.committedExpense
                  )}
                </strong>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen("P20")}
                  className="py-3 px-4 rounded-xl bg-[#F0F1EB] text-[#26332D] text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
