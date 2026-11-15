"use client";

import React, { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  useBottomSheetDragToDismiss,
  useHorizontalSwipe,
} from "@/lib/hooks/useSwipeGesture";
import {
  filterTransactions,
  formatDateDDMMYYYY,
  formatMonthYearEs,
  formatMXN,
  formatNumberWithCommas,
  formatShortDateEs,
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
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type {
  PriorityLevel,
  Transaction,
  TransactionStatus,
} from "@/lib/finance/types";
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
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SwipeableMovementRowProps {
  tx: Transaction;
  catName: string;
  overdue: boolean;
  delayed: boolean;
  diff: number;
  isRevealed: boolean;
  onReveal: () => void;
  onHide: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

function SwipeableMovementRow({
  tx,
  catName,
  overdue,
  delayed,
  diff,
  isRevealed,
  onReveal,
  onHide,
  onSelect,
  onDelete,
}: SwipeableMovementRowProps) {
  const swipeHandlers = useHorizontalSwipe({
    threshold: 40,
    stopPropagationOnTrigger: true,
    onSwipeLeft: onReveal,
    onSwipeRight: onHide,
  });

  return (
    <div
      {...swipeHandlers}
      onClick={() => {
        if (isRevealed) {
          onHide();
          return;
        }
        onSelect();
      }}
      className={`bg-[#FFFFFF] rounded-2xl p-3.5 border transition flex items-center justify-between gap-2.5 cursor-pointer ${
        isRevealed
          ? "border-[#C94C4C]/60 bg-[#FDF5F2]/30"
          : "border-[#E4E6DE] hover:border-[#91A68C]"
      }`}
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

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
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

        <button
          type="button"
          data-no-swipe="true"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Eliminar movimiento"
          aria-label={`Eliminar ${tx.title}`}
          className={`min-h-[40px] flex items-center justify-center rounded-xl transition cursor-pointer ${
            isRevealed
              ? "px-3 bg-[#C94C4C] text-white text-xs font-bold gap-1.5 shadow-xs"
              : "w-10 text-[#68736B] hover:text-[#C94C4C] hover:bg-[#FDF2F2]"
          }`}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          {isRevealed && <span>Eliminar</span>}
        </button>
      </div>
    </div>
  );
}

export function HistoryAndBudgetScreens() {
  const {
    activeScreen,
    setActiveScreen,
    goBack,
    currentYearMonth,
    goToPreviousMonth,
    goToNextMonth,
    referenceDate,
    transactions,
    categories,
    filters,
    setFilters,
    resetFilters,
    setSelectedTransactionId,
    deleteTransaction,
    budget,
    updateBudget,
    monthProjection,
    budgetSummary,
    nextIncomeStretch,
  } = useFinanceStore();

  // Estados para Editar Presupuesto y swipe de tarjeta
  const [limitNum, setLimitNum] = useState(budget.total_limit);
  const [thresholdInput, setThresholdInput] = useState(
    budget.alert_threshold_percent
  );
  const [cushionPercentInput, setCushionPercentInput] = useState(
    budget.min_cushion_percent
  );
  const [swipedTxId, setSwipedTxId] = useState<string | null>(null);

  useEffect(() => {
    setLimitNum(budget.total_limit);
    setThresholdInput(budget.alert_threshold_percent);
    setCushionPercentInput(budget.min_cushion_percent);
  }, [
    budget.total_limit,
    budget.alert_threshold_percent,
    budget.min_cushion_percent,
  ]);

  const filterSheetDrag = useBottomSheetDragToDismiss({
    enabled: activeScreen === "P19",
    onClose: () => setActiveScreen("P18"),
  });

  const budgetSheetDrag = useBottomSheetDragToDismiss({
    enabled: activeScreen === "P21",
    onClose: goBack,
  });

  // === Movimientos y Bottom Sheet de Filtros Combinables ===
  if (activeScreen === "P18" || activeScreen === "P19") {
    const monthTxs = transactions.filter(
      (tx) =>
        tx.status !== "cancelled" &&
        getEffectiveDate(tx).startsWith(currentYearMonth)
    );
    const totalMonthIncome = roundCurrency(
      monthProjection.receivedIncome + monthProjection.scheduledIncome
    );
    const totalMonthExpense = roundCurrency(budgetSummary.committedExpense);
    const netMonthFlow = roundCurrency(totalMonthIncome - totalMonthExpense);
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Mes anterior"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B] block truncate">
                {formatMonthYearEs(currentYearMonth)}
              </span>
              <h1 className="text-xl font-bold text-[#26332D] truncate">
                Movimientos
              </h1>
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen("P19")}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D] hover:bg-[#F0F1EB] shadow-2xs cursor-pointer shrink-0"
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

        {/* Resumen rápido sincronizado del mes (Ingresos, Gastos y Flujo) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#FFFFFF] rounded-xl p-2.5 border border-[#E4E6DE]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#68736B] block">
              Ingresos
            </span>
            <span className="text-xs font-bold tabular-nums text-[#23845B] mt-0.5 block">
              +{formatMXN(totalMonthIncome, { showPrefix: false })}
            </span>
          </div>
          <div className="bg-[#FFFFFF] rounded-xl p-2.5 border border-[#E4E6DE]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#68736B] block">
              Gastos
            </span>
            <span className="text-xs font-bold tabular-nums text-[#C94C4C] mt-0.5 block">
              -{formatMXN(totalMonthExpense, { showPrefix: false })}
            </span>
          </div>
          <div className="bg-[#FFFFFF] rounded-xl p-2.5 border border-[#E4E6DE]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#68736B] block">
              Balance mes
            </span>
            <span
              className={`text-xs font-bold tabular-nums mt-0.5 block ${
                netMonthFlow >= 0 ? "text-[#23845B]" : "text-[#C94C4C]"
              }`}
            >
              {formatMXN(netMonthFlow, {
                showPrefix: false,
                showPlusSign: netMonthFlow > 0,
              })}
            </span>
          </div>
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
              placeholder="Buscar por concepto o nota (ej. Luz, Renta, Supermercado)..."
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
            <div className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#E4E6DE] text-center space-y-2.5">
              <div className="text-sm font-bold text-[#26332D]">
                {monthTxs.length === 0
                  ? "Aún no tienes movimientos en este mes"
                  : "No se encontraron movimientos con estos filtros"}
              </div>
              <p className="text-xs text-[#68736B]">
                {monthTxs.length === 0
                  ? "Registra tus ingresos y gastos del mes para llevar un control completo de tu historial."
                  : "Prueba limpiando los filtros activos o cambiando tu búsqueda."}
              </p>
              {monthTxs.length === 0 ? (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveScreen("P12")}
                    className="px-4 py-2 rounded-xl bg-[#34483D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo gasto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen("P13")}
                    className="px-4 py-2 rounded-xl bg-[#23845B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo ingreso</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
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
                    <SwipeableMovementRow
                      key={tx.id}
                      tx={tx}
                      catName={catName}
                      overdue={overdue}
                      delayed={delayed}
                      diff={diff}
                      isRevealed={swipedTxId === tx.id}
                      onReveal={() => setSwipedTxId(tx.id)}
                      onHide={() =>
                        setSwipedTxId((cur) => (cur === tx.id ? null : cur))
                      }
                      onSelect={() => {
                        setSwipedTxId(null);
                        setSelectedTransactionId(tx.id);
                        setActiveScreen("P14");
                      }}
                      onDelete={() => {
                        setSwipedTxId(null);
                        void deleteTransaction(tx.id);
                      }}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom Sheet de Filtros Combinables */}
        {activeScreen === "P19" && (
          <div
            onClick={filterSheetDrag.handleBackdropClick}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center"
          >
            <div
              {...filterSheetDrag.sheetTouchHandlers}
              style={filterSheetDrag.sheetStyle}
              className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="w-12 h-1.5 rounded-full bg-[#E4E6DE] mx-auto mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-[#E4E6DE]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#34483D]">
                    Filtros combinables
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

  // === Presupuesto Mensual y Editar Presupuesto Mensual ===
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotal = limitNum > 0 ? limitNum : 0;
    await updateBudget({
      total_limit: newTotal,
      alert_threshold_percent: thresholdInput,
      min_cushion_percent: cushionPercentInput,
      min_cushion_amount: roundCurrency(
        newTotal * (cushionPercentInput / 100)
      ),
    });
    goBack();
  };

  const nextIncomeDateLabel = nextIncomeStretch.nextIncomeTransaction
    ? formatShortDateEs(nextIncomeStretch.nextIncomeTransaction.expected_date)
    : "fin de mes";

  const totalMonthIncome = roundCurrency(
    monthProjection.receivedIncome + monthProjection.scheduledIncome
  );

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Mes anterior"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B] block truncate">
              {formatMonthYearEs(currentYearMonth)}
            </span>
            <h1 className="text-xl font-bold text-[#26332D] truncate">
              Presupuesto mensual
            </h1>
          </div>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Mes siguiente"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setLimitNum(budget.total_limit);
            setThresholdInput(budget.alert_threshold_percent);
            setCushionPercentInput(budget.min_cushion_percent);
            setActiveScreen("P21");
          }}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#34483D] hover:bg-[#F0F1EB] cursor-pointer shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editar límite</span>
        </button>
      </div>

      {/* Tarjeta Principal con Anillo Dona y Barra Segmentada */}
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
              {/* Comprometido total (Pagado + Pendiente) */}
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
              {/* Pagado */}
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
            <div className="flex items-center justify-between gap-2 text-xs text-[#68736B]">
              <span>
                Límite mensual:{" "}
                <strong className="text-[#26332D] tabular-nums">
                  {formatMXN(budgetSummary.totalLimit)}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLimitNum(budget.total_limit);
                  setThresholdInput(budget.alert_threshold_percent);
                  setCushionPercentInput(budget.min_cushion_percent);
                  setActiveScreen("P21");
                }}
                className="px-2 py-0.5 rounded-lg bg-[#F0F1EB] hover:bg-[#E8DCCB] text-[#34483D] font-semibold text-[11px] cursor-pointer shrink-0"
              >
                Cambiar
              </button>
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

      {/* Tarjeta Comparativa: Cuenta vs. Presupuesto */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#26332D]">
          <Wallet className="w-4 h-4 text-[#34483D]" />
          <span>Comparativa: Dinero en cuenta, ingresos y presupuesto</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#EDF7F2]">
            <span className="text-[#68736B] block">
              Ingresos del mes
            </span>
            <span className="text-base font-bold tabular-nums text-[#23845B] mt-0.5 block">
              +{formatMXN(totalMonthIncome)}
            </span>
            <span className="text-[11px] text-[#68736B]">
              Recibidos y programados
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FDF5F2]">
            <span className="text-[#68736B] block">
              Gastos comprometidos
            </span>
            <span className="text-base font-bold tabular-nums text-[#C94C4C] mt-0.5 block">
              -{formatMXN(budgetSummary.committedExpense)}
            </span>
            <span className="text-[11px] text-[#68736B]">
              Pagados y pendientes del mes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#F6F5F0]">
            <span className="text-[#68736B] block">
              Cierre proyectado en cuenta
            </span>
            <span className="text-base font-bold tabular-nums text-[#23845B] mt-0.5 block">
              {formatMXN(monthProjection.projectedClosingBalance)}
            </span>
            <span className="text-[11px] text-[#68736B]">
              Saldo estimado al cierre del mes
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
              Restante de tu techo mensual
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta "Hasta tu próximo ingreso" + Punto más bajo del mes */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#26332D]">
            <CalendarClock className="w-4 h-4 text-[#34483D]" />
            <span>Hasta tu próximo ingreso</span>
          </div>
          {nextIncomeStretch.daysUntilNextIncome !== null && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8DCCB] text-[#26332D] text-[11px] font-bold">
              Faltan {nextIncomeStretch.daysUntilNextIncome} días ({nextIncomeDateLabel})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F6F5F0]">
            <div className="text-[#68736B]">Pagos antes de {nextIncomeDateLabel}</div>
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
              Liquidez disponible en el tramo
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
                • Colchón mínimo configurado:{" "}
                {formatMXN(monthProjection.minCushionAmount)}
              </span>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#23845B] shrink-0" />
        </div>
      </div>

      {/* Desglose por Prioridad */}
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

      {/* Bottom Sheet Editar Presupuesto Mensual */}
      {activeScreen === "P21" && (
        <div
          onClick={budgetSheetDrag.handleBackdropClick}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center"
        >
          <div
            {...budgetSheetDrag.sheetTouchHandlers}
            style={budgetSheetDrag.sheetStyle}
            className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl"
          >
            <div className="w-12 h-1.5 rounded-full bg-[#E4E6DE] mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6DE]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#34483D]">
                  Configuración de techo mensual
                </span>
                <h3 className="text-lg font-bold text-[#26332D]">
                  Editar presupuesto mensual
                </h3>
              </div>
              <button
                type="button"
                onClick={goBack}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-[#68736B] mb-1.5">
                  Límite máximo de gasto mensual (MXN)
                </label>
                <CurrencyInput
                  value={limitNum}
                  onChange={(_, num) => setLimitNum(num)}
                  placeholder="Ej. 20,000.00"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5000, 10000, 15000, 20000, 30000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLimitNum(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                        limitNum === preset
                          ? "bg-[#34483D] text-white border-[#34483D]"
                          : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE] hover:border-[#91A68C]"
                      }`}
                    >
                      ${formatNumberWithCommas(preset, 0)}
                    </button>
                  ))}
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
                    {formatMXN(limitNum * (cushionPercentInput / 100))}
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
                  {formatMXN(limitNum - budgetSummary.committedExpense)}
                </strong>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="min-h-[44px] py-3 px-4 rounded-xl bg-[#F0F1EB] text-[#26332D] text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] flex-1 py-3 px-4 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
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
