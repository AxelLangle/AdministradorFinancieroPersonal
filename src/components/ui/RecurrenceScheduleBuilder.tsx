"use client";

import React, { useMemo, useState } from "react";
import type {
  CustomScheduleDayItem,
  ExcludedDayShift,
  RecurrenceFrequency,
  RecurrenceRule,
  TransactionType,
} from "@/lib/finance/types";
import {
  formatMonthYearEs,
  formatShortDateEs,
  generateOccurrencesForRuleInMonth,
  getMonthStartEnd,
  parseRecurrenceSchedule,
  serializeRecurrenceSchedule,
} from "@/lib/finance/engine";
import { CurrencyInput } from "./CurrencyInput";
import {
  Calendar as CalendarIcon,
  CalendarOff,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
} from "lucide-react";

export type ScheduleUiMode =
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "calendar_multi"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "annual";

export interface RecurrenceScheduleConfig {
  mode: ScheduleUiMode;
  startDate: string;
  dayOfMonth: number;
  dayOfWeek: number;
  selectedDays: Array<number | "last">;
  customDayAmounts: Record<string, string>;
  hasDifferentAmounts: boolean;
  secondAmount: string;
  excludedWeekdays: number[];
  excludedMonthDays: number[];
  excludedShift: ExcludedDayShift;
}

const WEEKDAYS_ES_CHIPS: ReadonlyArray<{
  value: number;
  short: string;
  full: string;
}> = [
  { value: 1, short: "Lun", full: "Lunes" },
  { value: 2, short: "Mar", full: "Martes" },
  { value: 3, short: "Mié", full: "Miércoles" },
  { value: 4, short: "Jue", full: "Jueves" },
  { value: 5, short: "Vie", full: "Viernes" },
  { value: 6, short: "Sáb", full: "Sábado" },
  { value: 0, short: "Dom", full: "Domingo" },
];

const CALENDAR_HEADER_MON_TO_SUN = ["L", "M", "M", "J", "V", "S", "D"];

function shiftYearMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

export function createDefaultScheduleConfig(
  referenceDate: string,
  defaultMode: ScheduleUiMode = "monthly",
  anchorDate?: string
): RecurrenceScheduleConfig {
  const effDate = anchorDate || referenceDate;
  const parsedDay = Number(effDate.slice(8, 10)) || 15;
  const [y, m, d] = effDate.slice(0, 10).split("-").map(Number);
  const dow =
    y && m && d ? new Date(Date.UTC(y, m - 1, d)).getUTCDay() : 5;

  return {
    mode: defaultMode,
    startDate: effDate,
    dayOfMonth: parsedDay,
    dayOfWeek: dow,
    selectedDays: defaultMode === "semimonthly" ? [15, "last"] : [parsedDay],
    customDayAmounts: {},
    hasDifferentAmounts: false,
    secondAmount: "",
    excludedWeekdays: [],
    excludedMonthDays: [],
    excludedShift: "next",
  };
}

export function ruleToScheduleConfig(
  rule: RecurrenceRule,
  referenceDate: string
): RecurrenceScheduleConfig {
  const parsed = parseRecurrenceSchedule(rule);
  const startDate = rule.start_date || referenceDate;
  const customDayAmounts: Record<string, string> = {};
  parsed.items.forEach((it) => {
    if (it.amount && it.amount > 0) {
      customDayAmounts[String(it.day)] = String(it.amount);
    }
  });

  let mode: ScheduleUiMode = rule.frequency;
  if (rule.frequency === "monthly" && parsed.items.length > 1) {
    mode = "calendar_multi";
  } else if (rule.frequency === "semimonthly" && parsed.items.length > 2) {
    mode = "calendar_multi";
  }

  let hasDifferentAmounts = false;
  let secondAmount = "";
  if (parsed.alternateAmount && parsed.alternateAmount > 0) {
    hasDifferentAmounts = true;
    secondAmount = String(parsed.alternateAmount);
  } else if (
    parsed.items.length === 2 &&
    parsed.items[1].amount &&
    parsed.items[1].amount !== rule.default_amount
  ) {
    hasDifferentAmounts = true;
    secondAmount = String(parsed.items[1].amount);
  } else if (
    parsed.items.some(
      (it) => it.amount && rule.default_amount && it.amount !== rule.default_amount
    )
  ) {
    hasDifferentAmounts = true;
  }

  const singleItemDay = parsed.items[0]?.day;
  const numericDay =
    singleItemDay === "last"
      ? 31
      : typeof singleItemDay === "number"
      ? singleItemDay
      : rule.day_of_month || 1;

  const fallbackDow = (() => {
    const [y, m, d] = startDate.slice(0, 10).split("-").map(Number);
    return y && m && d ? new Date(Date.UTC(y, m - 1, d)).getUTCDay() : 5;
  })();

  return {
    mode,
    startDate,
    dayOfMonth: numericDay,
    dayOfWeek:
      rule.day_of_week !== null && rule.day_of_week !== undefined
        ? rule.day_of_week
        : fallbackDow,
    selectedDays:
      parsed.items.length > 0 ? parsed.items.map((i) => i.day) : [15, "last"],
    customDayAmounts,
    hasDifferentAmounts,
    secondAmount,
    excludedWeekdays: parsed.excludedWeekdays,
    excludedMonthDays: parsed.excludedMonthDays,
    excludedShift:
      parsed.excludedShift !== "none"
        ? parsed.excludedShift
        : parsed.weekendShift === "friday"
        ? "prev"
        : "next",
  };
}

