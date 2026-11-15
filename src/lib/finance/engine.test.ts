import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyRecurrenceEditScope,
  calculateBudgetSummary,
  calculateCurrentBalance,
  calculateMonthProjection,
  calculateNextIncomeStretch,
  filterTransactions,
  isDateBeforeOpeningBalance,
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
});
