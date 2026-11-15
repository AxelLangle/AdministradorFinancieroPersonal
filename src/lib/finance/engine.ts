import type {
  Account,
  Budget,
  BudgetSummary,
  CustomScheduleDayItem,
  DailyProjectionPoint,
  ExcludedDayShift,
  FinancialInsightTip,
  FinancialProjectionExplanation,
  MonthProjectionSummary,
  NextIncomeStretch,
  ParsedRecurrenceSchedule,
  PriorityLevel,
  RecurrenceEditScope,
  RecurrenceRule,
  TrafficLightColor,
  Transaction,
  TransactionFilters,
} from "./types";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTHS_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Formatea un número con comas cada 3 dígitos y punto para separar 2 decimales de centavos (ej. 12,345.67).
 * No depende de variaciones de locale del navegador.
 */
export function formatNumberWithCommas(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0.00";
  }
  const absVal = Math.abs(roundCurrency(value));
  const fixed = absVal.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

export function formatMXN(
  amount: number | null | undefined,
  options?: {
    showPrefix?: boolean;
    showPlusSign?: boolean;
    showMinusSign?: boolean;
    approximate?: boolean;
  }
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "Monto por definir";
  }
  const formattedNumber = formatNumberWithCommas(amount, 2);

  const prefix = options?.showPrefix !== false ? "MXN " : "";
  const approx = options?.approximate ? "~" : "";
  let sign = "";
  if (amount < 0 || options?.showMinusSign) {
    sign = "-";
  } else if (options?.showPlusSign && amount > 0) {
    sign = "+";
  }

  return `${sign}${prefix}${approx}$${formattedNumber}`;
}

export function getTodayMexicoCity(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function formatDateDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export function formatShortDateEs(dateStr: string): string {
  const [, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  if (!m || !d) return dateStr;
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT_ES[m - 1]}`;
}

export function formatMonthYearEs(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) return yearMonth;
  return `${MONTHS_ES[m - 1]} ${y}`;
}

export function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function getMonthStartEnd(yearMonth: string): {
  startDate: string;
  endDate: string;
  year: number;
  month: number;
  daysInMonth: number;
} {
  const [year, month] = yearMonth.split("-").map(Number);
  const daysInMonth = getDaysInMonth(year, month);
  const mm = String(month).padStart(2, "0");
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`,
    year,
    month,
    daysInMonth,
  };
}

export function getPreviousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

export function getNextYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getEffectiveDate(tx: Transaction): string {
  if (
    (tx.status === "paid" || tx.status === "received") &&
    tx.settled_date
  ) {
    return tx.settled_date.slice(0, 10);
  }
  return tx.expected_date.slice(0, 10);
}

/**
 * Indica si un movimiento debe mostrarse en la casilla o detalle de un día del calendario.
 * Cuando se confirma como pagado o recibido en una fecha distinta a la esperada, permanece visible
 * tanto en la fecha real de liquidación como en su fecha esperada original para que no desaparezca del calendario.
 */
export function appearsOnCalendarDate(tx: Transaction, dateStr: string): boolean {
  if (tx.status === "cancelled") return false;
  const targetDate = dateStr.slice(0, 10);
  if (getEffectiveDate(tx) === targetDate) return true;
  if (
    (tx.status === "paid" || tx.status === "received") &&
    tx.expected_date.slice(0, 10) === targetDate
  ) {
    return true;
  }
  return false;
}

export function getEffectiveAmount(tx: Transaction): number {
  if (tx.status === "cancelled") return 0;
  if (tx.status === "paid" || tx.status === "received") {
    return roundCurrency(tx.actual_amount ?? tx.estimated_amount ?? 0);
  }
  return roundCurrency(tx.estimated_amount ?? 0);
}

export function isUnquantifiedExpense(tx: Transaction): boolean {
  return (
    tx.type === "expense" &&
    (tx.status === "pending" || tx.status === "overdue") &&
    (tx.estimated_amount === null || tx.estimated_amount === undefined)
  );
}

export function isExpenseOverdue(
  tx: Transaction,
  referenceDate: string
): boolean {
  if (tx.type !== "expense") return false;
  if (tx.status === "paid" || tx.status === "cancelled") return false;
  return (
    tx.status === "overdue" ||
    (tx.status === "pending" && tx.expected_date.slice(0, 10) < referenceDate)
  );
}

export function isIncomeDelayed(
  tx: Transaction,
  referenceDate: string
): boolean {
  if (tx.type !== "income") return false;
  if (tx.status !== "scheduled") return false;
  return tx.expected_date.slice(0, 10) < referenceDate;
}

/**
 * Regla de corte del saldo inicial:
 * Un movimiento confirmado (pagado o recibido) modifica el saldo actual si y solo si:
 * - settled_date > opening_balance_date, O
 * - settled_date == opening_balance_date Y settled_at > opening_balance_at.
 */
export function affectsCurrentBalance(
  tx: Transaction,
  account: Account
): boolean {
  if (tx.status !== "paid" && tx.status !== "received") {
    return false;
  }
  // Si settled_at es null, se trata de un movimiento histórico o anterior a hoy
  // que ya está reflejado en el saldo actual de la cuenta.
  if (!tx.settled_at) {
    return false;
  }
  const settledDate = (tx.settled_date || tx.expected_date).slice(0, 10);
  const openingDate = account.opening_balance_date.slice(0, 10);

  if (settledDate > openingDate) {
    return true;
  }
  if (settledDate < openingDate) {
    return false;
  }

  if (!account.opening_balance_at) {
    return false;
  }
  return (
    new Date(tx.settled_at).getTime() >
    new Date(account.opening_balance_at).getTime()
  );
}

export function isDateBeforeOpeningBalance(
  dateStr: string,
  account: Account
): boolean {
  return dateStr.slice(0, 10) < account.opening_balance_date.slice(0, 10);
}

export function isPriorToTodayOrCutoff(
  dateStr: string,
  account: Account,
  referenceDate: string
): boolean {
  const cleanDate = dateStr.slice(0, 10);
  return (
    cleanDate < referenceDate.slice(0, 10) ||
    isDateBeforeOpeningBalance(cleanDate, account)
  );
}

export function calculateCurrentBalance(
  account: Account,
  transactions: Transaction[]
): number {
  let balance = roundCurrency(account.opening_balance);

  for (const tx of transactions) {
    if (tx.account_id !== account.id) continue;
    if (!affectsCurrentBalance(tx, account)) continue;

    const amount = getEffectiveAmount(tx);
    if (tx.type === "income" && tx.status === "received") {
      balance = roundCurrency(balance + amount);
    } else if (tx.type === "expense" && tx.status === "paid") {
      balance = roundCurrency(balance - amount);
    }
  }

  return balance;
}

