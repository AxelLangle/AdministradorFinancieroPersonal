import type {
  Account,
  Budget,
  BudgetSummary,
  DailyProjectionPoint,
  MonthProjectionSummary,
  NextIncomeStretch,
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
  const absVal = Math.abs(roundCurrency(amount));
  const formattedNumber = absVal.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
 * Regla de corte del saldo inicial (PRD 4.1, 4.6, 8.2):
 * Un movimiento confirmado (pagado o recibido) modifica el saldo actual si y solo si:
 * - settled_date > opening_balance_date, O
 * - settled_date == opening_balance_date Y settled_at > opening_balance_at.
 * Los movimientos con settled_date anterior a opening_balance_date ya están contenidos
 * dentro del saldo inicial de la cuenta y no lo vuelven a sumar ni restar.
 */
export function affectsCurrentBalance(
  tx: Transaction,
  account: Account
): boolean {
  if (tx.status !== "paid" && tx.status !== "received") {
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

  // Mismo día: comparar marca de tiempo técnica (settled_at vs opening_balance_at)
  if (!tx.settled_at || !account.opening_balance_at) {
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

/**
 * Calcula la proyección completa de un mes, curva diaria de saldo y semáforo (PRD 4.1, 4.3, 4.7, 8.3).
 */
export function calculateMonthProjection(params: {
  yearMonth: string;
  referenceDate: string; // YYYY-MM-DD (ej. '2026-11-18')
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
      (budget?.total_limit ? budget.total_limit * ((budget.min_cushion_percent || 10) / 100) : 2000)
  );

  let periodRelationship: "past" | "current" | "future" = "current";
  if (yearMonth < currentYearMonth) periodRelationship = "past";
  else if (yearMonth > currentYearMonth) periodRelationship = "future";

  // Transacciones cuyo mes efectivo cae en este yearMonth
  const monthTransactions = transactions.filter((tx) => {
    if (tx.account_id !== account.id) return false;
    if (tx.status === "cancelled") return false;
    const effDate = getEffectiveDate(tx);
    return effDate >= startDate && effDate <= endDate;
  });

  // 1. Ingresos recibidos en el mes
  const receivedIncome = roundCurrency(
    monthTransactions
      .filter((tx) => tx.type === "income" && tx.status === "received")
      .reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  // 2. Ingresos atrasados en el mes (programados con fecha < referenceDate): NO se suman al proyectado (PRD 4.1 y 4.2)
  const delayedIncomesList = monthTransactions.filter(
    (tx) => tx.type === "income" && isIncomeDelayed(tx, referenceDate)
  );
  const delayedIncome = roundCurrency(
    delayedIncomesList.reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  // 3. Ingresos programados vigentes en el mes (fecha >= referenceDate en mes actual, o todos los programados en mes futuro)
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

  // 4. Gastos pagados en el mes
  const paidExpense = roundCurrency(
    monthTransactions
      .filter((tx) => tx.type === "expense" && tx.status === "paid")
      .reduce((sum, tx) => sum + getEffectiveAmount(tx), 0)
  );

  // 5. Gastos pendientes y vencidos aplicables al mes
  // En el mes actual incluye gastos vencidos aún no resueltos (incluso de meses previos si existieran) + pendientes hasta fin de mes
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

  // Continuidad mes a mes (PRD 4.7)
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

  // Construcción de la curva diaria del mes (para encontrar el punto más bajo del mes y evaluar el semáforo)
  const dailyCurve: DailyProjectionPoint[] = [];
  let runningBalance = startingBalance;

  // En el mes actual, los gastos vencidos previos a referenceDate impactan desde referenceDate
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
        // En el día de hoy se consideran los gastos vencidos no resueltos + los pendientes de hoy + ingresos programados para hoy
        for (const overdueTx of overdueExpensesList) {
          dayExpenses = roundCurrency(
            dayExpenses + getEffectiveAmount(overdueTx)
          );
          if (isUnquantifiedExpense(overdueTx)) dayHasUnquantified = true;
        }
      }

      if (dateStr >= referenceDate) {
        for (const tx of dayTxs) {
          if (tx.type === "income" && tx.status === "scheduled" && !isIncomeDelayed(tx, referenceDate)) {
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

  // Semáforo del saldo proyectado (PRD 4.3)
  let balanceTrafficLight: TrafficLightColor = "green";
  if (projectedClosingBalance < 0 || lowestBalancePoint.balance < 0) {
    balanceTrafficLight = "red";
  } else if (
    lowestBalancePoint.balance < minCushionAmount ||
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

/**
 * Calcula el resumen del presupuesto mensual y su desglose por prioridad (PRD 4.1, 4.3, P20).
 */
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
  if (committedPercent > 100) {
    trafficLight = "red";
  } else if (committedPercent >= threshold) {
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

/**
 * Calcula la tarjeta "Hasta tu próximo ingreso" y el punto más bajo del mes (P20, PRD 8.3).
 */
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

/**
 * Filtra transacciones combinando búsqueda, tipo, estado, prioridad, categoría y recurrencia (P18, P19).
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
  referenceDate: string
): Transaction[] {
  return transactions.filter((tx) => {
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

/**
 * Aplica el alcance de edición de una ocurrencia recurrente (P17, PRD 4.4):
 * - "single": Solo este pago/ingreso (marca is_exception = true)
 * - "future": Este y los siguientes (actualiza pendientes con occurrence_date >= fecha objetivo; nunca toca pagados/recibidos)
 * - "all_pending": Todos los pendientes (actualiza todos los pendientes/programados/vencidos de la regla; nunca toca pagados/recibidos)
 */
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
      | "expected_date"
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

  const updatedTransactions = transactions.map((tx) => {
    // Nunca modificar ocurrencias ya pagadas o recibidas mediante alcances masivos
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
      // Si se cambia el día del mes en expected_date, ajustar el día manteniendo el mes de cada ocurrencia futura
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
        ...updates,
        expected_date: newExpectedDate,
        updated_at: nowIso,
      };
    }

    if (scope === "all_pending") {
      return {
        ...tx,
        ...updates,
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
