"use client";

import React from "react";
import type { PriorityLevel, TransactionStatus } from "@/lib/finance/types";

export function PriorityGeometryIcon({
  priority,
  size = "sm",
}: {
  priority: PriorityLevel;
  size?: "xs" | "sm" | "md";
}) {
  const dim =
    size === "xs"
      ? "w-1.5 h-1.5"
      : size === "md"
      ? "w-2.5 h-2.5"
      : "w-2 h-2";

  if (priority === "essential") {
    // Círculo sólido terracota #D47A52
    return (
      <span
        aria-hidden="true"
        className={`inline-block rounded-full bg-[#D47A52] shrink-0 ${dim}`}
      />
    );
  }
  if (priority === "important") {
    // Rombo / diamante ámbar #D99A32
    return (
      <span
        aria-hidden="true"
        className={`inline-block rotate-45 bg-[#D99A32] rounded-[1px] shrink-0 ${dim}`}
      />
    );
  }
  // Círculo con contorno azul pizarra #6E8CA3
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full border-[1.75px] border-[#6E8CA3] bg-transparent shrink-0 ${dim}`}
    />
  );
}

export function PriorityBadge({
  priority,
  compact = false,
}: {
  priority: PriorityLevel;
  compact?: boolean;
}) {
  const config: Record<
    PriorityLevel,
    { label: string; bg: string; text: string; border: string }
  > = {
    essential: {
      label: "Esencial",
      bg: "bg-[#FDF5F2]",
      text: "text-[#A65332]",
      border: "border-[#F1D8CE]",
    },
    important: {
      label: "Importante",
      bg: "bg-[#FEF9EE]",
      text: "text-[#9A6712]",
      border: "border-[#F5E1B9]",
    },
    flexible: {
      label: "Flexible",
      bg: "bg-[#F3F7FA]",
      text: "text-[#4D6A80]",
      border: "border-[#D5E1EB]",
    },
  };

  const c = config[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs"
      } ${c.bg} ${c.text} ${c.border}`}
    >
      <PriorityGeometryIcon priority={priority} size="sm" />
      <span>{c.label}</span>
    </span>
  );
}

export function StatusBadge({
  status,
  isDelayedIncome = false,
  isOverdueExpense = false,
  compact = false,
}: {
  status: TransactionStatus;
  isDelayedIncome?: boolean;
  isOverdueExpense?: boolean;
  compact?: boolean;
}) {
  const effectiveStatus = isOverdueExpense ? "overdue" : status;

  if (isDelayedIncome) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-[#FEF6E7] text-[#9A6712] border border-[#F5DFA8] font-semibold ${
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D99A32]" />
        Ingreso atrasado
      </span>
    );
  }

  const styles: Record<
    TransactionStatus,
    { label: string; classes: string; dot: string }
  > = {
    overdue: {
      label: "Vencido",
      classes: "bg-[#FDF2F2] text-[#C94C4C] border-[#F5CACA]",
      dot: "bg-[#C94C4C]",
    },
    pending: {
      label: "Pendiente",
      classes: "bg-[#F0F1EB] text-[#68736B] border-[#E4E6DE]",
      dot: "bg-[#68736B]",
    },
    paid: {
      label: "Pagado",
      classes: "bg-[#EDF7F2] text-[#23845B] border-[#C6E7D6]",
      dot: "bg-[#23845B]",
    },
    received: {
      label: "Recibido",
      classes: "bg-[#EDF7F2] text-[#23845B] border-[#C6E7D6]",
      dot: "bg-[#23845B]",
    },
    scheduled: {
      label: "Programado",
      classes: "bg-[#F0F5FA] text-[#527A9A] border-[#CFE0EE]",
      dot: "bg-[#527A9A]",
    },
    cancelled: {
      label: "Cancelado",
      classes: "bg-[#F3F4F1] text-[#8B948E] border-[#E4E6DE] line-through",
      dot: "bg-[#8B948E]",
    },
  };

  const st = styles[effectiveStatus] || styles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      } ${st.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
      <span>{st.label}</span>
    </span>
  );
}
