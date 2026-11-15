import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  affectsCurrentBalance,
  adjustDateForExclusions,
  appearsOnCalendarDate,
  applyRecurrenceEditScope,
  calculateBudgetSummary,
  calculateCurrentBalance,
  calculateMonthProjection,
  calculateNextIncomeStretch,
  describeRecurrenceRuleSchedule,
  explainFinancialProjection,
  filterTransactions,
  generateOccurrencesForRuleInMonth,
  isDateBeforeOpeningBalance,
  isPriorToTodayOrCutoff,
  parseRecurrenceSchedule,
  serializeRecurrenceSchedule,
} from "./engine.ts";
import {
  P32_UNQUANTIFIED_TRANSACTIONS,
  SOFIA_ACCOUNT,
  SOFIA_BUDGET,
  SOFIA_RECURRENCE_RULES,
  SOFIA_REFERENCE_DATE,
  SOFIA_TRANSACTIONS,
} from "./seed-data.ts";

describe("Motor de Cálculo Financiero (PRD v1.1.2 - Dataset Maestro Sofía)", () => {
  it("1. Respeta la regla de corte del saldo inicial ($6,480.50 el 18/11/2026)", () => {
    const currentBalance = calculateCurrentBalance(
      SOFIA_ACCOUNT,
      SOFIA_TRANSACTIONS
    );
    assert.equal(currentBalance, 6480.5);
  });

  it("2. Calcula exactamente los totales, saldo proyectado ($12,200.50) y punto más bajo ($3,200.50 el 28/11) de Noviembre 2026", () => {
    const summary = calculateMonthProjection({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });

    assert.equal(summary.currentBalance, 6480.5);
    assert.equal(summary.receivedIncome, 9000.0);
    assert.equal(summary.scheduledIncome, 9000.0); // Excluye $3,000.00 atrasado del 16/11
    assert.equal(summary.delayedIncome, 3000.0);
    assert.equal(summary.delayedIncomeCount, 1);
    assert.equal(summary.paidExpense, 9320.0); // 6500 + 1600 + 320 + 900
    assert.equal(summary.pendingExpense, 3280.0); // 650 + 499 + 219 + 1100 + 812
    assert.equal(summary.overdueExpenseCount, 1);
    assert.equal(summary.overdueExpenseAmount, 650.0);
    assert.equal(summary.committedExpense, 12600.0);
    assert.equal(summary.projectedClosingBalance, 12200.5);
    assert.equal(summary.lowestBalancePoint?.date, "2026-11-28");
    assert.equal(summary.lowestBalancePoint?.balance, 3200.5);
    assert.equal(summary.balanceTrafficLight, "green");
  });

  it("3. Calcula el presupuesto mensual ($20,000.00), comprometido ($12,600.00 / 63%), disponible ($7,400.00) y prioridades", () => {
    const budgetSummary = calculateBudgetSummary({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });

    assert.equal(budgetSummary.totalLimit, 20000.0);
    assert.equal(budgetSummary.paidExpense, 9320.0);
    assert.equal(budgetSummary.pendingExpense, 3280.0);
    assert.equal(budgetSummary.committedExpense, 12600.0);
    assert.equal(budgetSummary.availableBudget, 7400.0);
    assert.equal(budgetSummary.committedPercent, 63.0);
    assert.equal(budgetSummary.trafficLight, "green");

    const essential = budgetSummary.priorityBreakdown.find(
      (p) => p.priority === "essential"
    )!;
    const important = budgetSummary.priorityBreakdown.find(
      (p) => p.priority === "important"
    )!;
    const flexible = budgetSummary.priorityBreakdown.find(
      (p) => p.priority === "flexible"
    )!;

    assert.equal(essential.paid, 8100.0); // 6500 + 1600
    assert.equal(essential.pending, 1149.0); // 650 + 499
    assert.equal(essential.total, 9249.0);

    assert.equal(important.paid, 900.0); // Gasolina 900
    assert.equal(important.pending, 1100.0); // Seguro 1100
    assert.equal(important.total, 2000.0);

    assert.equal(flexible.paid, 320.0); // Cine 320
    assert.equal(flexible.pending, 1031.0); // 219 + 812
    assert.equal(flexible.total, 1351.0);
  });

  it("4. Calcula el tramo 'Hasta tu próximo ingreso' (30 Nov, 12 días, $3,280.00 pendientes, $3,200.50 antes del cobro)", () => {
    const stretch = calculateNextIncomeStretch({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });

    assert.equal(stretch.nextIncomeTransaction?.expected_date, "2026-11-30");
    assert.equal(stretch.daysUntilNextIncome, 12);
    assert.equal(stretch.pendingExpensesBeforeNextIncome, 3280.0);
    assert.equal(stretch.balanceJustBeforeNextIncome, 3200.5);
    assert.equal(stretch.lowestPointOfMonth.balance, 3200.5);
  });

  it("5. Cambia el semáforo de proyección a Ámbar cuando existen gastos pendientes sin monto estimado (P32)", () => {
    const p32Summary = calculateMonthProjection({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: [...SOFIA_TRANSACTIONS, ...P32_UNQUANTIFIED_TRANSACTIONS],
      budget: SOFIA_BUDGET,
    });

    assert.equal(p32Summary.hasUnquantifiedPendingExpenses, true);
    assert.equal(p32Summary.unquantifiedPendingExpensesCount, 2);
    assert.equal(p32Summary.balanceTrafficLight, "amber");
  });

  it("6. Mantiene continuidad mes a mes hacia Diciembre 2026 y bloquea saldos pasados anteriores a opening_balance_date", () => {
    const decSummary = calculateMonthProjection({
      yearMonth: "2026-12",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });

    assert.equal(decSummary.startingBalance, 12200.5);
    assert.equal(decSummary.scheduledIncome, 18000.0);
    assert.equal(decSummary.pendingExpense, 8318.0); // 6500 + 499 + 219 + 1100
    assert.equal(decSummary.projectedClosingBalance, 21882.5);

    const octSummary = calculateMonthProjection({
      yearMonth: "2026-10",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });

    assert.equal(octSummary.projectedClosingBalance, null);
    assert.equal(
      octSummary.historicalBalanceUnavailableMessage,
      "Saldo no disponible antes del 18/11/2026"
    );
    assert.equal(isDateBeforeOpeningBalance("2026-11-10", SOFIA_ACCOUNT), true);
  });

  it("7. Respeta los 3 alcances de edición recurrente (P17) sin alterar ocurrencias ya pagadas", () => {
    const resFuture = applyRecurrenceEditScope({
      transactions: SOFIA_TRANSACTIONS,
      rules: SOFIA_RECURRENCE_RULES,
      targetTransactionId: "tx-exp-07", // Netflix 22/11
      scope: "future",
      updates: { estimated_amount: 249.0 },
    });

    const novNetflix = resFuture.transactions.find(
      (t) => t.id === "tx-exp-07"
    )!;
    const decNetflix = resFuture.transactions.find(
      (t) => t.id === "tx-dec-04"
    )!;
    const paidRenta = resFuture.transactions.find((t) => t.id === "tx-exp-01")!;

    assert.equal(novNetflix.estimated_amount, 249.0);
    assert.equal(decNetflix.estimated_amount, 249.0);
    assert.equal(paidRenta.actual_amount, 6500.0);
  });

  it("8. Excluye movimientos con estado 'cancelled' de filterTransactions por defecto", () => {
    const cancelledTx = {
      ...SOFIA_TRANSACTIONS[0],
      id: "tx-cancelled-test",
      status: "cancelled" as const,
      title: "Pago cancelado",
    };
    const filtered = filterTransactions(
      [...SOFIA_TRANSACTIONS, cancelledTx],
      {
        searchQuery: "",
        type: "all",
        statuses: [],
        priorities: [],
        categoryIds: [],
        recurrenceFilter: "all",
      },
      SOFIA_REFERENCE_DATE
    );
    assert.equal(
      filtered.some((t) => t.id === "tx-cancelled-test"),
      false
    );
  });

  it("9. Mantiene visibles en el calendario los movimientos confirmados en su fecha real y fecha original", () => {
    const settledEarly = {
      ...SOFIA_TRANSACTIONS[0],
      id: "tx-settled-early",
      type: "expense" as const,
      status: "paid" as const,
      expected_date: "2026-11-20",
      settled_date: "2026-11-14",
    };

    assert.equal(appearsOnCalendarDate(settledEarly, "2026-11-14"), true);
    assert.equal(appearsOnCalendarDate(settledEarly, "2026-11-20"), true);
    assert.equal(appearsOnCalendarDate(settledEarly, "2026-11-15"), false);

    const pendingTx = {
      ...settledEarly,
      status: "pending" as const,
      settled_date: null,
    };
    assert.equal(appearsOnCalendarDate(pendingTx, "2026-11-20"), true);
    assert.equal(appearsOnCalendarDate(pendingTx, "2026-11-14"), false);

    const cancelledTx = {
      ...settledEarly,
      status: "cancelled" as const,
    };
    assert.equal(appearsOnCalendarDate(cancelledTx, "2026-11-14"), false);
    assert.equal(appearsOnCalendarDate(cancelledTx, "2026-11-20"), false);
  });

  it("10. Genera catorcenas alternadas (catorcena grande $9,500 y pequeña $8,500) cada 14 días", () => {
    const semimonthlySpec = serializeRecurrenceSchedule({
      alternateAmount: 8500,
      weekendShift: "none",
    });
    const biweeklyRule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-catorcena-alt",
      type: "income" as const,
      title: "Nómina Catorcenal",
      default_amount: 9500,
      frequency: "biweekly" as const,
      start_date: "2026-11-06",
      semimonthly_days: semimonthlySpec,
      status: "active" as const,
    };

    const novOccurrences = generateOccurrencesForRuleInMonth({
      rule: biweeklyRule,
      yearMonth: "2026-11",
      referenceDate: "2026-11-01",
    });

    assert.equal(novOccurrences.length, 2);
    assert.equal(novOccurrences[0].expected_date, "2026-11-06");
    assert.equal(novOccurrences[0].estimated_amount, 9500);
    assert.equal(novOccurrences[1].expected_date, "2026-11-20");
    assert.equal(novOccurrences[1].estimated_amount, 8500);
  });

  it("11. Genera múltiples días seleccionados en el calendario con montos personalizados y ajuste de fin de semana a viernes", () => {
    const multiSpec = serializeRecurrenceSchedule({
      items: [
        { day: 5, amount: 4000 },
        { day: 15, amount: 9500 },
        { day: "last", amount: 8500 },
      ],
      weekendShift: "friday",
    });

    const multiRule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-multi-cal",
      type: "income" as const,
      title: "Cobros Calendario",
      default_amount: 9500,
      frequency: "monthly" as const,
      start_date: "2026-11-01",
      semimonthly_days: multiSpec,
      status: "active" as const,
    };

    // En Noviembre 2026: día 15 es domingo -> se recorre al viernes 13/11/2026
    const novOccurrences = generateOccurrencesForRuleInMonth({
      rule: multiRule,
      yearMonth: "2026-11",
      referenceDate: "2026-11-01",
    });

    assert.equal(novOccurrences.length, 3);
    assert.equal(novOccurrences[0].expected_date, "2026-11-05");
    assert.equal(novOccurrences[0].estimated_amount, 4000);
    assert.equal(novOccurrences[1].occurrence_date, "2026-11-15");
    assert.equal(novOccurrences[1].expected_date, "2026-11-13");
    assert.equal(novOccurrences[1].estimated_amount, 9500);
    assert.equal(novOccurrences[2].expected_date, "2026-11-30");
    assert.equal(novOccurrences[2].estimated_amount, 8500);
  });

  it("12. Genera explicación detallada de proyección y consejos personalizados según el estado financiero", () => {
    const projection = calculateMonthProjection({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });
    const budgetSummary = calculateBudgetSummary({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });
    const nextStretch = calculateNextIncomeStretch({
      yearMonth: "2026-11",
      referenceDate: SOFIA_REFERENCE_DATE,
      account: SOFIA_ACCOUNT,
      transactions: SOFIA_TRANSACTIONS,
      budget: SOFIA_BUDGET,
    });

    const explanation = explainFinancialProjection({
      monthProjection: projection,
      budgetSummary,
      nextIncomeStretch: nextStretch,
      transactions: SOFIA_TRANSACTIONS,
      referenceDate: SOFIA_REFERENCE_DATE,
    });

    assert.equal(explanation.statusColor, "green");
    assert.equal(explanation.formula.startingAmount, 6480.5);
    assert.equal(explanation.formula.scheduledIncomesAmount, 9000);
    assert.equal(explanation.formula.pendingExpensesAmount, 3280);
    assert.equal(explanation.formula.projectedClosingAmount, 12200.5);
    assert.equal(explanation.tips.length >= 2, true);
  });

  it("13. No descuenta del saldo actual ($5,000 el 15/11/2026) los gastos recurrentes de días previos al corte (ej. Internet el día 1)", () => {
    const accountNov15 = {
      ...SOFIA_ACCOUNT,
      opening_balance: 5000,
      opening_balance_date: "2026-11-15",
      opening_balance_at: "2026-11-15T12:00:00.000Z",
    };

    const internetRule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-internet-dia-1",
      type: "expense" as const,
      title: "Internet",
      default_amount: 600,
      frequency: "monthly" as const,
      day_of_month: 1,
      semimonthly_days: null,
      start_date: "2026-11-01",
      status: "active" as const,
    };

    const occurrences = generateOccurrencesForRuleInMonth({
      rule: internetRule,
      yearMonth: "2026-11",
      referenceDate: "2026-11-15",
      openingBalanceDate: accountNov15.opening_balance_date,
    });

    assert.equal(occurrences.length, 1);
    assert.equal(occurrences[0].expected_date, "2026-11-01");
    assert.equal(occurrences[0].status, "paid");
    assert.equal(occurrences[0].settled_date, "2026-11-01");
    assert.equal(occurrences[0].actual_amount, 600);

    const hydratedOccurrences = occurrences.map((occ, idx) => ({
      ...occ,
      id: `tx-test-${idx}`,
      workspace_id: accountNov15.workspace_id,
      account_id: accountNov15.id,
      created_at: "2026-11-15T12:00:00.000Z",
      updated_at: "2026-11-15T12:00:00.000Z",
    }));

    const currentBalance = calculateCurrentBalance(
      accountNov15,
      hydratedOccurrences
    );
    assert.equal(currentBalance, 5000);
  });

  it("14. Elegir día 24 (catorcenal o semanal) NO genera cobros/pagos fantasma el día 10 ni antes de start_date", () => {
    const biweeklyDay24Rule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-biweekly-day24",
      type: "expense" as const,
      title: "Recordatorio Quincena/Catorcena 24",
      default_amount: 1200,
      frequency: "biweekly" as const,
      day_of_month: 24,
      semimonthly_days: null,
      day_of_week: null,
      start_date: "2026-11-24",
      status: "active" as const,
    };

    const novOccs = generateOccurrencesForRuleInMonth({
      rule: biweeklyDay24Rule,
      yearMonth: "2026-11",
      referenceDate: "2026-11-18",
      openingBalanceDate: "2026-11-01",
    });

    assert.deepEqual(
      novOccs.map((o) => o.expected_date),
      ["2026-11-24"]
    );
    assert.equal(novOccs.some((o) => o.expected_date === "2026-11-10"), false);

    const decOccs = generateOccurrencesForRuleInMonth({
      rule: biweeklyDay24Rule,
      yearMonth: "2026-12",
      referenceDate: "2026-11-18",
      openingBalanceDate: "2026-11-01",
    });

    assert.deepEqual(
      decOccs.map((o) => o.expected_date),
      ["2026-12-08", "2026-12-22"]
    );

    const weeklyRuleStartNov24 = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-weekly-day24",
      type: "expense" as const,
      title: "Pago semanal martes",
      default_amount: 450,
      frequency: "weekly" as const,
      day_of_month: 24,
      semimonthly_days: null,
      day_of_week: 2, // Martes (2026-11-24 es martes)
      start_date: "2026-11-24",
      status: "active" as const,
    };

    const weeklyNovOccs = generateOccurrencesForRuleInMonth({
      rule: weeklyRuleStartNov24,
      yearMonth: "2026-11",
      referenceDate: "2026-11-18",
      openingBalanceDate: "2026-11-01",
    });

    assert.deepEqual(
      weeklyNovOccs.map((o) => o.expected_date),
      ["2026-11-24"]
    );
    assert.equal(
      describeRecurrenceRuleSchedule(weeklyRuleStartNov24).includes("Semanal"),
      true
    );
  });

  it("15. Marcar como pagado un gasto anterior a 'hoy' (settled_at = null) NO descuenta el saldo líquido actual", () => {
    const accountTodayNov18 = {
      ...SOFIA_ACCOUNT,
      opening_balance: 5000,
      opening_balance_date: "2026-11-01",
      opening_balance_at: "2026-11-01T12:00:00.000Z",
    };

    assert.equal(
      isPriorToTodayOrCutoff("2026-11-17", accountTodayNov18, "2026-11-18"),
      true
    );
    assert.equal(
      isPriorToTodayOrCutoff("2026-11-18", accountTodayNov18, "2026-11-18"),
      false
    );

    const txPaidPriorToToday = {
      ...SOFIA_TRANSACTIONS[0],
      id: "tx-prior-no-deduct",
      type: "expense" as const,
      status: "paid" as const,
      estimated_amount: 900,
      actual_amount: 900,
      expected_date: "2026-11-17",
      settled_date: "2026-11-17",
      settled_at: null,
    };

    const txPaidToday = {
      ...SOFIA_TRANSACTIONS[0],
      id: "tx-today-deducts",
      type: "expense" as const,
      status: "paid" as const,
      estimated_amount: 300,
      actual_amount: 300,
      expected_date: "2026-11-18",
      settled_date: "2026-11-18",
      settled_at: "2026-11-18T14:00:00.000Z",
    };

    assert.equal(affectsCurrentBalance(txPaidPriorToToday, accountTodayNov18), false);
    assert.equal(affectsCurrentBalance(txPaidToday, accountTodayNov18), true);

    const balance = calculateCurrentBalance(accountTodayNov18, [
      txPaidPriorToToday,
      txPaidToday,
    ]);
    assert.equal(balance, 4700);
  });

  it("16. Soporta semanal, catorcenal, quincenal y mensual evitando días específicos (ej. sáb/dom o día 15) + calendario multi-fecha", () => {
    const serialized = serializeRecurrenceSchedule({
      items: [{ day: 15 }, { day: "last" }],
      excludedWeekdays: [0, 6],
      excludedMonthDays: [15],
      excludedShift: "prev",
    });

    const parsed = parseRecurrenceSchedule({
      semimonthly_days: serialized,
    });

    assert.deepEqual(parsed.excludedWeekdays, [0, 6]);
    assert.deepEqual(parsed.excludedMonthDays, [15]);
    assert.equal(parsed.excludedShift, "prev");

    // 2026-11-15 es domingo Y está en excludedMonthDays[15] -> se recorre al viernes 2026-11-13
    assert.equal(adjustDateForExclusions("2026-11-15", parsed), "2026-11-13");

    // Regla semanal los sábados (6) evitando fines de semana -> recorre al día siguiente permitido (lunes)
    const weeklyNoWeekendRule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-weekly-avoid-wknd",
      type: "expense" as const,
      title: "Pago semanal hábil",
      default_amount: 500,
      frequency: "weekly" as const,
      day_of_week: 6,
      start_date: "2026-11-01",
      semimonthly_days: serializeRecurrenceSchedule({
        excludedWeekdays: [0, 6],
        excludedShift: "next",
      }),
      status: "active" as const,
    };

    const weeklyAdjusted = generateOccurrencesForRuleInMonth({
      rule: weeklyNoWeekendRule,
      yearMonth: "2026-11",
      referenceDate: "2026-11-18",
      openingBalanceDate: "2026-11-01",
    });

    assert.deepEqual(
      weeklyAdjusted.map((o) => o.expected_date),
      ["2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]
    );

    // Gasto recurrente multi-fecha interactivo (días 5 y 20 con montos propios)
    const multiDateExpenseRule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-multi-exp",
      type: "expense" as const,
      title: "Pago quincenal colegio/tarjeta",
      default_amount: 1000,
      frequency: "monthly" as const,
      day_of_month: 5,
      semimonthly_days: serializeRecurrenceSchedule({
        items: [
          { day: 5, amount: 1200 },
          { day: 20, amount: 800 },
        ],
        excludedWeekdays: [0, 6],
        excludedShift: "prev",
      }),
      start_date: "2026-11-01",
      status: "active" as const,
    };

    const multiNov = generateOccurrencesForRuleInMonth({
      rule: multiDateExpenseRule,
      yearMonth: "2026-11",
      referenceDate: "2026-11-18",
      openingBalanceDate: "2026-11-01",
    });

    assert.deepEqual(
      multiNov.map((o) => ({
        date: o.expected_date,
        amt: o.estimated_amount,
      })),
      [
        { date: "2026-11-05", amt: 1200 },
        { date: "2026-11-20", amt: 800 },
      ]
    );
  });

  it("17. applyRecurrenceEditScope edita más campos (categoría, prioridad, tipo de monto, notas) sin corromper histórico liquidado", () => {
    const rule = {
      ...SOFIA_RECURRENCE_RULES[0],
      id: "rule-edit-rich",
      title: "Internet Fibra",
      default_amount: 600,
      category_id: "cat-servicios",
      priority: "essential" as const,
      amount_type: "fixed" as const,
      notes: "Inicial",
    };

    const txs = [
      {
        ...SOFIA_TRANSACTIONS[0],
        id: "tx-settled",
        recurrence_rule_id: "rule-edit-rich",
        occurrence_date: "2026-10-15",
        expected_date: "2026-10-15",
        settled_date: "2026-10-15",
        settled_at: "2026-10-15T12:00:00.000Z",
        status: "paid" as const,
        estimated_amount: 600,
        actual_amount: 600,
        title: "Internet Fibra",
      },
      {
        ...SOFIA_TRANSACTIONS[0],
        id: "tx-pending-nov",
        recurrence_rule_id: "rule-edit-rich",
        occurrence_date: "2026-11-20",
        expected_date: "2026-11-20",
        settled_date: null,
        settled_at: null,
        status: "pending" as const,
        estimated_amount: 600,
        actual_amount: null,
        title: "Internet Fibra",
      },
      {
        ...SOFIA_TRANSACTIONS[0],
        id: "tx-pending-dec",
        recurrence_rule_id: "rule-edit-rich",
        occurrence_date: "2026-12-20",
        expected_date: "2026-12-20",
        settled_date: null,
        settled_at: null,
        status: "pending" as const,
        estimated_amount: 600,
        actual_amount: null,
        title: "Internet Fibra",
      },
    ];

    const res = applyRecurrenceEditScope({
      transactions: txs,
      rules: [rule],
      targetTransactionId: "tx-pending-nov",
      scope: "future",
      updates: {
        title: "Internet Simétrico 300MB",
        estimated_amount: 750,
        priority: "important",
        category_id: "cat-hogaryrenta",
        amount_type: "variable",
        notes: "Cargo automático actualizado",
      },
    });

    const settled = res.transactions.find((t) => t.id === "tx-settled")!;
    const nov = res.transactions.find((t) => t.id === "tx-pending-nov")!;
    const dec = res.transactions.find((t) => t.id === "tx-pending-dec")!;

    assert.equal(settled.title, "Internet Fibra");
    assert.equal(settled.actual_amount, 600);

    assert.equal(nov.title, "Internet Simétrico 300MB");
    assert.equal(nov.estimated_amount, 750);
    assert.equal(nov.priority, "important");
    assert.equal(nov.category_id, "cat-hogaryrenta");
    assert.equal(nov.amount_type, "variable");
    assert.equal(nov.notes, "Cargo automático actualizado");
    assert.equal(nov.status, "pending");

    assert.equal(dec.title, "Internet Simétrico 300MB");
    assert.equal(dec.estimated_amount, 750);
    assert.equal(res.rules[0].notes, "Cargo automático actualizado");
    assert.equal(res.rules[0].priority, "important");
  });
});