export function calculateMonthProjection(params: {
  yearMonth: string;
  referenceDate: string;
  account: Account;
  transactions: Transaction[];
  budget?: Budget | null;
}): MonthProjectionSummary {
  const { yearMonth, referenceDate, account, transactions, budget } = params;
  const currentYearMonth = referenceDate.slice(0, 7);
  const { startDate, endDate, year, month, daysInMonth } =
    getMonthStartEnd(yearMonth);

  const currentBalance = calculateCurrentBalance(account, transactions);
  const minCushionAmount = roundCurrency(
    budget?.min_cushion_amount ??
      (budget?.total_limit
        ? budget.total_limit * ((budget.min_cushion_percent || 10) / 100)
        : 0)
  );

  let periodRelationship: "past" | "current" | "future" = "current";
  if (yearMonth < currentYearMonth) periodRelationship = "past";
  else if (yearMonth > currentYearMonth) periodRelationship = "future";

  const monthTransactions = transactions.filter((tx) => {
    if (tx.account_id !== account.id) return false;
    if (tx.status === "cancelled") return false;
    const effDate = getEffectiveDate(tx);
    return effDate >= startDate && effDate <= endDate;
  });

  const receivedIncome = roundCurrency(
    monthTransactions
      .filter((tx) => tx.type === "income" && tx.status === "received")
      .reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  const delayedIncomesList = monthTransactions.filter(
    (tx) => tx.type === "income" && isIncomeDelayed(tx, referenceDate)
  );
  const delayedIncome = roundCurrency(
    delayedIncomesList.reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  const scheduledIncome = roundCurrency(
    monthTransactions
      .filter(
        (tx) =>
          tx.type === "income" &&
          tx.status === "scheduled" &&
          !isIncomeDelayed(tx, referenceDate)
      )
      .reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  const paidExpense = roundCurrency(
    monthTransactions
      .filter((tx) => tx.type === "expense" && tx.status === "paid")
      .reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  const pendingExpensesList = transactions.filter((tx) => {
    if (tx.account_id !== account.id) return false;
    if (tx.type !== "expense") return false;
    if (tx.status !== "pending" && tx.status !== "overdue") return false;
    const expDate = tx.expected_date.slice(0, 10);
    if (periodRelationship === "current") {
      return expDate <= endDate;
    }
    return expDate >= startDate && expDate <= endDate;
  });

  const pendingExpense = roundCurrency(
    pendingExpensesList.reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  const overdueExpensesList = pendingExpensesList.filter((tx) =>
    isExpenseOverdue(tx, referenceDate)
  );
  const overdueExpenseCount = overdueExpensesList.length;
  const overdueExpenseAmount = roundCurrency(
    overdueExpensesList.reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  const unquantifiedList = pendingExpensesList.filter((tx) =>
    isUnquantifiedExpense(tx)
  );
  const hasUnquantifiedPendingExpenses = unquantifiedList.length > 0;
  const unquantifiedPendingExpensesCount = unquantifiedList.length;

  const committedExpense = roundCurrency(paidExpense + pendingExpense);

  if (periodRelationship === "past") {
    const openingDate = account.opening_balance_date.slice(0, 10);
    if (endDate < openingDate) {
      return {
        yearMonth,
        periodRelationship,
        startingBalance: null,
        currentBalance,
        receivedIncome,
        scheduledIncome: 0,
        delayedIncome,
        paidExpense,
        pendingExpense,
        overdueExpenseCount,
        overdueExpenseAmount,
        delayedIncomeCount: delayedIncomesList.length,
        committedExpense,
        projectedClosingBalance: null,
        historicalBalanceUnavailableMessage: `Saldo no disponible antes del ${formatDateDDMMYYYY(
          openingDate
        )}`,
        lowestBalancePoint: null,
        minCushionAmount,
        hasUnquantifiedPendingExpenses,
        unquantifiedPendingExpensesCount,
        balanceTrafficLight: "green",
        dailyCurve: [],
      };
    }
  }

  let startingBalance = currentBalance;
  if (periodRelationship === "future") {
    const prevMonth = getPreviousYearMonth(yearMonth);
    const prevSummary = calculateMonthProjection({
      yearMonth: prevMonth,
      referenceDate,
      account,
      transactions,
      budget,
    });
    startingBalance = prevSummary.projectedClosingBalance ?? currentBalance;
  }

  const projectedClosingBalance = roundCurrency(
    startingBalance + scheduledIncome - pendingExpense
  );

  const dailyCurve: DailyProjectionPoint[] = [];
  let runningBalance = startingBalance;

  let lowestBalancePoint: { date: string; balance: number } = {
    date: periodRelationship === "current" ? referenceDate : startDate,
    balance: startingBalance,
  };

  const mm = String(month).padStart(2, "0");
  for (let day = 1; day <= daysInMonth; day++) {
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;

    const dayTxs = monthTransactions.filter(
      (tx) => getEffectiveDate(tx) === dateStr
    );

    let dayIncomes = 0;
    let dayExpenses = 0;
    let dayHasUnquantified = false;

    if (periodRelationship === "current") {
      if (dateStr === referenceDate) {
        for (const overdueTx of overdueExpensesList) {
          dayExpenses = roundCurrency(
            dayExpenses + getEffectiveAmount(overdueTx)
          );
          if (isUnquantifiedExpense(overdueTx)) dayHasUnquantified = true;
        }
      }

      if (dateStr >= referenceDate) {
        for (const tx of dayTxs) {
          if (
            tx.type === "income" &&
            tx.status === "scheduled" &&
            !isIncomeDelayed(tx, referenceDate)
          ) {
            dayIncomes = roundCurrency(dayIncomes + getEffectiveAmount(tx));
          } else if (
            tx.type === "expense" &&
            (tx.status === "pending" || tx.status === "overdue") &&
            !isExpenseOverdue(tx, referenceDate)
          ) {
            dayExpenses = roundCurrency(dayExpenses + getEffectiveAmount(tx));
            if (isUnquantifiedExpense(tx)) dayHasUnquantified = true;
          }
        }
        runningBalance = roundCurrency(
          runningBalance + dayIncomes - dayExpenses
        );
        if (runningBalance < lowestBalancePoint.balance) {
          lowestBalancePoint = { date: dateStr, balance: runningBalance };
        }
      }
    } else if (periodRelationship === "future") {
      for (const tx of dayTxs) {
        if (tx.type === "income" && tx.status === "scheduled") {
          dayIncomes = roundCurrency(dayIncomes + getEffectiveAmount(tx));
        } else if (
          tx.type === "expense" &&
          (tx.status === "pending" || tx.status === "overdue")
        ) {
          dayExpenses = roundCurrency(dayExpenses + getEffectiveAmount(tx));
          if (isUnquantifiedExpense(tx)) dayHasUnquantified = true;
        }
      }
      runningBalance = roundCurrency(runningBalance + dayIncomes - dayExpenses);
      if (runningBalance < lowestBalancePoint.balance) {
        lowestBalancePoint = { date: dateStr, balance: runningBalance };
      }
    }

    dailyCurve.push({
      date: dateStr,
      dayNumber: day,
      incomesTotal: dayIncomes,
      expensesTotal: dayExpenses,
      netChange: roundCurrency(dayIncomes - dayExpenses),
      closingBalance: runningBalance,
      hasUnquantifiedExpense: dayHasUnquantified,
      transactions: dayTxs,
    });
  }

  let balanceTrafficLight: TrafficLightColor = "green";
  if (projectedClosingBalance < 0 || lowestBalancePoint.balance < 0) {
    balanceTrafficLight = "red";
  } else if (
    (minCushionAmount > 0 && lowestBalancePoint.balance < minCushionAmount) ||
    hasUnquantifiedPendingExpenses
  ) {
    balanceTrafficLight = "amber";
  } else {
    balanceTrafficLight = "green";
  }

  return {
    yearMonth,
    periodRelationship,
    startingBalance,
    currentBalance,
    receivedIncome,
    scheduledIncome,
    delayedIncome,
    paidExpense,
    pendingExpense,
    overdueExpenseCount,
    overdueExpenseAmount,
    delayedIncomeCount: delayedIncomesList.length,
    committedExpense,
    projectedClosingBalance,
    historicalBalanceUnavailableMessage: null,
    lowestBalancePoint,
    minCushionAmount,
    hasUnquantifiedPendingExpenses,
    unquantifiedPendingExpensesCount,
    balanceTrafficLight,
    dailyCurve,
  };
}

export function calculateBudgetSummary(params: {
  yearMonth: string;
  referenceDate: string;
  account: Account;
  transactions: Transaction[];
  budget: Budget;
}): BudgetSummary {
  const { yearMonth, referenceDate, account, transactions, budget } = params;
  const { startDate, endDate } = getMonthStartEnd(yearMonth);
  const currentYearMonth = referenceDate.slice(0, 7);

  const paidExpenses = transactions.filter((tx) => {
    if (tx.account_id !== account.id || tx.type !== "expense") return false;
    if (tx.status !== "paid") return false;
    const effDate = getEffectiveDate(tx);
    return effDate >= startDate && effDate <= endDate;
  });

  const pendingExpenses = transactions.filter((tx) => {
    if (tx.account_id !== account.id || tx.type !== "expense") return false;
    if (tx.status !== "pending" && tx.status !== "overdue") return false;
    const expDate = tx.expected_date.slice(0, 10);
    if (yearMonth === currentYearMonth) {
      return expDate <= endDate;
    }
    return expDate >= startDate && expDate <= endDate;
  });

  const paidExpense = roundCurrency(
    paidExpenses.reduce((s, tx) => s + getEffectiveAmount(tx), 0)
  );
  const pendingExpense = roundCurrency(
    pendingExpenses.reduce((s, tx) => s + getEffectiveAmount(tx), 0)
  );
  const committedExpense = roundCurrency(paidExpense + pendingExpense);
  const totalLimit = roundCurrency(budget.total_limit);
  const availableBudget = roundCurrency(totalLimit - committedExpense);

  const committedPercent =
    totalLimit > 0 ? roundCurrency((committedExpense / totalLimit) * 100) : 0;
  const paidPercent =
    totalLimit > 0 ? roundCurrency((paidExpense / totalLimit) * 100) : 0;
  const pendingPercent =
    totalLimit > 0 ? roundCurrency((pendingExpense / totalLimit) * 100) : 0;

  const threshold = budget.alert_threshold_percent || 80;
  let trafficLight: TrafficLightColor = "green";
  if (totalLimit > 0 && committedPercent > 100) {
    trafficLight = "red";
  } else if (totalLimit > 0 && committedPercent >= threshold) {
    trafficLight = "amber";
  }

  const priorities: { priority: PriorityLevel; label: string }[] = [
    { priority: "essential", label: "Esencial" },
    { priority: "important", label: "Importante" },
    { priority: "flexible", label: "Flexible" },
  ];

  const priorityBreakdown = priorities.map(({ priority, label }) => {
    const pPaid = roundCurrency(
      paidExpenses
        .filter((tx) => tx.priority === priority)
        .reduce((s, tx) => s + getEffectiveAmount(tx), 0)
    );
    const pPending = roundCurrency(
      pendingExpenses
        .filter((tx) => tx.priority === priority)
        .reduce((s, tx) => s + getEffectiveAmount(tx), 0)
    );
    const pTotal = roundCurrency(pPaid + pPending);
    const percentOfBudget =
      totalLimit > 0 ? roundCurrency((pTotal / totalLimit) * 100) : 0;

    return {
      priority,
      label,
      paid: pPaid,
      pending: pPending,
      total: pTotal,
      percentOfBudget,
    };
  });

  return {
    totalLimit,
    paidExpense,
    pendingExpense,
    committedExpense,
    availableBudget,
    committedPercent,
    paidPercent,
    pendingPercent,
    alertThresholdPercent: threshold,
    trafficLight,
    priorityBreakdown,
  };
}

export function calculateNextIncomeStretch(params: {
  yearMonth: string;
  referenceDate: string;
  account: Account;
  transactions: Transaction[];
  budget?: Budget | null;
}): NextIncomeStretch {
  const { yearMonth, referenceDate, account, transactions, budget } = params;
  const projection = calculateMonthProjection({
    yearMonth,
    referenceDate,
    account,
    transactions,
    budget,
  });

  const upcomingIncomes = transactions
    .filter(
      (tx) =>
        tx.account_id === account.id &&
        tx.type === "income" &&
        tx.status === "scheduled" &&
        tx.expected_date.slice(0, 10) >= referenceDate
    )
    .sort((a, b) => a.expected_date.localeCompare(b.expected_date));

  const nextIncomeTransaction = upcomingIncomes[0] || null;
  let daysUntilNextIncome: number | null = null;
  let pendingExpensesBeforeNextIncome = projection.pendingExpense;
  let pendingExpensesCountBeforeNextIncome = 0;

  if (nextIncomeTransaction) {
    const refTime = new Date(`${referenceDate}T00:00:00Z`).getTime();
    const nextTime = new Date(
      `${nextIncomeTransaction.expected_date.slice(0, 10)}T00:00:00Z`
    ).getTime();
    daysUntilNextIncome = Math.max(
      0,
      Math.round((nextTime - refTime) / (1000 * 60 * 60 * 24))
    );

    const expensesBefore = transactions.filter(
      (tx) =>
        tx.account_id === account.id &&
        tx.type === "expense" &&
        (tx.status === "pending" || tx.status === "overdue") &&
        tx.expected_date.slice(0, 10) <=
          nextIncomeTransaction.expected_date.slice(0, 10)
    );
    pendingExpensesCountBeforeNextIncome = expensesBefore.length;
    pendingExpensesBeforeNextIncome = roundCurrency(
      expensesBefore.reduce((s, tx) => s + getEffectiveAmount(tx), 0)
    );
  }

  const balanceJustBeforeNextIncome = roundCurrency(
    projection.currentBalance - pendingExpensesBeforeNextIncome
  );

  return {
    nextIncomeTransaction,
    daysUntilNextIncome,
    pendingExpensesBeforeNextIncome,
    pendingExpensesCountBeforeNextIncome,
    balanceJustBeforeNextIncome,
    lowestPointOfMonth: projection.lowestBalancePoint ?? {
      date: referenceDate,
      balance: projection.currentBalance,
    },
  };
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
  referenceDate: string
): Transaction[] {
  return transactions.filter((tx) => {
    if (
      tx.status === "cancelled" &&
      !(filters.statuses as readonly string[]).includes("cancelled")
    ) {
      return false;
    }

    if (filters.searchQuery.trim() !== "") {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchNotes = (tx.notes || "").toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }

    if (filters.type !== "all" && tx.type !== filters.type) {
      return false;
    }

    if (filters.statuses.length > 0) {
      const effectiveStatus = isExpenseOverdue(tx, referenceDate)
        ? "overdue"
        : tx.status;
      if (!filters.statuses.includes(effectiveStatus)) {
        return false;
      }
    }

    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(tx.priority)
    ) {
      return false;
    }

    if (
      filters.categoryIds.length > 0 &&
      (!tx.category_id || !filters.categoryIds.includes(tx.category_id))
    ) {
      return false;
    }

    if (filters.recurrenceFilter === "recurring" && !tx.recurrence_rule_id) {
      return false;
    }
    if (filters.recurrenceFilter === "one_off" && tx.recurrence_rule_id) {
      return false;
    }

    return true;
  });
}

export function applyRecurrenceEditScope(params: {
  transactions: Transaction[];
  rules: RecurrenceRule[];
  targetTransactionId: string;
  scope: RecurrenceEditScope;
  updates: Partial<
    Pick<
      Transaction,
      | "title"
      | "estimated_amount"
      | "actual_amount"
      | "expected_date"
      | "settled_date"
      | "settled_at"
      | "status"
      | "priority"
      | "category_id"
      | "amount_type"
      | "notes"
    >
  >;
}): {
  transactions: Transaction[];
  rules: RecurrenceRule[];
} {
  const { transactions, rules, targetTransactionId, scope, updates } = params;
  const targetTx = transactions.find((t) => t.id === targetTransactionId);
  if (!targetTx) {
    return { transactions, rules };
  }

  const ruleId = targetTx.recurrence_rule_id;
  const targetOccDate = (
    targetTx.occurrence_date || targetTx.expected_date
  ).slice(0, 10);
  const nowIso = new Date().toISOString();

  const batchUpdates = { ...updates };
  delete batchUpdates.status;
  delete batchUpdates.settled_date;
  delete batchUpdates.settled_at;
  delete batchUpdates.actual_amount;

  const updatedTransactions = transactions.map((tx) => {
    const isSettled = tx.status === "paid" || tx.status === "received";

    if (scope === "single") {
      if (tx.id !== targetTransactionId) return tx;
      return {
        ...tx,
        ...updates,
        is_exception: true,
        updated_at: nowIso,
      };
    }

    if (!ruleId || tx.recurrence_rule_id !== ruleId || isSettled) {
      return tx;
    }

    const txOccDate = (tx.occurrence_date || tx.expected_date).slice(0, 10);

    if (scope === "future" && txOccDate >= targetOccDate) {
      let newExpectedDate = tx.expected_date;
      if (updates.expected_date && tx.id === targetTransactionId) {
        newExpectedDate = updates.expected_date;
      } else if (updates.expected_date) {
        const newDay = updates.expected_date.slice(8, 10);
        const [y, m] = tx.expected_date.slice(0, 7).split("-").map(Number);
        const maxDay = getDaysInMonth(y, m);
        const clampedDay = String(Math.min(Number(newDay), maxDay)).padStart(
          2,
          "0"
        );
        newExpectedDate = `${tx.expected_date.slice(0, 7)}-${clampedDay}`;
      }

      return {
        ...tx,
        ...batchUpdates,
        expected_date: newExpectedDate,
        updated_at: nowIso,
      };
    }

    if (scope === "all_pending") {
      return {
        ...tx,
        ...batchUpdates,
        expected_date:
          tx.id === targetTransactionId && updates.expected_date
            ? updates.expected_date
            : tx.expected_date,
        updated_at: nowIso,
      };
    }

    return tx;
  });

  const updatedRules = rules.map((rule) => {
    if (!ruleId || rule.id !== ruleId) return rule;
    if (scope === "single") return rule;
    return {
      ...rule,
      title: updates.title ?? rule.title,
      default_amount:
        updates.estimated_amount !== undefined
          ? updates.estimated_amount
          : rule.default_amount,
      priority: updates.priority ?? rule.priority,
      category_id:
        updates.category_id !== undefined
          ? updates.category_id
          : rule.category_id,
      amount_type: updates.amount_type ?? rule.amount_type,
      notes: updates.notes !== undefined ? updates.notes : rule.notes,
      day_of_month: updates.expected_date
        ? Number(updates.expected_date.slice(8, 10))
        : rule.day_of_month,
    };
  });

  return {
    transactions: updatedTransactions,
    rules: updatedRules,
  };
}

const WEEKDAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const WEEKDAY_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/**
 * Serializa días personalizados, montos alternados (ej. catorcena grande y pequeña),
 * ajuste de fin de semana y días excluidos (que no caigan en días específicos)
 * dentro del campo `semimonthly_days` compatible con Supabase.
 */
export function serializeRecurrenceSchedule(params: {
  items?: CustomScheduleDayItem[];
  alternateAmount?: number | null;
  weekendShift?: "none" | "friday";
  excludedWeekdays?: number[];
  excludedMonthDays?: number[];
  excludedShift?: ExcludedDayShift;
}): string | null {
  const parts: string[] = [];

  if (
    params.alternateAmount !== undefined &&
    params.alternateAmount !== null &&
    params.alternateAmount > 0
  ) {
    parts.push(`alt:${roundCurrency(params.alternateAmount)}`);
  }

  if (params.items && params.items.length > 0) {
    const dayTokens = params.items.map((item) => {
      const dayKey = item.day === "last" ? "last" : String(item.day);
      if (
        item.amount !== undefined &&
        item.amount !== null &&
        item.amount > 0
      ) {
        return `${dayKey}:${roundCurrency(item.amount)}`;
      }
      return dayKey;
    });
    parts.push(dayTokens.join(","));
  }

  const flags: string[] = [];
  const normExDow = Array.from(
    new Set(
      (params.excludedWeekdays || []).filter(
        (d) => Number.isInteger(d) && d >= 0 && d <= 6
      )
    )
  ).sort((a, b) => a - b);

  const normExDom = Array.from(
    new Set(
      (params.excludedMonthDays || []).filter(
        (d) => Number.isInteger(d) && d >= 1 && d <= 31
      )
    )
  ).sort((a, b) => a - b);

  const effectiveShift: ExcludedDayShift =
    params.excludedShift && params.excludedShift !== "none"
      ? params.excludedShift
      : params.weekendShift === "friday"
      ? "prev"
      : normExDow.length > 0 || normExDom.length > 0
      ? "next"
      : "none";

  const isPureWeekendPrev =
    (params.weekendShift === "friday" &&
      normExDow.length === 0 &&
      normExDom.length === 0) ||
    (normExDow.length === 2 &&
      normExDow[0] === 0 &&
      normExDow[1] === 6 &&
      normExDom.length === 0 &&
      effectiveShift === "prev");

  if (isPureWeekendPrev) {
    flags.push("weekend=friday");
  } else {
    if (normExDow.length > 0) {
      flags.push(`exdow=${normExDow.join(",")}`);
    }
    if (normExDom.length > 0) {
      flags.push(`exdom=${normExDom.join(",")}`);
    }
    if (
      (normExDow.length > 0 || normExDom.length > 0) &&
      effectiveShift !== "none"
    ) {
      flags.push(`shift=${effectiveShift}`);
    }
  }

  const mainStr = parts.join("|");
  const allTokens = [mainStr, ...flags].filter(Boolean);
  return allTokens.join(";") || null;
}

/**
 * Parsea la configuración avanzada de una regla recurrente (`semimonthly_days`, `day_of_month`, `frequency`).
 */
export function parseRecurrenceSchedule(
  rule: Pick<
    RecurrenceRule,
    | "frequency"
    | "day_of_month"
    | "semimonthly_days"
    | "day_of_week"
    | "default_amount"
  >
): ParsedRecurrenceSchedule {
  let weekendShift: "none" | "friday" = "none";
  let excludedWeekdays: number[] = [];
  let excludedMonthDays: number[] = [];
  let excludedShift: ExcludedDayShift = "none";
  let alternateAmount: number | null = null;
  const items: CustomScheduleDayItem[] = [];

  const raw = (rule.semimonthly_days || "").trim();
  if (raw) {
    const segments = raw
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const scheduleParts: string[] = [];

    for (const seg of segments) {
      if (seg === "weekend=friday") {
        weekendShift = "friday";
        if (excludedWeekdays.length === 0) {
          excludedWeekdays = [0, 6];
        }
        if (excludedShift === "none") {
          excludedShift = "prev";
        }
      } else if (seg.startsWith("exdow=")) {
        const parsedDows = seg
          .slice(6)
          .split(",")
          .map((n) => Number(n.trim()))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
        excludedWeekdays = Array.from(new Set(parsedDows)).sort((a, b) => a - b);
      } else if (seg.startsWith("exdom=")) {
        const parsedDoms = seg
          .slice(6)
          .split(",")
          .map((n) => Number(n.trim()))
          .filter((d) => Number.isInteger(d) && d >= 1 && d <= 31);
        excludedMonthDays = Array.from(new Set(parsedDoms)).sort(
          (a, b) => a - b
        );
      } else if (seg.startsWith("shift=")) {
        const val = seg.slice(6).trim();
        if (val === "prev" || val === "next" || val === "none") {
          excludedShift = val;
        }
      } else {
        scheduleParts.push(seg);
      }
    }

    if (
      (excludedWeekdays.length > 0 || excludedMonthDays.length > 0) &&
      excludedShift === "none"
    ) {
      excludedShift = "next";
    }

    for (const mainPart of scheduleParts) {
      const sections = mainPart.split("|");
      for (const sec of sections) {
        const trimmed = sec.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("alt:")) {
          const val = Number(trimmed.slice(4));
          if (!Number.isNaN(val) && val > 0) {
            alternateAmount = roundCurrency(val);
          }
          continue;
        }
        const tokens = trimmed.split(",");
        for (const tok of tokens) {
          const clean = tok.trim();
          if (!clean) continue;
          const [dayStr, amtStr] = clean.split(":");
          const dayKey =
            dayStr === "last"
              ? "last"
              : Math.min(31, Math.max(1, Number(dayStr) || 1));
          const parsedAmt =
            amtStr !== undefined && amtStr !== "" ? Number(amtStr) : null;
          items.push({
            day: dayKey,
            amount:
              parsedAmt !== null && !Number.isNaN(parsedAmt) && parsedAmt > 0
                ? roundCurrency(parsedAmt)
                : null,
          });
        }
      }
    }
  }

  if (rule.frequency === "weekly") {
    return {
      mode: "weekly",
      items,
      alternateAmount,
      weekendShift,
      excludedWeekdays,
      excludedMonthDays,
      excludedShift,
    };
  }

  if (rule.frequency === "biweekly") {
    return {
      mode: "biweekly",
      items,
      alternateAmount,
      weekendShift,
      excludedWeekdays,
      excludedMonthDays,
      excludedShift,
    };
  }

  if (rule.frequency === "semimonthly") {
    const effectiveItems =
      items.length > 0
        ? items
        : [{ day: 15 as const }, { day: "last" as const }];
    return {
      mode: effectiveItems.length > 2 ? "multi_day" : "semimonthly",
      items: effectiveItems,
      alternateAmount,
      weekendShift,
      excludedWeekdays,
      excludedMonthDays,
      excludedShift,
    };
  }

  if (items.length > 1) {
    return {
      mode: "multi_day",
      items,
      alternateAmount,
      weekendShift,
      excludedWeekdays,
      excludedMonthDays,
      excludedShift,
    };
  }

  const singleDay: CustomScheduleDayItem =
    items[0] || { day: rule.day_of_month || 1, amount: null };

  return {
    mode: "single_day",
    items: [singleDay],
    alternateAmount,
    weekendShift,
    excludedWeekdays,
    excludedMonthDays,
    excludedShift,
  };
}

function formatUtcDateISO(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Ajusta una fecha YYYY-MM-DD para que no caiga en días de la semana ni días del mes excluidos,
 * moviéndola al día válido anterior ("prev") o siguiente ("next") de forma segura en UTC.
 */
export function adjustDateForExclusions(
  dateStr: string,
  schedule: Pick<
    ParsedRecurrenceSchedule,
    "weekendShift" | "excludedWeekdays" | "excludedMonthDays" | "excludedShift"
  >
): string {
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return clean;

  const exDows =
    schedule.excludedWeekdays.length > 0
      ? schedule.excludedWeekdays
      : schedule.weekendShift === "friday"
      ? [0, 6]
      : [];
  const exDoms = schedule.excludedMonthDays || [];
  const shift: ExcludedDayShift =
    schedule.excludedShift && schedule.excludedShift !== "none"
      ? schedule.excludedShift
      : schedule.weekendShift === "friday"
      ? "prev"
      : "none";

  if ((exDows.length === 0 && exDoms.length === 0) || shift === "none") {
    return clean;
  }

  const stepDelta = shift === "prev" ? -1 : 1;
  const cursor = new Date(Date.UTC(y, m - 1, d));

  for (let i = 0; i < 31; i++) {
    const dow = cursor.getUTCDay();
    const dom = cursor.getUTCDate();
    const isExcluded = exDows.includes(dow) || exDoms.includes(dom);
    if (!isExcluded) {
      return formatUtcDateISO(cursor);
    }
    cursor.setUTCDate(cursor.getUTCDate() + stepDelta);
  }

  return clean;
}

export function adjustDateForWeekend(
  dateStr: string,
  weekendShift: "none" | "friday"
): string {
  if (weekendShift !== "friday") return dateStr.slice(0, 10);
  return adjustDateForExclusions(dateStr, {
    weekendShift: "friday",
    excludedWeekdays: [0, 6],
    excludedMonthDays: [],
    excludedShift: "prev",
  });
}

function formatExclusionsSummaryEs(parsed: ParsedRecurrenceSchedule): string {
  const hasExDows = parsed.excludedWeekdays.length > 0;
  const hasExDoms = parsed.excludedMonthDays.length > 0;
  if (!hasExDows && !hasExDoms) {
    return parsed.weekendShift === "friday" ? " • Fin de semana → Viernes" : "";
  }
  const shiftTxt = parsed.excludedShift === "prev" ? "día ant." : "sig. válido";
  const parts: string[] = [];
  if (
    parsed.excludedWeekdays.length === 2 &&
    parsed.excludedWeekdays[0] === 0 &&
    parsed.excludedWeekdays[1] === 6
  ) {
    parts.push("fin de semana");
  } else if (hasExDows) {
    parts.push(
      parsed.excludedWeekdays.map((d) => WEEKDAY_SHORT_ES[d] || d).join(", ")
    );
  }
  if (hasExDoms) {
    parts.push(`días ${parsed.excludedMonthDays.join(", ")}`);
  }
  return ` • Evita ${parts.join(" y ")} (→ ${shiftTxt})`;
}

/**
 * Genera una descripción clara en español del esquema de cobro/pago de una regla recurrente.
 */
export function describeRecurrenceRuleSchedule(rule: RecurrenceRule): string {
  const parsed = parseRecurrenceSchedule(rule);
  const exclusionsNote = formatExclusionsSummaryEs(parsed);

  if (rule.frequency === "biweekly") {
    if (parsed.alternateAmount && parsed.alternateAmount > 0) {
      return `Catorcenal (cada 14 días) • Alterna ${formatMXN(
        rule.default_amount,
        { showPrefix: false }
      )} y ${formatMXN(parsed.alternateAmount, {
        showPrefix: false,
      })}${exclusionsNote}`;
    }
    return `Catorcenal (cada 14 días desde ${formatShortDateEs(
      rule.start_date
    )})${exclusionsNote}`;
  }

  if (rule.frequency === "weekly") {
    const dow =
      rule.day_of_week !== null && rule.day_of_week !== undefined
        ? rule.day_of_week
        : new Date(`${rule.start_date.slice(0, 10)}T00:00:00Z`).getUTCDay();
    const dayName = WEEKDAY_NAMES_ES[dow] || "Viernes";
    if (parsed.alternateAmount && parsed.alternateAmount > 0) {
      return `Semanal (cada ${dayName}) • Alterna ${formatMXN(
        rule.default_amount,
        { showPrefix: false }
      )} y ${formatMXN(parsed.alternateAmount, {
        showPrefix: false,
      })}${exclusionsNote}`;
    }
    return `Semanal (cada ${dayName})${exclusionsNote}`;
  }

  if (parsed.mode === "semimonthly" || parsed.mode === "multi_day") {
    const dayLabels = parsed.items.map((it) =>
      it.day === "last" ? "fin de mes" : `día ${it.day}`
    );
    const hasCustomAmounts = parsed.items.some(
      (it) =>
        it.amount !== null &&
        it.amount !== undefined &&
        it.amount > 0 &&
        it.amount !== rule.default_amount
    );
    const prefix =
      parsed.items.length === 2
        ? "Quincenal"
        : `Calendario (${parsed.items.length} fechas/mes)`;
    if (hasCustomAmounts) {
      const amountPairs = parsed.items
        .map((it) => {
          const dLabel = it.day === "last" ? "fin" : `${it.day}`;
          const amt = it.amount ?? rule.default_amount ?? 0;
          return `día ${dLabel}: ${formatMXN(amt, { showPrefix: false })}`;
        })
        .join(" / ");
      return `${prefix} (${amountPairs})${exclusionsNote}`;
    }
    return `${prefix} (${dayLabels.join(", ")})${exclusionsNote}`;
  }

  const freqMap: Record<string, string> = {
    monthly: "Mensual",
    bimonthly: "Bimestral (cada 2 meses)",
    quarterly: "Trimestral (cada 3 meses)",
    semiannual: "Semestral (cada 6 meses)",
    annual: "Anual",
  };
  const fLabel = freqMap[rule.frequency] || "Mensual";
  const singleItem = parsed.items[0];
  const dayText =
    singleItem?.day === "last" || rule.day_of_month === 31
      ? "último día del mes"
      : `día ${singleItem?.day || rule.day_of_month || 1}`;
  return `${fLabel} (${dayText})${exclusionsNote}`;
}

/**
 * Genera todas las ocurrencias que le corresponden a una regla recurrente dentro de un mes (`YYYY-MM`),
 * soportando catorcenas con monto alternado (ej. catorcena grande y pequeña), quincenas personalizadas,
 * selección múltiple de días del calendario, pagos semanales y bimestrales/trimestrales/anuales.
 */
export function generateOccurrencesForRuleInMonth(params: {
  rule: RecurrenceRule;
  yearMonth: string;
  referenceDate: string;
  openingBalanceDate?: string;
}): Array<
  Omit<
    Transaction,
    "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
  >
> {
  const { rule, yearMonth, referenceDate, openingBalanceDate } = params;
  if (rule.status !== "active") return [];

  const { startDate, endDate, year, month, daysInMonth } =
    getMonthStartEnd(yearMonth);
  const ruleStart = (rule.start_date || startDate).slice(0, 10);
  if (rule.end_date && startDate > rule.end_date.slice(0, 10)) {
    return [];
  }

  const cutoffDate = openingBalanceDate ? openingBalanceDate.slice(0, 10) : null;
  const parsed = parseRecurrenceSchedule(rule);
  const results: Array<
    Omit<
      Transaction,
      "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
    >
  > = [];

  const buildTx = (
    occurrenceDate: string,
    expectedDate: string,
    amount: number | null,
    titleSuffix?: string
  ): Omit<
    Transaction,
    "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
  > => {
    const isPriorToOpeningCutoff = Boolean(
      cutoffDate && expectedDate < cutoffDate
    );

    return {
      type: rule.type,
      title: titleSuffix ? `${rule.title} ${titleSuffix}` : rule.title,
      category_id: rule.category_id,
      priority: rule.priority,
      status: isPriorToOpeningCutoff
        ? rule.type === "income"
          ? "received"
          : "paid"
        : rule.type === "income"
        ? "scheduled"
        : expectedDate < referenceDate
        ? "overdue"
        : "pending",
      amount_type: rule.amount_type,
      estimated_amount: amount,
      actual_amount: isPriorToOpeningCutoff ? amount : null,
      expected_date: expectedDate,
      settled_date: isPriorToOpeningCutoff ? expectedDate : null,
      settled_at: isPriorToOpeningCutoff
        ? `${expectedDate}T12:00:00.000Z`
        : null,
      recurrence_rule_id: rule.id,
      occurrence_date: occurrenceDate,
      is_exception: false,
      notes: rule.notes,
    };
  };

  if (rule.frequency === "biweekly" || rule.frequency === "weekly") {
    const stepDays = rule.frequency === "biweekly" ? 14 : 7;
    const anchorTime = new Date(`${ruleStart}T00:00:00Z`).getTime();
    const mm = String(month).padStart(2, "0");

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, "0");
      const dateStr = `${year}-${mm}-${dd}`;
      if (dateStr < ruleStart) continue;
      if (rule.end_date && dateStr > rule.end_date.slice(0, 10)) continue;

      const curTime = new Date(`${dateStr}T00:00:00Z`).getTime();
      const diffDays = Math.round((curTime - anchorTime) / 86400000);
      if (diffDays < 0) continue;

      if (
        rule.frequency === "weekly" &&
        rule.day_of_week !== null &&
        rule.day_of_week !== undefined
      ) {
        const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
        if (dow !== rule.day_of_week) continue;
        const weekIndex = Math.max(0, Math.floor(diffDays / 7));
        const hasAlt =
          parsed.alternateAmount !== null && parsed.alternateAmount > 0;
        const amt =
          hasAlt && weekIndex % 2 === 1
            ? parsed.alternateAmount
            : rule.default_amount;
        const expDate = adjustDateForExclusions(dateStr, parsed);
        results.push(buildTx(dateStr, expDate, amt));
      } else if (diffDays % stepDays === 0) {
        const cycleIdx = Math.round(diffDays / stepDays);
        const hasAlt =
          parsed.alternateAmount !== null && parsed.alternateAmount > 0;
        const isSecond = cycleIdx % 2 === 1;
        const amt =
          hasAlt && isSecond ? parsed.alternateAmount : rule.default_amount;
        const expDate = adjustDateForExclusions(dateStr, parsed);
        const suffix =
          rule.frequency === "biweekly" && hasAlt
            ? isSecond
              ? "(2ª catorcena)"
              : "(1ª catorcena)"
            : undefined;
        results.push(buildTx(dateStr, expDate, amt, suffix));
      }
    }
    return results;
  }

  // Verificar intervalo de meses para mensual, bimestral, trimestral, semestral, anual
  const [startYear, startMonth] = ruleStart.slice(0, 7).split("-").map(Number);
  const monthsDiff = (year - startYear) * 12 + (month - startMonth);
  const monthStep =
    rule.frequency === "bimonthly"
      ? 2
      : rule.frequency === "quarterly"
      ? 3
      : rule.frequency === "semiannual"
      ? 6
      : rule.frequency === "annual"
      ? 12
      : 1;

  if (monthsDiff < 0 || (monthStep > 1 && monthsDiff % monthStep !== 0)) {
    return [];
  }

  const mm = String(month).padStart(2, "0");
  const seenDays = new Set<number>();

  parsed.items.forEach((item, idx) => {
    const rawDay =
      item.day === "last"
        ? daysInMonth
        : Math.min(Math.max(1, Number(item.day) || 1), daysInMonth);
    if (seenDays.has(rawDay)) return;
    seenDays.add(rawDay);

    const dd = String(rawDay).padStart(2, "0");
    const occurrenceDate = `${year}-${mm}-${dd}`;
    if (parsed.items.length === 1 && occurrenceDate < ruleStart) return;
    if (rule.end_date && occurrenceDate > rule.end_date.slice(0, 10)) return;

    const expectedDate = adjustDateForExclusions(occurrenceDate, parsed);
    const amount =
      item.amount !== undefined && item.amount !== null && item.amount > 0
        ? item.amount
        : rule.default_amount;

    let suffix: string | undefined;
    if (parsed.items.length === 2 && rule.frequency === "semimonthly") {
      suffix = idx === 1 ? "(2ª quincena)" : undefined;
    } else if (parsed.items.length > 1) {
      suffix = `(Día ${rawDay})`;
    }

    results.push(buildTx(occurrenceDate, expectedDate, amount, suffix));
  });

  return results;
}

/**
 * Genera el diagnóstico detallado de la proyección del mes y consejos financieros personalizados
 * adaptados a la situación real del usuario (superávit, colchón ajustado, bache intermedio de liquidez,
 * déficit de cierre, gastos vencidos, ingresos atrasados o proporción de gastos flexibles).
 */
export function explainFinancialProjection(params: {
  monthProjection: MonthProjectionSummary;
  budgetSummary: BudgetSummary;
  nextIncomeStretch: NextIncomeStretch;
  transactions: Transaction[];
  referenceDate: string;
}): FinancialProjectionExplanation {
  const {
    monthProjection,
    budgetSummary,
    nextIncomeStretch,
    transactions,
    referenceDate,
  } = params;

  const startingAmount = roundCurrency(
    monthProjection.startingBalance ?? monthProjection.currentBalance
  );
  const scheduledIncomesAmount = roundCurrency(monthProjection.scheduledIncome);
  const pendingExpensesAmount = roundCurrency(monthProjection.pendingExpense);
  const projectedClosingAmount = roundCurrency(
    monthProjection.projectedClosingBalance ?? startingAmount
  );

  const lowestDate = monthProjection.lowestBalancePoint?.date ?? null;
  const lowestBalance =
    monthProjection.lowestBalancePoint?.balance ?? startingAmount;
  const minCushionAmount = roundCurrency(monthProjection.minCushionAmount);

  const hasMidMonthDip =
    lowestBalance < projectedClosingAmount &&
    (lowestBalance < minCushionAmount || lowestBalance < 0);

  const flexibleStats = budgetSummary.priorityBreakdown.find(
    (p) => p.priority === "flexible"
  );
  const importantStats = budgetSummary.priorityBreakdown.find(
    (p) => p.priority === "important"
  );
  const essentialStats = budgetSummary.priorityBreakdown.find(
    (p) => p.priority === "essential"
  );

  const tips: FinancialInsightTip[] = [];

  // 1. Diagnóstico principal según semáforo y curva de liquidez
  let headline = "Tu proyección del mes es saludable";
  let summaryText =
    "Con tus ingresos y gastos programados actuales, cubres todos tus compromisos del mes y mantienes intacto tu colchón de seguridad.";

  if (monthProjection.balanceTrafficLight === "red") {
    if (projectedClosingAmount < 0) {
      const deficit = Math.abs(projectedClosingAmount);
      headline = `Atención: Cierre proyectado en déficit (-${formatMXN(
        deficit
      )})`;
      summaryText = `Tus gastos pendientes superan tu liquidez más tus próximos ingresos por ${formatMXN(
        deficit
      )}. Necesitas ajustar gastos opcionales o reprogramar compromisos antes de fin de mes.`;
    } else {
      headline = `Riesgo de sobregiro temporal el ${
        lowestDate ? formatShortDateEs(lowestDate) : "mes actual"
      }`;
      summaryText = `Aunque a fin de mes cierras en positivo (${formatMXN(
        projectedClosingAmount
      )}), el día ${
        lowestDate ? formatShortDateEs(lowestDate) : ""
      } tus pagos se acumulan antes de tu siguiente cobro y tu saldo cae a ${formatMXN(
        lowestBalance
      )}.`;
    }
  } else if (monthProjection.balanceTrafficLight === "amber") {
    if (monthProjection.hasUnquantifiedPendingExpenses) {
      headline = "Tu proyección está incompleta (faltan montos por definir)";
      summaryText = `Tienes ${monthProjection.unquantifiedPendingExpensesCount} compromiso(s) sin monto estimado. Asígnales un aproximado para conocer tu cierre real.`;
    } else {
      headline = "Colchón de seguridad ajustado en el mes";
      summaryText = `No caes en números rojos, pero tu punto más bajo (${formatMXN(
        lowestBalance
      )} el ${
        lowestDate ? formatShortDateEs(lowestDate) : "mes"
      }) queda por debajo de tu colchón mínimo recomendado de ${formatMXN(
        minCushionAmount
      )}.`;
    }
  }

  // 2. Consejos personalizados según las condiciones detectadas
  if (
    monthProjection.overdueExpenseCount > 0 ||
    monthProjection.delayedIncomeCount > 0
  ) {
    const firstOverdue = transactions.find((tx) =>
      isExpenseOverdue(tx, referenceDate)
    );
    const firstDelayed = transactions.find((tx) =>
      isIncomeDelayed(tx, referenceDate)
    );
    const targetTx = firstOverdue || firstDelayed;

    tips.push({
      id: "tip-overdue-delayed",
      severity: "urgent",
      title: "Actualiza tus movimientos con fecha pasada",
      description: `Tienes ${
        monthProjection.overdueExpenseCount > 0
          ? `${monthProjection.overdueExpenseCount} gasto(s) vencido(s) (${formatMXN(
              monthProjection.overdueExpenseAmount
            )})`
          : ""
      }${
        monthProjection.overdueExpenseCount > 0 &&
        monthProjection.delayedIncomeCount > 0
          ? " y "
          : ""
      }${
        monthProjection.delayedIncomeCount > 0
          ? `${monthProjection.delayedIncomeCount} ingreso(s) atrasado(s) (${formatMXN(
              monthProjection.delayedIncome
            )})`
          : ""
      }. Si ya los pagaste o cobraste, confírmalos; si aún no ocurren, reprográmalos a su nueva fecha para que tu proyección sea exacta.`,
      actionLabel: targetTx ? `Revisar "${targetTx.title}"` : "Ir a Movimientos",
      actionScreen: targetTx ? "P14" : "P18",
      actionTransactionId: targetTx?.id,
    });
  }

  if (lowestBalance < 0 && projectedClosingAmount >= 0 && lowestDate) {
    tips.push({
      id: "tip-midmonth-dip",
      severity: "urgent",
      title: `Evita el bache de liquidez del ${formatShortDateEs(lowestDate)}`,
      description: `Tu dinero sí alcanza en el mes completo, pero tienes demasiados pagos concentrados antes de tu siguiente ingreso. Si difieres o reprogramas al menos ${formatMXN(
        Math.abs(lowestBalance)
      )} en pagos para después de tu fecha de cobro, evitarás quedarte sin liquidez a mitad de periodo.`,
      impactText: `Meta: Mover ${formatMXN(
        Math.abs(lowestBalance)
      )} después de tu próximo cobro`,
      actionLabel: "Ver mis compromisos en Movimientos",
      actionScreen: "P18",
    });
  }

  if (projectedClosingAmount < 0) {
    const neededForZero = Math.abs(projectedClosingAmount);
    const flexPending = flexibleStats?.pending ?? 0;
    const impPending = importantStats?.pending ?? 0;
    tips.push({
      id: "tip-deficit-recovery",
      severity: "urgent",
      title: "Plan de rescate para cerrar el mes sin déficit",
      description:
        flexPending > 0
          ? `Para recuperar ${formatMXN(
              neededForZero
            )}, empieza por tus gastos Flexibles pendientes (${formatMXN(
              flexPending
            )}). Pausar o reducir esos gastos opcionales e Importantes (${formatMXN(
              impPending
            )}) te permitirá equilibrar el mes sin tocar pagos Esenciales.`
          : `Necesitas liberar ${formatMXN(
              neededForZero
            )} o generar un ingreso adicional este mes. Revisa tus gastos Importantes pendientes (${formatMXN(
              impPending
            )}) para ver cuáles puedes posponer al siguiente mes.`,
      impactText: `Ajuste requerido: ${formatMXN(neededForZero)}`,
      actionLabel: "Revisar desglose en Presupuesto",
      actionScreen: "P20",
    });
  }

  if (
    lowestBalance >= 0 &&
    minCushionAmount > 0 &&
    lowestBalance < minCushionAmount
  ) {
    const gapToCushion = roundCurrency(minCushionAmount - lowestBalance);
    tips.push({
      id: "tip-cushion-shield",
      severity: "warning",
      title: "Protege tu colchón contra imprevistos",
      description: `Te faltan ${formatMXN(
        gapToCushion
      )} para que ningún día del mes bajes de tu colchón de seguridad (${formatMXN(
        minCushionAmount
      )}). Evita compras hormiga de aquí a tu próximo cobro${
        flexibleStats && flexibleStats.pending > 0
          ? ` o recorta parte de tus ${formatMXN(
              flexibleStats.pending
            )} en gastos flexibles pendientes.`
          : "."
      }`,
      impactText: `Faltan ${formatMXN(gapToCushion)} para blindar tu colchón`,
      actionLabel: "Ajustar presupuesto",
      actionScreen: "P20",
    });
  }

  if (monthProjection.hasUnquantifiedPendingExpenses) {
    const unqTx = transactions.find((tx) => isUnquantifiedExpense(tx));
    tips.push({
      id: "tip-unquantified",
      severity: "warning",
      title: "Completa los gastos con monto por definir",
      description:
        "Cuando un recibo (como luz o tarjeta) aún no llega, ponerle un monto estimado (~$) basado en el mes pasado evita sorpresas en tu saldo proyectado.",
      actionLabel: unqTx ? `Estimar "${unqTx.title}"` : "Ver pendientes",
      actionScreen: unqTx ? "P14" : "P18",
      actionTransactionId: unqTx?.id,
    });
  }

  if (
    budgetSummary.totalLimit > 0 &&
    budgetSummary.committedPercent >= budgetSummary.alertThresholdPercent
  ) {
    const overAmount = roundCurrency(
      budgetSummary.committedExpense - budgetSummary.totalLimit
    );
    tips.push({
      id: "tip-budget-threshold",
      severity: budgetSummary.committedPercent > 100 ? "urgent" : "warning",
      title:
        budgetSummary.committedPercent > 100
          ? `Superaste tu límite mensual por ${formatMXN(overAmount)}`
          : `Llegaste al ${budgetSummary.committedPercent}% de tu presupuesto mensual`,
      description: `Llevas ${formatMXN(
        budgetSummary.committedExpense
      )} comprometidos de tu techo de ${formatMXN(
        budgetSummary.totalLimit
      )}. Esenciales: ${
        essentialStats?.percentOfBudget ?? 0
      }% • Importantes: ${
        importantStats?.percentOfBudget ?? 0
      }% • Flexibles: ${flexibleStats?.percentOfBudget ?? 0}%.`,
      actionLabel: "Ver o ajustar límite mensual",
      actionScreen: "P21",
    });
  }

  // Consejo positivo / hábito de ahorro o distribución inteligente de quincenas/catorcenas
  if (projectedClosingAmount > minCushionAmount && lowestBalance >= minCushionAmount) {
    const safeSurplus = roundCurrency(projectedClosingAmount - minCushionAmount);
    tips.push({
      id: "tip-surplus-saving",
      severity: "positive",
      title: `Tienes un excedente libre seguro de ${formatMXN(safeSurplus)}`,
      description: `Después de cubrir todos tus gastos pendientes del mes y respetar tu colchón de seguridad (${formatMXN(
        minCushionAmount
      )}), te quedan ${formatMXN(
        safeSurplus
      )} libres. Un excelente hábito es apartar entre el 30% y 50% de ese excedente (${formatMXN(
        roundCurrency(safeSurplus * 0.4)
      )}) en cuanto recibas tu cobro.`,
      impactText: `Potencial de ahorro este mes: ${formatMXN(
        roundCurrency(safeSurplus * 0.4)
      )}`,
    });
  }

  // Consejo sobre balanceo de cobros (especialmente útil para catorcenas/quincenas desiguales)
  tips.push({
    id: "tip-income-balancing",
    severity: "info",
    title: "Consejo clave si recibes quincenas o catorcenas desiguales",
    description:
      "Si recibes un cobro fuerte (ej. catorcena grande) y otro menor (catorcena pequeña), procura asignar tus pagos pesados (renta, tarjeta o créditos) justo después del cobro grande, o reserva desde el cobro grande la diferencia para que ambas mitades del mes tengan la misma holgura.",
    actionLabel: "Configurar reglas recurrentes",
    actionScreen: "P22",
  });

  return {
    statusColor: monthProjection.balanceTrafficLight,
    headline,
    summaryText,
    formula: {
      startingLabel:
        monthProjection.periodRelationship === "future"
          ? "Saldo inicial proyectado del mes"
          : "Saldo líquido disponible hoy",
      startingAmount,
      scheduledIncomesAmount,
      pendingExpensesAmount,
      projectedClosingAmount,
    },
    liquidityRadar: {
      lowestDate,
      lowestBalance,
      minCushionAmount,
      hasMidMonthDip,
      daysUntilNextIncome: nextIncomeStretch.daysUntilNextIncome,
      nextIncomeTitle: nextIncomeStretch.nextIncomeTransaction?.title ?? null,
      nextIncomeAmount: nextIncomeStretch.nextIncomeTransaction
        ? getEffectiveAmount(nextIncomeStretch.nextIncomeTransaction)
        : null,
      balanceBeforeNextIncome: nextIncomeStretch.nextIncomeTransaction
        ? nextIncomeStretch.balanceJustBeforeNextIncome
        : null,
    },
    tips,
  };
}

