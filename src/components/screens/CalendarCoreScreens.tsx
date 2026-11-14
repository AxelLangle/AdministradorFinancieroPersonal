"use client";

import React, { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import {
  formatDateDDMMYYYY,
  formatMonthYearEs,
  formatMXN,
  formatShortDateEs,
  getEffectiveAmount,
  getEffectiveDate,
  getMonthStartEnd,
  isExpenseOverdue,
  isIncomeDelayed,
  isUnquantifiedExpense,
} from "@/lib/finance/engine";
import {
  PriorityBadge,
  PriorityGeometryIcon,
  StatusBadge,
} from "@/components/ui/PriorityBadge";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronUp,
  ChevronDown,
  Plus,
  WifiOff,
  RefreshCw,
  HelpCircle,
  Calendar as CalendarIcon,
  X,
  ArrowUpRight,
} from "lucide-react";

const WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarCoreScreens() {
  const {
    activeScreen,
    setActiveScreen,
    currentYearMonth,
    goToPreviousMonth,
    goToNextMonth,
    referenceDate,
    selectedDate,
    setSelectedDate,
    setSelectedTransactionId,
    transactions,
    categories,
    monthProjection,
    budgetSummary,
    notifications,
    showToast,
  } = useFinanceStore();

  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);

  // Colapso automático de la tarjeta de resumen al hacer scroll hacia abajo (PRD 5.2 / 6.3)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsSummaryCollapsed(true);
      } else if (window.scrollY < 40) {
        setIsSummaryCollapsed(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const { year, month, daysInMonth } = getMonthStartEnd(currentYearMonth);

  // Calcular offset del primer día del mes para semana que inicia en Lunes (0 = Lunes .. 6 = Domingo)
  const firstDayUtc = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mondayOffset = (firstDayUtc + 6) % 7;

  const getCategoryName = (catId: string | null) =>
    categories.find((c) => c.id === catId)?.name || "General";

  // P33: Estado especial - Error de conexión / Modo sin conexión con caché
  if (activeScreen === "P33") {
    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
              Modo sin conexión
            </span>
            <h1 className="text-xl font-bold text-[#26332D]">
              {formatMonthYearEs(currentYearMonth)}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="px-3 py-1.5 rounded-xl bg-[#34483D] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconectar</span>
          </button>
        </div>

        {/* Banner principal de error de conexión */}
        <div className="bg-[#FDF2F2] border border-[#F5CACA] rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C94C4C]/15 text-[#C94C4C] flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#26332D]">
                No pudimos sincronizar tus últimos movimientos
              </h2>
              <p className="text-xs text-[#68736B] mt-0.5 leading-relaxed">
                Estás viendo una copia segura guardada en este dispositivo (última actualización: 18/11/2026 a las 08:00). Tus cifras están protegidas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                showToast("Conexión restablecida exitosamente");
                setActiveScreen("P10");
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#34483D] hover:bg-[#26332D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar conexión ahora</span>
            </button>
          </div>
        </div>

        {/* Resumen en caché */}
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] opacity-90">
          <div className="flex items-center justify-between text-xs text-[#68736B] mb-2">
            <span>Datos en caché (Solo lectura)</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F0F1EB] text-[#68736B] font-medium">
              18/11/2026
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-[#68736B]">Saldo actual</div>
              <div className="text-lg font-bold tabular-nums text-[#26332D]">
                {formatMXN(monthProjection.currentBalance)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#68736B]">
                Saldo proyectado
              </div>
              <div className="text-lg font-bold tabular-nums text-[#23845B]">
                {formatMXN(monthProjection.projectedClosingBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // P31: Estado especial - Inicio vacío (Cuenta recién creada sin movimientos)
  if (activeScreen === "P31") {
    return (
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
              Cuenta principal
            </span>
            <h1 className="text-xl font-bold text-[#26332D]">
              {formatMonthYearEs(currentYearMonth)}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen("P10")}
            className="px-3 py-1.5 rounded-xl bg-[#E8DCCB] text-[#26332D] text-xs font-semibold cursor-pointer"
          >
            Ver con datos de Sofía
          </button>
        </div>

        {/* Tarjeta resumen en cero */}
        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E6DE] shadow-xs">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E4E6DE]">
            <div>
              <div className="text-xs text-[#68736B]">Saldo actual</div>
              <div className="text-xl font-bold tabular-nums text-[#26332D] mt-0.5">
                MXN $0.00
              </div>
            </div>
            <div>
              <div className="text-xs text-[#68736B]">
                Saldo proyectado fin de mes
              </div>
              <div className="text-xl font-bold tabular-nums text-[#68736B] mt-0.5">
                MXN $0.00
              </div>
            </div>
          </div>
          <div className="pt-3 text-xs text-[#68736B] flex items-center justify-between">
            <span>Sin compromisos registrados en este mes</span>
            <button
              type="button"
              onClick={() => setActiveScreen("P05")}
              className="font-semibold text-[#34483D] underline cursor-pointer"
            >
              Definir saldo inicial
            </button>
          </div>
        </div>

        {/* Ilustración y guía de estado vacío */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E4E6DE] text-center space-y-3 my-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F1EB] text-[#34483D] flex items-center justify-center mx-auto">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#26332D]">
            Tu calendario de noviembre está listo para empezar
          </h2>
          <p className="text-xs text-[#68736B] max-w-xs mx-auto leading-relaxed">
            Registra tu próximo ingreso o tus pagos fijos del mes para ver cómo evolucionará tu dinero día por día.
          </p>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveScreen("P12")}
              className="py-3 px-3 rounded-xl bg-[#34483D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Primer gasto</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen("P13")}
              className="py-3 px-3 rounded-xl bg-[#F0F1EB] text-[#26332D] border border-[#E4E6DE] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Primer ingreso</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // P10 (Calendario principal), P11 (con Bottom Sheet de detalle del día), y P32 (Inicio con proyección incompleta)
  const dayTransactionsForSelectedDate = transactions.filter(
    (tx) =>
      tx.status !== "cancelled" && getEffectiveDate(tx) === selectedDate
  );

  const upcomingCommitments = transactions
    .filter(
      (tx) =>
        tx.status !== "cancelled" &&
        tx.status !== "paid" &&
        tx.status !== "received"
    )
    .sort((a, b) => a.expected_date.localeCompare(b.expected_date));

  const trafficBadge =
    monthProjection.balanceTrafficLight === "green"
      ? {
          bg: "bg-[#EDF7F2]",
          text: "text-[#23845B]",
          dot: "bg-[#23845B]",
          label: "Proyección saludable",
        }
      : monthProjection.balanceTrafficLight === "amber"
      ? {
          bg: "bg-[#FEF6E7]",
          text: "text-[#9A6712]",
          dot: "bg-[#D99A32]",
          label: monthProjection.hasUnquantifiedPendingExpenses
            ? "Proyección parcial"
            : "Colchón ajustado",
        }
      : {
          bg: "bg-[#FDF2F2]",
          text: "text-[#C94C4C]",
          dot: "bg-[#C94C4C]",
          label: "Riesgo de déficit",
        };

  return (
    <div className="flex-1 flex flex-col">
      {/* Cabecera de Mes y Avisos */}
      <header className="sticky top-0 z-30 bg-[#F6F5F0]/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-[#E4E6DE]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#68736B]">
                Cuenta principal • Hoy 18 Nov
              </div>
              <h1 className="text-base font-bold text-[#26332D]">
                {formatMonthYearEs(currentYearMonth)}
              </h1>
            </div>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={goToNextMonth}
              className="p-1.5 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSummaryCollapsed((prev) => !prev)}
              title="Compactar / Expandir resumen"
              className="p-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#68736B] hover:text-[#26332D] cursor-pointer"
            >
              {isSummaryCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              aria-label="Centro de avisos"
              onClick={() => setActiveScreen("P30")}
              className="relative p-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] hover:bg-[#F0F1EB] cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C94C4C] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Franja persistente compacta (72px max) cuando el usuario hace scroll o compacta (PRD 5.2) */}
        {isSummaryCollapsed && (
          <div className="mt-2 py-2 px-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] text-[#68736B] block">
                  Saldo actual
                </span>
                <span className="text-xs font-bold tabular-nums text-[#26332D]">
                  {formatMXN(monthProjection.currentBalance)}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#E4E6DE]" />
              <div>
                <span className="text-[10px] text-[#68736B] block">
                  Proyectado fin de mes
                </span>
                <span className="text-xs font-bold tabular-nums text-[#23845B]">
                  {monthProjection.projectedClosingBalance !== null
                    ? formatMXN(monthProjection.projectedClosingBalance, {
                        approximate:
                          monthProjection.hasUnquantifiedPendingExpenses,
                      })
                    : "No disponible"}
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${trafficBadge.bg} ${trafficBadge.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${trafficBadge.dot}`} />
              {trafficBadge.label}
            </span>
          </div>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Tarjeta de Resumen Financiero Expandida (P10 / P32) */}
        {!isSummaryCollapsed && (
          <section
            aria-label="Resumen financiero del mes"
            className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E4E6DE] shadow-xs space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#68736B]">
                Panorama de {formatMonthYearEs(currentYearMonth)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${trafficBadge.bg} ${trafficBadge.text}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${trafficBadge.dot}`}
                />
                {trafficBadge.label}
              </span>
            </div>

            {monthProjection.historicalBalanceUnavailableMessage ? (
              <div className="p-3 rounded-xl bg-[#F0F1EB] text-xs text-[#68736B]">
                {monthProjection.historicalBalanceUnavailableMessage}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#E4E6DE]">
                <div>
                  <div className="text-[11px] text-[#68736B]">
                    Saldo actual (corte 18/11)
                  </div>
                  <div className="text-xl font-bold tabular-nums text-[#26332D] mt-0.5">
                    {formatMXN(monthProjection.currentBalance)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#68736B]">
                    Saldo proyectado fin de mes
                  </div>
                  <div
                    className={`text-xl font-bold tabular-nums mt-0.5 ${
                      monthProjection.balanceTrafficLight === "amber"
                        ? "text-[#9A6712]"
                        : monthProjection.balanceTrafficLight === "red"
                        ? "text-[#C94C4C]"
                        : "text-[#23845B]"
                    }`}
                  >
                    {formatMXN(monthProjection.projectedClosingBalance, {
                      approximate:
                        monthProjection.hasUnquantifiedPendingExpenses,
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Ingresos vs Gastos del mes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F6F5F0]">
                <div className="text-[11px] text-[#68736B]">
                  Ingresos recibidos
                </div>
                <div className="font-bold tabular-nums text-[#23845B] mt-0.5">
                  +{formatMXN(monthProjection.receivedIncome)}
                </div>
                <div className="text-[11px] text-[#68736B] tabular-nums mt-0.5">
                  +{formatMXN(monthProjection.scheduledIncome)} programados
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F6F5F0]">
                <div className="text-[11px] text-[#68736B]">
                  Gastos pagados
                </div>
                <div className="font-bold tabular-nums text-[#26332D] mt-0.5">
                  -{formatMXN(monthProjection.paidExpense)}
                </div>
                <div className="text-[11px] text-[#C94C4C] tabular-nums mt-0.5">
                  -{formatMXN(monthProjection.pendingExpense)} pendientes
                </div>
              </div>
            </div>

            {/* Barra de Presupuesto Mensual */}
            <div
              onClick={() => setActiveScreen("P20")}
              className="pt-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#26332D] group-hover:text-[#34483D] flex items-center gap-1">
                  Presupuesto: {budgetSummary.committedPercent}% usado
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                </span>
                <span className="font-bold tabular-nums text-[#23845B]">
                  {formatMXN(budgetSummary.availableBudget)} disp.
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F0F1EB] overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.min(100, budgetSummary.paidPercent)}%`,
                  }}
                  className="bg-[#34483D] h-full"
                  title="Pagado"
                />
                <div
                  style={{
                    width: `${Math.min(
                      100 - Math.min(100, budgetSummary.paidPercent),
                      budgetSummary.pendingPercent
                    )}%`,
                  }}
                  className="bg-[#91A68C] h-full"
                  title="Pendiente"
                />
              </div>
            </div>
          </section>
        )}

        {/* Banner de Alerta P32: Proyección incompleta por gastos sin monto estimado */}
        {monthProjection.hasUnquantifiedPendingExpenses && (
          <div className="p-3.5 rounded-2xl bg-[#FEF6E7] border border-[#F5DFA8] flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-[#D99A32] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-bold text-[#9A6712]">
                Proyección parcial: {monthProjection.unquantifiedPendingExpensesCount} gastos sin monto estimado
              </div>
              <p className="text-[#26332D] mt-0.5 leading-relaxed">
                Tienes compromisos variables en los días <strong>21 y 26 de noviembre</strong> marcados como &ldquo;Monto por definir&rdquo;. Asígnales un estimado para completar tu saldo proyectado.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate("2026-11-21");
                    setActiveScreen("P11");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#9A6712] text-white font-semibold text-[11px] cursor-pointer"
                >
                  Revisar día 21 (Agua)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen("P10")}
                  className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#F5DFA8] text-[#9A6712] font-semibold text-[11px] cursor-pointer"
                >
                  Volver a vista completa (P10)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner de Vencidos y Atrasados (Sofía PRD 8.3: Recibo de luz CFE vencido 17/11 + Proyecto freelance atrasado 16/11) */}
        {(monthProjection.overdueExpenseCount > 0 ||
          monthProjection.delayedIncomeCount > 0) && (
          <div className="bg-[#FDF5F2] border border-[#F1D8CE] rounded-2xl p-3.5 space-y-2">
            {monthProjection.overdueExpenseCount > 0 && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-[#C94C4C] shrink-0" />
                  <div>
                    <span className="font-bold text-[#C94C4C]">
                      1 gasto vencido ayer (17 Nov):
                    </span>{" "}
                    <span className="text-[#26332D] font-medium">
                      Recibo de luz CFE ({formatMXN(650, { approximate: true })})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTransactionId("tx-exp-05");
                    setActiveScreen("P15");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#C94C4C] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                >
                  Pagar
                </button>
              </div>
            )}

            {monthProjection.delayedIncomeCount > 0 && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F1D8CE]">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-[#D99A32] shrink-0" />
                  <div>
                    <span className="font-bold text-[#9A6712]">
                      1 ingreso atrasado (16 Nov):
                    </span>{" "}
                    <span className="text-[#68736B]">
                      Freelance diseño (+{formatMXN(3000, { approximate: true })}, no sumado al proyectado)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTransactionId("tx-inc-02");
                    setActiveScreen("P16");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#23845B] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                >
                  Recibir
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cuadrícula del Calendario Mensual (Lunes a Domingo) */}
        <section
          aria-label="Calendario mensual"
          className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E4E6DE] shadow-xs"
        >
          {/* Encabezado de días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS_ES.map((dayName) => (
              <div
                key={dayName}
                className="text-[11px] font-bold text-[#68736B] py-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Celdas del mes */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: mondayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-14 rounded-xl bg-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYearMonth}-${String(dayNum).padStart(
                2,
                "0"
              )}`;
              const isToday = dateStr === referenceDate;
              const isSelected = dateStr === selectedDate;

              const dayTxs = transactions.filter(
                (t) =>
                  t.status !== "cancelled" && getEffectiveDate(t) === dateStr
              );

              const hasOverdue = dayTxs.some((t) =>
                isExpenseOverdue(t, referenceDate)
              );
              const hasDelayedIncome = dayTxs.some((t) =>
                isIncomeDelayed(t, referenceDate)
              );
              const hasUnquantified = dayTxs.some((t) =>
                isUnquantifiedExpense(t)
              );
              const hasIncome = dayTxs.some((t) => t.type === "income");
              const expensePriorities = dayTxs
                .filter((t) => t.type === "expense")
                .map((t) => t.priority);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setActiveScreen("P11");
                  }}
                  className={`relative h-14 rounded-xl p-1 flex flex-col items-center justify-between border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#34483D] text-white border-[#34483D] shadow-sm"
                      : isToday
                      ? "bg-[#E8DCCB]/65 text-[#26332D] border-[#34483D] font-bold"
                      : hasOverdue
                      ? "bg-[#FDF2F2] text-[#C94C4C] border-[#F5CACA]"
                      : hasUnquantified
                      ? "bg-[#FEF6E7] text-[#9A6712] border-[#F5DFA8]"
                      : "bg-[#F6F5F0]/60 hover:bg-[#F0F1EB] text-[#26332D] border-transparent"
                  }`}
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span
                      className={`text-xs tabular-nums ${
                        isSelected || isToday ? "font-bold" : "font-medium"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span
                        className={`text-[8px] uppercase font-bold px-1 rounded ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#34483D] text-white"
                        }`}
                      >
                        Hoy
                      </span>
                    )}
                    {hasUnquantified && !isToday && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#D99A32] text-white text-[9px] font-bold flex items-center justify-center">
                        ?
                      </span>
                    )}
                  </div>

                  {/* Marcadores geométricos de prioridad e ingreso (PRD 5.4: máx 3 marcadores + '+N') */}
                  {dayTxs.length > 0 && (
                    <div className="flex items-center justify-center gap-1 pb-0.5">
                      {hasIncome && (
                        <span
                          title="Ingreso"
                          className={`w-2 h-2 rounded-full ${
                            hasDelayedIncome
                              ? "bg-[#D99A32]"
                              : "bg-[#23845B]"
                          }`}
                        />
                      )}
                      {expensePriorities.slice(0, 2).map((prio, i) => (
                        <PriorityGeometryIcon
                          key={`${dateStr}-p-${i}`}
                          priority={prio}
                          size="xs"
                        />
                      ))}
                      {dayTxs.length > 3 && (
                        <span className="text-[9px] font-bold opacity-80">
                          +{dayTxs.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda de Geometrías de Prioridad */}
          <div className="mt-3 pt-2.5 border-t border-[#E4E6DE] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#68736B]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <PriorityGeometryIcon priority="essential" size="xs" />
                <span>Esencial</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <PriorityGeometryIcon priority="important" size="xs" />
                <span>Importante</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <PriorityGeometryIcon priority="flexible" size="xs" />
                <span>Flexible</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[#23845B] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#23845B]" />
              <span>Ingreso</span>
            </span>
          </div>
        </section>

        {/* Lista de Próximos Compromisos y Pendientes del Mes */}
        <section aria-label="Próximos compromisos" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#26332D]">
              Compromisos por resolver ({upcomingCommitments.length})
            </h2>
            <button
              type="button"
              onClick={() => setActiveScreen("P18")}
              className="text-xs font-semibold text-[#34483D] hover:underline cursor-pointer"
            >
              Ver historial completo
            </button>
          </div>

          <div className="space-y-2">
            {upcomingCommitments.map((tx) => {
              const overdue = isExpenseOverdue(tx, referenceDate);
              const delayed = isIncomeDelayed(tx, referenceDate);
              const unquantified = isUnquantifiedExpense(tx);

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
                    <div className="text-xs text-[#68736B] mt-1 flex items-center gap-2">
                      <span>{formatShortDateEs(tx.expected_date)}</span>
                      <span>•</span>
                      <span>{getCategoryName(tx.category_id)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        unquantified
                          ? "text-[#9A6712]"
                          : tx.type === "income"
                          ? "text-[#23845B]"
                          : overdue
                          ? "text-[#C94C4C]"
                          : "text-[#26332D]"
                      }`}
                    >
                      {unquantified
                        ? "Monto por definir"
                        : formatMXN(getEffectiveAmount(tx), {
                            showPrefix: false,
                            showPlusSign: tx.type === "income",
                            showMinusSign: tx.type === "expense",
                            approximate: tx.amount_type === "variable",
                          })}
                    </span>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tx.type === "expense" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTransactionId(tx.id);
                            setActiveScreen("P15");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#34483D] hover:bg-[#26332D] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Confirmar pago
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTransactionId(tx.id);
                            setActiveScreen("P16");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#23845B] hover:bg-[#1D6E4B] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Confirmar cobro
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* P11: Bottom Sheet de Detalle del Día */}
      {activeScreen === "P11" && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center">
          <div className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl max-h-[82vh] flex flex-col">
            <div className="w-10 h-1 rounded-full bg-[#E4E6DE] mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6DE]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736B]">
                  Detalle del día
                </span>
                <h3 className="text-lg font-bold text-[#26332D]">
                  {formatDateDDMMYYYY(selectedDate)}
                  {selectedDate === referenceDate ? " (Hoy)" : ""}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreen("P10")}
                className="p-2 rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {dayTransactionsForSelectedDate.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#91A68C] mx-auto" />
                  <div className="text-sm font-bold text-[#26332D]">
                    Día libre de compromisos
                  </div>
                  <p className="text-xs text-[#68736B]">
                    No tienes gastos ni ingresos registrados para el{" "}
                    {formatDateDDMMYYYY(selectedDate)}.
                  </p>
                </div>
              ) : (
                dayTransactionsForSelectedDate.map((tx) => {
                  const overdue = isExpenseOverdue(tx, referenceDate);
                  const delayed = isIncomeDelayed(tx, referenceDate);
                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#26332D]">
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
                            {getCategoryName(tx.category_id)} •{" "}
                            {tx.amount_type === "variable"
                              ? "Monto variable (~)"
                              : "Monto fijo"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-base font-bold tabular-nums ${
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

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E4E6DE]">
                        {tx.type === "expense" && tx.status !== "paid" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransactionId(tx.id);
                              setActiveScreen("P15");
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#34483D] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirmar pago
                          </button>
                        )}
                        {tx.type === "income" && tx.status !== "received" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransactionId(tx.id);
                              setActiveScreen("P16");
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#23845B] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirmar recepción
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTransactionId(tx.id);
                            setActiveScreen("P14");
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] text-xs font-semibold cursor-pointer"
                        >
                          Ver detalle (P14)
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#E4E6DE] grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveScreen("P12")}
                className="py-3 px-3 rounded-xl bg-[#34483D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo gasto este día</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen("P13")}
                className="py-3 px-3 rounded-xl bg-[#F0F1EB] text-[#26332D] border border-[#E4E6DE] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo ingreso</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