export function buildRuleScheduleFields(
  config: RecurrenceScheduleConfig,
  baseAmount: number,
  referenceDate: string
): {
  frequency: RecurrenceFrequency;
  dayOfMonth: number;
  semimonthlyDays: string | null;
  dayOfWeek: number | null;
  startDate: string;
} {
  const secondNum = Number(String(config.secondAmount).replace(/,/g, "")) || 0;
  const activeExclusions =
    config.excludedWeekdays.length > 0 || config.excludedMonthDays.length > 0;
  const effectiveShift: ExcludedDayShift = activeExclusions
    ? config.excludedShift === "none"
      ? "next"
      : config.excludedShift
    : "none";

  const exclusionOpts = {
    excludedWeekdays: config.excludedWeekdays,
    excludedMonthDays: config.excludedMonthDays,
    excludedShift: effectiveShift,
  };

  if (config.mode === "biweekly") {
    const startDate = config.startDate || referenceDate;
    return {
      frequency: "biweekly",
      dayOfMonth: Number(startDate.slice(8, 10)) || 15,
      dayOfWeek: null,
      startDate,
      semimonthlyDays: serializeRecurrenceSchedule({
        alternateAmount:
          config.hasDifferentAmounts && secondNum > 0 ? secondNum : null,
        ...exclusionOpts,
      }),
    };
  }

  if (config.mode === "weekly") {
    const startDate = config.startDate || referenceDate;
    return {
      frequency: "weekly",
      dayOfMonth: Number(startDate.slice(8, 10)) || 1,
      dayOfWeek: config.dayOfWeek,
      startDate,
      semimonthlyDays: serializeRecurrenceSchedule({
        alternateAmount:
          config.hasDifferentAmounts && secondNum > 0 ? secondNum : null,
        ...exclusionOpts,
      }),
    };
  }

  if (config.mode === "semimonthly" || config.mode === "calendar_multi") {
    const selected =
      config.selectedDays.length > 0 ? config.selectedDays : [15, "last" as const];
    const items: CustomScheduleDayItem[] = selected.map((d, idx) => {
      const key = String(d);
      const customVal =
        Number(String(config.customDayAmounts[key] || "").replace(/,/g, "")) || 0;
      let amt = baseAmount;
      if (config.hasDifferentAmounts) {
        if (customVal > 0) {
          amt = customVal;
        } else if (
          selected.length === 2 &&
          idx === 1 &&
          secondNum > 0
        ) {
          amt = secondNum;
        }
      }
      return { day: d, amount: amt > 0 ? amt : undefined };
    });

    const firstNum = items.find((it) => typeof it.day === "number")?.day;
    const frequency: RecurrenceFrequency =
      config.mode === "semimonthly" ? "semimonthly" : "monthly";
    const ym = (config.startDate || referenceDate).slice(0, 7);
    return {
      frequency,
      dayOfMonth: typeof firstNum === "number" ? firstNum : 15,
      dayOfWeek: null,
      startDate: `${ym}-01`,
      semimonthlyDays: serializeRecurrenceSchedule({
        items,
        ...exclusionOpts,
      }),
    };
  }

  const clampedDay = Math.min(31, Math.max(1, config.dayOfMonth || 1));
  const startDate = config.startDate || `${referenceDate.slice(0, 7)}-01`;
  return {
    frequency: config.mode,
    dayOfMonth: clampedDay,
    dayOfWeek: null,
    startDate,
    semimonthlyDays: serializeRecurrenceSchedule({
      items: [{ day: clampedDay === 31 ? "last" : clampedDay }],
      ...exclusionOpts,
    }),
  };
}

interface RecurrenceScheduleBuilderProps {
  transactionType: TransactionType;
  referenceDate: string;
  value: RecurrenceScheduleConfig;
  onChange: (next: RecurrenceScheduleConfig) => void;
  baseAmount: number;
  allowExtendedFrequencies?: boolean;
  allowDifferentAmounts?: boolean;
  amountLabel?: string;
}

export function RecurrenceScheduleBuilder({
  transactionType,
  referenceDate,
  value,
  onChange,
  baseAmount,
  allowExtendedFrequencies = true,
  allowDifferentAmounts = true,
  amountLabel,
}: RecurrenceScheduleBuilderProps) {
  const [calendarPreviewYm, setCalendarPreviewYm] = useState(
    (value.startDate || referenceDate).slice(0, 7)
  );
  const [showExclusions, setShowExclusions] = useState(
    value.excludedWeekdays.length > 0 || value.excludedMonthDays.length > 0
  );
  const [monthDayExcludeInput, setMonthDayExcludeInput] = useState("");
  const [showExtendedFreqs, setShowExtendedFreqs] = useState(
    ["bimonthly", "quarterly", "semiannual", "annual"].includes(value.mode)
  );

  const hasAnyExclusion =
    value.excludedWeekdays.length > 0 || value.excludedMonthDays.length > 0;
  const isExclusionsOpen = showExclusions || hasAnyExclusion;

  const update = (patch: Partial<RecurrenceScheduleConfig>) =>
    onChange({ ...value, ...patch });

  const toggleCalendarDay = (dayVal: number | "last") => {
    const exists = value.selectedDays.includes(dayVal);
    if (exists) {
      if (value.selectedDays.length <= 1) return;
      update({
        selectedDays: value.selectedDays.filter((d) => d !== dayVal),
      });
      return;
    }
    const next = [...value.selectedDays, dayVal].sort((a, b) => {
      const na = a === "last" ? 99 : a;
      const nb = b === "last" ? 99 : b;
      return na - nb;
    });
    update({ selectedDays: next });
  };

  const toggleExcludedWeekday = (dow: number) => {
    const exists = value.excludedWeekdays.includes(dow);
    const nextDows = exists
      ? value.excludedWeekdays.filter((d) => d !== dow)
      : [...value.excludedWeekdays, dow].sort((a, b) => a - b);
    update({
      excludedWeekdays: nextDows,
      excludedShift:
        nextDows.length > 0 || value.excludedMonthDays.length > 0
          ? value.excludedShift === "none"
            ? transactionType === "income"
              ? "prev"
              : "next"
            : value.excludedShift
          : value.excludedShift,
    });
  };

  const toggleWeekendExclusionPreset = () => {
    const hasSatSun =
      value.excludedWeekdays.includes(0) && value.excludedWeekdays.includes(6);
    const nextDows = hasSatSun
      ? value.excludedWeekdays.filter((d) => d !== 0 && d !== 6)
      : Array.from(new Set([...value.excludedWeekdays, 0, 6])).sort(
          (a, b) => a - b
        );
    update({
      excludedWeekdays: nextDows,
      excludedShift:
        nextDows.length > 0 || value.excludedMonthDays.length > 0
          ? value.excludedShift === "none"
            ? transactionType === "income"
              ? "prev"
              : "next"
            : value.excludedShift
          : value.excludedShift,
    });
  };

  const addExcludedMonthDay = () => {
    const num = Math.min(31, Math.max(1, Math.trunc(Number(monthDayExcludeInput))));
    if (!num || Number.isNaN(num)) return;
    if (!value.excludedMonthDays.includes(num)) {
      const nextDoms = [...value.excludedMonthDays, num].sort((a, b) => a - b);
      update({
        excludedMonthDays: nextDoms,
        excludedShift:
          value.excludedShift === "none"
            ? transactionType === "income"
              ? "prev"
              : "next"
            : value.excludedShift,
      });
    }
    setMonthDayExcludeInput("");
  };

  const removeExcludedMonthDay = (dom: number) => {
    update({
      excludedMonthDays: value.excludedMonthDays.filter((d) => d !== dom),
    });
  };

  // Vista previa en vivo del mes seleccionado o del siguiente con ocurrencias
  const previewOccurrences = useMemo(() => {
    const built = buildRuleScheduleFields(value, baseAmount || 1000, referenceDate);
    const dummyRule: RecurrenceRule = {
      id: "preview-rule",
      workspace_id: "",
      account_id: "",
      type: transactionType,
      title: "Vista previa",
      category_id: null,
      priority: "essential",
      amount_type: "fixed",
      default_amount: baseAmount || 1000,
      frequency: built.frequency,
      interval_count: 1,
      day_of_month: built.dayOfMonth,
      semimonthly_days: built.semimonthlyDays,
      day_of_week: built.dayOfWeek,
      start_date: built.startDate,
      end_date: null,
      status: "active",
      notes: null,
    };

    const targetYm = calendarPreviewYm || referenceDate.slice(0, 7);
    const firstBatch = generateOccurrencesForRuleInMonth({
      rule: dummyRule,
      yearMonth: targetYm,
      referenceDate,
    });
    if (firstBatch.length > 0) {
      return { yearMonth: targetYm, items: firstBatch };
    }
    const nextYm = shiftYearMonth(targetYm, 1);
    const nextBatch = generateOccurrencesForRuleInMonth({
      rule: dummyRule,
      yearMonth: nextYm,
      referenceDate,
    });
    return { yearMonth: nextYm, items: nextBatch };
  }, [value, baseAmount, referenceDate, transactionType, calendarPreviewYm]);

  const { year: calYear, month: calMonth, daysInMonth } = getMonthStartEnd(
    calendarPreviewYm
  );
  const firstDowUtc = new Date(
    Date.UTC(calYear, calMonth - 1, 1)
  ).getUTCDay();
  const mondayOffset = (firstDowUtc + 6) % 7;
  const isSatSunExcluded =
    value.excludedWeekdays.includes(0) && value.excludedWeekdays.includes(6);

  const primaryModes: ReadonlyArray<{ id: ScheduleUiMode; label: string }> = [
    { id: "weekly", label: "Semanal (7 días)" },
    { id: "biweekly", label: "Catorcenal (14 días)" },
    { id: "semimonthly", label: "Quincenal (2/mes)" },
    { id: "monthly", label: "Mensual (1/mes)" },
    { id: "calendar_multi", label: "Calendario multi-fecha" },
  ];

  const handleModeSelect = (nextMode: ScheduleUiMode) => {
    if (nextMode === "semimonthly") {
      update({
        mode: "semimonthly",
        selectedDays:
          value.selectedDays.length === 2
            ? value.selectedDays
            : [15, "last"],
      });
    } else if (nextMode === "calendar_multi") {
      update({
        mode: "calendar_multi",
        selectedDays:
          value.selectedDays.length > 0
            ? value.selectedDays
            : [value.dayOfMonth === 31 ? "last" : value.dayOfMonth || 15],
      });
    } else {
      update({ mode: nextMode });
    }
  };

  return (
    <div className="space-y-3">
      {/* Selector principal de frecuencia / esquema */}
      <div>
        <label className="block text-[11px] font-semibold text-[#68736B] mb-1.5">
          ¿Cada cuánto se repite y cómo elegir fechas?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {primaryModes.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleModeSelect(opt.id)}
              className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                value.mode === opt.id
                  ? "bg-[#34483D] text-white border-[#34483D]"
                  : "bg-[#F0F1EB] text-[#26332D] border-[#E4E6DE] hover:border-[#91A68C]"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {allowExtendedFrequencies && (
            <button
              type="button"
              onClick={() => setShowExtendedFreqs((prev) => !prev)}
              className={`py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                ["bimonthly", "quarterly", "semiannual", "annual"].includes(
                  value.mode
                )
                  ? "bg-[#34483D] text-white border-[#34483D]"
                  : "bg-[#F0F1EB] text-[#68736B] border-[#E4E6DE]"
              }`}
            >
              <span>Bimestral / Anual</span>
              {showExtendedFreqs ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {allowExtendedFrequencies && showExtendedFreqs && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5">
            {(
              [
                { id: "bimonthly", label: "Bimestral (2m)" },
                { id: "quarterly", label: "Trimestral (3m)" },
                { id: "semiannual", label: "Semestral (6m)" },
                { id: "annual", label: "Anual (12m)" },
              ] as const
            ).map((ext) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => handleModeSelect(ext.id)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                  value.mode === ext.id
                    ? "bg-[#23845B] text-white border-[#23845B]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                {ext.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controles específicos según esquema */}
      {value.mode === "weekly" && (
        <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-[#26332D] mb-1.5">
              ¿Qué día de la semana toca?
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {WEEKDAYS_ES_CHIPS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => update({ dayOfWeek: w.value })}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                    value.dayOfWeek === w.value
                      ? "bg-[#23845B] text-white border-[#23845B]"
                      : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                  }`}
                >
                  {w.full}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Fecha a partir de la cual inicia este pago/cobro semanal
            </label>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
            />
          </div>
        </div>
      )}

      {value.mode === "biweekly" && (
        <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-1.5">
          <label className="block text-[11px] font-semibold text-[#26332D]">
            Fecha de tu primer pago o cobro catorcenal (a partir de aquí cuenta +14 días)
          </label>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
          />
          <span className="block text-[10px] text-[#68736B]">
            Nunca genera fechas hacia atrás antes de tu fecha de inicio.
          </span>
        </div>
      )}

      {value.mode === "semimonthly" && (
        <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2">
          <label className="block text-[11px] font-semibold text-[#26332D]">
            Elige un par quincenal rápido o cámbialo en el calendario de abajo:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Días 15 y fin de mes", days: [15, "last" as const] },
              { label: "Días 1 y 15", days: [1, 15] },
              { label: "Días 10 y 25", days: [10, 25] },
              { label: "Días 5 y 20", days: [5, 20] },
            ].map((pair) => {
              const isMatch =
                value.selectedDays.length === 2 &&
                value.selectedDays[0] === pair.days[0] &&
                value.selectedDays[1] === pair.days[1];
              return (
                <button
                  key={pair.label}
                  type="button"
                  onClick={() => update({ selectedDays: pair.days })}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                    isMatch
                      ? "bg-[#23845B] text-white border-[#23845B]"
                      : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                  }`}
                >
                  {pair.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => handleModeSelect("calendar_multi")}
            className="text-[11px] font-semibold text-[#34483D] underline cursor-pointer"
          >
            O elegir otros días libremente en el calendario interactivo
          </button>
        </div>
      )}

      {value.mode === "calendar_multi" && (
        <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-bold text-[#26332D] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#23845B]" />
              <span>Toca varias fechas en el calendario:</span>
            </div>
            <span className="text-[10px] font-bold text-[#23845B] bg-[#EDF7F2] px-2 py-0.5 rounded-full">
              {value.selectedDays.length} fecha(s)
            </span>
          </div>

          {/* Navegador de mes para visualizar en qué día de la semana cae cada fecha */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() =>
                setCalendarPreviewYm((prev) => shiftYearMonth(prev, -1))
              }
              className="p-1 rounded-lg bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] cursor-pointer"
              aria-label="Mes anterior en calendario"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-[#26332D]">
              {formatMonthYearEs(calendarPreviewYm)}
            </span>
            <button
              type="button"
              onClick={() =>
                setCalendarPreviewYm((prev) => shiftYearMonth(prev, 1))
              }
              className="p-1 rounded-lg bg-[#FFFFFF] border border-[#E4E6DE] text-[#26332D] cursor-pointer"
              aria-label="Mes siguiente en calendario"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {CALENDAR_HEADER_MON_TO_SUN.map((lbl, idx) => (
              <div
                key={`hdr-${idx}`}
                className={`text-[10px] font-bold py-0.5 ${
                  idx >= 5 ? "text-[#9A6712]" : "text-[#68736B]"
                }`}
              >
                {lbl}
              </div>
            ))}
            {Array.from({ length: mondayOffset }).map((_, idx) => (
              <div key={`pad-${idx}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
              (dayNum) => {
                const isSelected = value.selectedDays.includes(dayNum);
                const cellDow = new Date(
                  Date.UTC(calYear, calMonth - 1, dayNum)
                ).getUTCDay();
                const isExcludedDay =
                  value.excludedWeekdays.includes(cellDow) ||
                  value.excludedMonthDays.includes(dayNum);
                const isWeekend = cellDow === 0 || cellDow === 6;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => toggleCalendarDay(dayNum)}
                    title={
                      isExcludedDay
                        ? `Día ${dayNum} marcado como evitado (se recorrerá automáticamente)`
                        : `Día ${dayNum}`
                    }
                    className={`relative h-8 rounded-lg text-xs font-bold tabular-nums border transition cursor-pointer ${
                      isSelected
                        ? "bg-[#23845B] text-white border-[#23845B] shadow-2xs"
                        : isExcludedDay
                        ? "bg-[#FEF6E7]/80 text-[#9A6712] border-[#F5DFA8] line-through"
                        : isWeekend
                        ? "bg-[#FFFFFF]/80 text-[#68736B] border-[#E4E6DE]"
                        : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE] hover:border-[#91A68C]"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleCalendarDay("last")}
            className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              value.selectedDays.includes("last")
                ? "bg-[#23845B] text-white border-[#23845B]"
                : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Incluir último día de cada mes (28, 30 o 31)</span>
          </button>
        </div>
      )}

      {(value.mode === "monthly" ||
        value.mode === "bimonthly" ||
        value.mode === "quarterly" ||
        value.mode === "semiannual" ||
        value.mode === "annual") && (
        <div className="p-3 rounded-xl bg-[#F6F5F0] border border-[#E4E6DE] space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-[11px] font-semibold text-[#26332D]">
              Día del mes en que toca (1–31):
            </label>
            <button
              type="button"
              onClick={() => update({ dayOfMonth: 31 })}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer ${
                value.dayOfMonth === 31
                  ? "bg-[#34483D] text-white border-[#34483D]"
                  : "bg-[#FFFFFF] text-[#68736B] border-[#E4E6DE]"
              }`}
            >
              Último día del mes
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              max={31}
              value={value.dayOfMonth || ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/^0+(?=\d)/, "");
                const num = Math.min(31, Math.max(1, Number(raw) || 1));
                update({ dayOfMonth: raw === "" ? 1 : num });
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
            />
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
              title="Mes/fecha a partir de cuándo inicia esta regla"
              className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-semibold text-[#26332D]"
            />
          </div>
          {value.mode === "monthly" && (
            <button
              type="button"
              onClick={() => handleModeSelect("calendar_multi")}
              className="text-[11px] font-semibold text-[#34483D] underline cursor-pointer"
            >
              ¿Se repite varios días al mes? Abrir calendario interactivo
            </button>
          )}
        </div>
      )}

      {/* Montos alternados o personalizados por fecha */}
      {allowDifferentAmounts &&
        (value.mode === "biweekly" ||
          value.mode === "semimonthly" ||
          value.mode === "weekly" ||
          (value.mode === "calendar_multi" && value.selectedDays.length > 1)) && (
          <div className="p-3 rounded-xl bg-[#EDF7F2]/70 border border-[#C6E7D6] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-[#26332D]">
                ¿Cambia el monto entre fechas (grande y pequeño)?
              </div>
              <button
                type="button"
                onClick={() =>
                  update({ hasDifferentAmounts: !value.hasDifferentAmounts })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  value.hasDifferentAmounts
                    ? "bg-[#23845B] text-white border-[#23845B]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                {value.hasDifferentAmounts
                  ? "Sí, montos distintos"
                  : "No, siempre igual"}
              </button>
            </div>

            {value.hasDifferentAmounts &&
              (value.mode === "biweekly" ||
                value.mode === "weekly" ||
                (value.mode === "semimonthly" &&
                  value.selectedDays.length === 2)) && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
                    {amountLabel || "Monto del 2do cobro/pago alternado (MXN)"}
                  </label>
                  <CurrencyInput
                    value={value.secondAmount}
                    onChange={(raw) => update({ secondAmount: raw })}
                    placeholder="Ej. 8,500.00"
                    inputClassName="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                  />
                </div>
              )}

            {value.hasDifferentAmounts &&
              value.mode === "calendar_multi" &&
              value.selectedDays.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {value.selectedDays.map((d) => {
                    const key = String(d);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#34483D] w-20 shrink-0">
                          {d === "last" ? "Fin de mes:" : `Día ${d}:`}
                        </span>
                        <div className="flex-1">
                          <CurrencyInput
                            value={value.customDayAmounts[key] || ""}
                            placeholder={
                              baseAmount > 0 ? String(baseAmount) : "Ej. 1,500"
                            }
                            onChange={(raw) =>
                              update({
                                customDayAmounts: {
                                  ...value.customDayAmounts,
                                  [key]: raw,
                                },
                              })
                            }
                            inputClassName="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

      {/* Regla: Que NO caiga en días específicos (aplica a semanal, catorcenal, quincenal y mensual/multi-día) */}
      <div className="rounded-xl border border-[#E4E6DE] bg-[#F6F5F0] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExclusions((prev) => !prev)}
          className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-[#F0F1EB] transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CalendarOff className="w-3.5 h-3.5 text-[#34483D] shrink-0" />
            <span className="text-[11px] font-bold text-[#26332D] truncate">
              Evitar que caiga en días específicos
            </span>
            {hasAnyExclusion && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#34483D] text-white text-[9px] font-bold shrink-0">
                Activo
              </span>
            )}
          </div>
          {isExclusionsOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#68736B] shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#68736B] shrink-0" />
          )}
        </button>

        {isExclusionsOpen && (
          <div className="px-3 pb-3 pt-1 border-t border-[#E4E6DE] space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-[#68736B]">
                Días de la semana a evitar:
              </span>
              <button
                type="button"
                onClick={toggleWeekendExclusionPreset}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                  isSatSunExcluded
                    ? "bg-[#34483D] text-white border-[#34483D]"
                    : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                }`}
              >
                Evitar fin de semana (Sáb y Dom)
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS_ES_CHIPS.map((w) => {
                const active = value.excludedWeekdays.includes(w.value);
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => toggleExcludedWeekday(w.value)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                      active
                        ? "bg-[#C94C4C] text-white border-[#C94C4C]"
                        : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    {w.short}
                  </button>
                );
              })}
            </div>

            {/* Evitar días específicos del mes (ej. día 15, día 30) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#68736B]">
                También evitar días específicos del mes (opcional, 1–31):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={monthDayExcludeInput}
                  onChange={(e) =>
                    setMonthDayExcludeInput(
                      e.target.value.replace(/^0+(?=\d)/, "")
                    )
                  }
                  placeholder="Ej. 15"
                  className="w-24 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E4E6DE] text-xs font-bold tabular-nums text-[#26332D]"
                />
                <button
                  type="button"
                  onClick={addExcludedMonthDay}
                  className="px-2.5 py-1.5 rounded-lg bg-[#34483D] text-white text-[11px] font-semibold cursor-pointer"
                >
                  Evitar día
                </button>
              </div>
              {value.excludedMonthDays.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {value.excludedMonthDays.map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => removeExcludedMonthDay(dom)}
                      className="px-2 py-0.5 rounded-full bg-[#FDF2F2] border border-[#F5CACA] text-[10px] font-bold text-[#C94C4C] cursor-pointer"
                    >
                      Día {dom} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dirección de ajuste si coincide con un día evitado */}
            {hasAnyExclusion && (
              <div className="space-y-1">
                <span className="block text-[11px] font-semibold text-[#68736B]">
                  Si cae en un día evitado, moverlo automáticamente:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ excludedShift: "prev" })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                      value.excludedShift === "prev"
                        ? "bg-[#23845B] text-white border-[#23845B]"
                        : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    Al día válido anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ excludedShift: "next" })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                      value.excludedShift === "next" ||
                      value.excludedShift === "none"
                        ? "bg-[#23845B] text-white border-[#23845B]"
                        : "bg-[#FFFFFF] text-[#26332D] border-[#E4E6DE]"
                    }`}
                  >
                    Al día válido siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vista previa de fechas reales que se colocarán en el calendario */}
      <div className="p-2.5 rounded-xl bg-[#F0F5FA] border border-[#CFE0EE] flex items-start gap-2 text-[11px] text-[#26332D]">
        <Info className="w-3.5 h-3.5 text-[#527A9A] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <strong className="text-[#527A9A]">
            Vista previa ({formatMonthYearEs(previewOccurrences.yearMonth)}):
          </strong>{" "}
          {previewOccurrences.items.length === 0 ? (
            <span>Sin fechas generadas en este mes.</span>
          ) : (
            <span>
              {previewOccurrences.items
                .map((it) =>
                  it.expected_date !== it.occurrence_date
                    ? `${formatShortDateEs(it.expected_date)} (movido desde ${formatShortDateEs(
                        it.occurrence_date || it.expected_date
                      )})`
                    : formatShortDateEs(it.expected_date)
                )
                .join(" • ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
