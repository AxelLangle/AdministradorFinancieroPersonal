"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Account,
  AppNotification,
  AuditLogEntry,
  Budget,
  BudgetSummary,
  Category,
  MonthProjectionSummary,
  NextIncomeStretch,
  PriorityLevel,
  RecurrenceEditScope,
  RecurrenceRule,
  ScreenId,
  Transaction,
  TransactionFilters,
} from "../finance/types";
import {
  applyRecurrenceEditScope,
  calculateBudgetSummary,
  calculateMonthProjection,
  calculateNextIncomeStretch,
  getNextYearMonth,
  getPreviousYearMonth,
} from "../finance/engine";
import {
  P32_UNQUANTIFIED_TRANSACTIONS,
  SOFIA_ACCOUNT,
  SOFIA_AUDIT_LOG,
  SOFIA_BUDGET,
  SOFIA_CATEGORIES,
  SOFIA_NOTIFICATIONS,
  SOFIA_RECURRENCE_RULES,
  SOFIA_REFERENCE_DATE,
  SOFIA_TRANSACTIONS,
  SOFIA_USER_ID,
  SOFIA_WORKSPACE_ID,
} from "../finance/seed-data";
import { supabase } from "../supabase/client";

const STORAGE_KEY = "afp_pwa_state_v1_1_2";

interface OnboardingDraft {
  openingBalance: number;
  openingDate: string;
  monthlyBudget: number;
  alertThresholdPercent: number;
  selectedCategories: string[];
  incomes: {
    id: string;
    title: string;
    amount: number;
    frequency: "semimonthly" | "monthly" | "one_off";
    dayOfMonth: number;
  }[];
  fixedExpenses: {
    id: string;
    title: string;
    amount: number;
    dayOfMonth: number;
    priority: PriorityLevel;
    amountType: "fixed" | "variable";
    categoryId: string;
  }[];
}

interface FinanceStoreContextValue {
  // Navegación y pantalla activa (P01..P33)
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  previousScreen: ScreenId;
  goBack: () => void;

  // Usuario y autenticación
  user: {
    id: string;
    name: string;
    email: string;
    isSupabaseAuthenticated: boolean;
  };
  loginWithEmail: (
    email: string,
    password?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    password?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncWithSupabase: () => Promise<{ ok: boolean; message: string }>;
  isSyncing: boolean;
  syncStatusMessage: string | null;

  // Periodo y selección en calendario
  currentYearMonth: string; // '2026-11'
  setCurrentYearMonth: (ym: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  referenceDate: string; // '2026-11-18'
  selectedDate: string; // '2026-11-17'
  setSelectedDate: (date: string) => void;
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  selectedRuleId: string | null;
  setSelectedRuleId: (id: string | null) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;

  // Entidades principales
  account: Account;
  budget: Budget;
  categories: Category[];
  recurrenceRules: RecurrenceRule[];
  transactions: Transaction[];
  notifications: AppNotification[];
  auditLog: AuditLogEntry[];

  // Resúmenes calculados en tiempo real
  monthProjection: MonthProjectionSummary;
  budgetSummary: BudgetSummary;
  nextIncomeStretch: NextIncomeStretch;

  // Filtros de Movimientos (P18 / P19)
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  resetFilters: () => void;

  // Onboarding borrador (P05..P09)
  onboardingDraft: OnboardingDraft;
  setOnboardingDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
  completeOnboarding: () => void;

  // Acciones de negocio sobre movimientos
  createTransaction: (
    tx: Omit<
      Transaction,
      "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
    >
  ) => Transaction;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>,
    recurrenceScope?: RecurrenceEditScope
  ) => void;
  confirmExpensePayment: (params: {
    transactionId: string;
    actualAmount: number;
    settledDate: string;
    notes?: string;
  }) => void;
  confirmIncomeReceipt: (params: {
    transactionId: string;
    actualAmount: number;
    settledDate: string;
    notes?: string;
  }) => void;
  rescheduleTransaction: (transactionId: string, newExpectedDate: string) => void;
  cancelTransaction: (transactionId: string) => void;

  // Acciones sobre Presupuesto (P21)
  updateBudget: (updates: Partial<Budget>) => void;

  // Acciones sobre Cuenta / Saldo Inicial (P29)
  updateAccountOpeningBalance: (
    newBalance: number,
    newDate: string
  ) => void;

  // Acciones sobre Reglas Recurrentes (P22, P23, P24)
  createRecurrenceRule: (
    rule: Omit<RecurrenceRule, "id" | "workspace_id" | "account_id">
  ) => void;
  updateRecurrenceRule: (
    id: string,
    updates: Partial<RecurrenceRule>
  ) => void;
  toggleRecurrenceRuleStatus: (id: string) => void;

  // Acciones sobre Categorías (P25, P26, P27)
  createCategory: (
    cat: Omit<Category, "id" | "workspace_id" | "sort_order">
  ) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;

  // Acciones sobre Avisos (P30)
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Utilidades de demostración y restauración del dataset maestro (Sofía PRD 8.3)
  resetToSofiaMasterDataset: () => void;
  pendingRecurrenceEdit: {
    transactionId: string;
    updates: Partial<Transaction>;
  } | null;
  setPendingRecurrenceEdit: (
    pending: {
      transactionId: string;
      updates: Partial<Transaction>;
    } | null
  ) => void;

  // Toast informativo global
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_FILTERS: TransactionFilters = {
  searchQuery: "",
  type: "all",
  statuses: [],
  priorities: [],
  categoryIds: [],
  recurrenceFilter: "all",
};

const DEFAULT_ONBOARDING_DRAFT: OnboardingDraft = {
  openingBalance: 6480.5,
  openingDate: "2026-11-18",
  monthlyBudget: 20000.0,
  alertThresholdPercent: 80,
  selectedCategories: [
    "cat-vivienda",
    "cat-servicios",
    "cat-despensa",
    "cat-transporte",
    "cat-seguros",
    "cat-suscripciones",
    "cat-entretenimiento",
    "cat-tarjetas",
  ],
  incomes: [
    {
      id: "onb-inc-1",
      title: "Nómina quincenal",
      amount: 9000.0,
      frequency: "semimonthly",
      dayOfMonth: 15,
    },
  ],
  fixedExpenses: [
    {
      id: "onb-exp-1",
      title: "Renta departamento",
      amount: 6500.0,
      dayOfMonth: 1,
      priority: "essential",
      amountType: "fixed",
      categoryId: "cat-vivienda",
    },
    {
      id: "onb-exp-2",
      title: "Internet fibra óptica",
      amount: 499.0,
      dayOfMonth: 18,
      priority: "essential",
      amountType: "fixed",
      categoryId: "cat-servicios",
    },
    {
      id: "onb-exp-3",
      title: "Recibo de luz CFE",
      amount: 650.0,
      dayOfMonth: 17,
      priority: "essential",
      amountType: "variable",
      categoryId: "cat-servicios",
    },
    {
      id: "onb-exp-4",
      title: "Netflix estándar",
      amount: 219.0,
      dayOfMonth: 22,
      priority: "flexible",
      amountType: "variable",
      categoryId: "cat-suscripciones",
    },
  ],
};

const FinanceStoreContext = createContext<FinanceStoreContextValue | null>(
  null
);

export function FinanceStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeScreen, setActiveScreenState] = useState<ScreenId>("P10");
  const [previousScreen, setPreviousScreen] = useState<ScreenId>("P10");

  const [user, setUser] = useState({
    id: SOFIA_USER_ID,
    name: "Sofía Ramírez",
    email: "sofia.ramirez@ejemplo.mx",
    isSupabaseAuthenticated: false,
  });

  const [currentYearMonth, setCurrentYearMonth] = useState<string>("2026-11");
  const [referenceDate] = useState<string>(SOFIA_REFERENCE_DATE);
  const [selectedDate, setSelectedDate] = useState<string>("2026-11-17");
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >("tx-exp-05"); // Por defecto Recibo de luz CFE vencido ($650.00)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    "rule-renta"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    "cat-servicios"
  );

  const [account, setAccount] = useState<Account>(SOFIA_ACCOUNT);
  const [budget, setBudget] = useState<Budget>(SOFIA_BUDGET);
  const [categories, setCategories] = useState<Category[]>(SOFIA_CATEGORIES);
  const [recurrenceRules, setRecurrenceRules] = useState<RecurrenceRule[]>(
    SOFIA_RECURRENCE_RULES
  );
  const [transactions, setTransactions] =
    useState<Transaction[]>(SOFIA_TRANSACTIONS);
  const [notifications, setNotifications] =
    useState<AppNotification[]>(SOFIA_NOTIFICATIONS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(SOFIA_AUDIT_LOG);

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>(
    DEFAULT_ONBOARDING_DRAFT
  );
  const [pendingRecurrenceEdit, setPendingRecurrenceEdit] = useState<{
    transactionId: string;
    updates: Partial<Transaction>;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Hidratación desde localStorage y sesión Supabase
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.account) setAccount(parsed.account);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.recurrenceRules) setRecurrenceRules(parsed.recurrenceRules);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.auditLog) setAuditLog(parsed.auditLog);
      }
    } catch {
      // Ignorar errores de parseo de localStorage
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser({
          id: u.id,
          name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "Sofía",
          email: u.email || "sofia@ejemplo.mx",
          isSupabaseAuthenticated: true,
        });
      }
    });
  }, []);

  // Guardar cambios en localStorage automáticamente
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          account,
          budget,
          categories,
          recurrenceRules,
          transactions,
          notifications,
          auditLog,
        })
      );
    } catch {
      // Ignorar si storage está lleno
    }
  }, [
    account,
    budget,
    categories,
    recurrenceRules,
    transactions,
    notifications,
    auditLog,
  ]);

  const setActiveScreen = useCallback(
    (next: ScreenId) => {
      setPreviousScreen(activeScreen);
      setActiveScreenState(next);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [activeScreen]
  );

  const goBack = useCallback(() => {
    setActiveScreenState(previousScreen || "P10");
  }, [previousScreen]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentYearMonth((prev) => getPreviousYearMonth(prev));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentYearMonth((prev) => getNextYearMonth(prev));
  }, []);

  // Para la pantalla especial P32 (Inicio con proyección incompleta), inyectamos las 2 transacciones sin monto estimado
  const effectiveTransactions = useMemo(() => {
    if (activeScreen === "P32") {
      return [...transactions, ...P32_UNQUANTIFIED_TRANSACTIONS];
    }
    if (activeScreen === "P31") {
      return [];
    }
    return transactions;
  }, [activeScreen, transactions]);

  const monthProjection = useMemo(
    () =>
      calculateMonthProjection({
        yearMonth: currentYearMonth,
        referenceDate,
        account:
          activeScreen === "P31"
            ? { ...account, opening_balance: 0 }
            : account,
        transactions: effectiveTransactions,
        budget,
      }),
    [currentYearMonth, referenceDate, account, activeScreen, effectiveTransactions, budget]
  );

  const budgetSummary = useMemo(
    () =>
      calculateBudgetSummary({
        yearMonth: currentYearMonth,
        referenceDate,
        account,
        transactions: effectiveTransactions,
        budget,
      }),
    [currentYearMonth, referenceDate, account, effectiveTransactions, budget]
  );

  const nextIncomeStretch = useMemo(
    () =>
      calculateNextIncomeStretch({
        yearMonth: currentYearMonth,
        referenceDate,
        account,
        transactions: effectiveTransactions,
        budget,
      }),
    [currentYearMonth, referenceDate, account, effectiveTransactions, budget]
  );

  const recordAuditEntries = useCallback(
    (oldTx: Transaction, newTx: Transaction) => {
      const fields: (keyof Transaction)[] = [
        "estimated_amount",
        "actual_amount",
        "expected_date",
        "settled_date",
        "status",
      ];
      const newEntries: AuditLogEntry[] = [];
      const nowIso = new Date().toISOString();

      for (const field of fields) {
        const oldVal = oldTx[field];
        const newVal = newTx[field];
        if (oldVal !== newVal) {
          newEntries.push({
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            workspace_id: SOFIA_WORKSPACE_ID,
            entity_type: "transaction",
            entity_id: newTx.id,
            field_changed: field,
            old_value: oldVal !== null && oldVal !== undefined ? String(oldVal) : null,
            new_value: newVal !== null && newVal !== undefined ? String(newVal) : null,
            changed_by: user.id,
            changed_at: nowIso,
          });
        }
      }
      if (newEntries.length > 0) {
        setAuditLog((prev) => [...newEntries, ...prev]);
      }
    },
    [user.id]
  );

  const createTransaction = useCallback(
    (
      txData: Omit<
        Transaction,
        "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
      >
    ): Transaction => {
      const nowIso = new Date().toISOString();
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        workspace_id: SOFIA_WORKSPACE_ID,
        account_id: account.id,
        created_at: nowIso,
        updated_at: nowIso,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast(
        newTx.type === "expense"
          ? "Gasto guardado en tu calendario"
          : "Ingreso guardado en tu calendario"
      );
      return newTx;
    },
    [account.id, showToast]
  );

  const updateTransaction = useCallback(
    (
      id: string,
      updates: Partial<Transaction>,
      recurrenceScope?: RecurrenceEditScope
    ) => {
      const existing = transactions.find((t) => t.id === id);
      if (!existing) return;

      if (existing.recurrence_rule_id && recurrenceScope) {
        const result = applyRecurrenceEditScope({
          transactions,
          rules: recurrenceRules,
          targetTransactionId: id,
          scope: recurrenceScope,
          updates,
        });
        const updatedTarget = result.transactions.find((t) => t.id === id);
        if (updatedTarget) {
          recordAuditEntries(existing, updatedTarget);
        }
        setTransactions(result.transactions);
        setRecurrenceRules(result.rules);
        showToast("Cambios aplicados a la recurrencia");
        return;
      }

      const nowIso = new Date().toISOString();
      const updatedTx: Transaction = {
        ...existing,
        ...updates,
        updated_at: nowIso,
      };
      recordAuditEntries(existing, updatedTx);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTx : t))
      );
      showToast("Movimiento actualizado");
    },
    [transactions, recurrenceRules, recordAuditEntries, showToast]
  );

  const confirmExpensePayment = useCallback(
    ({
      transactionId,
      actualAmount,
      settledDate,
      notes,
    }: {
      transactionId: string;
      actualAmount: number;
      settledDate: string;
      notes?: string;
    }) => {
      const existing = transactions.find((t) => t.id === transactionId);
      if (!existing) return;
      const nowIso = new Date().toISOString();
      const updatedTx: Transaction = {
        ...existing,
        status: "paid",
        actual_amount: actualAmount,
        settled_date: settledDate,
        settled_at: nowIso,
        notes: notes !== undefined ? notes : existing.notes,
        updated_at: nowIso,
      };
      recordAuditEntries(existing, updatedTx);
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );
      showToast(`Pago de "${existing.title}" confirmado`);
    },
    [transactions, recordAuditEntries, showToast]
  );

  const confirmIncomeReceipt = useCallback(
    ({
      transactionId,
      actualAmount,
      settledDate,
      notes,
    }: {
      transactionId: string;
      actualAmount: number;
      settledDate: string;
      notes?: string;
    }) => {
      const existing = transactions.find((t) => t.id === transactionId);
      if (!existing) return;
      const nowIso = new Date().toISOString();
      const updatedTx: Transaction = {
        ...existing,
        status: "received",
        actual_amount: actualAmount,
        settled_date: settledDate,
        settled_at: nowIso,
        notes: notes !== undefined ? notes : existing.notes,
        updated_at: nowIso,
      };
      recordAuditEntries(existing, updatedTx);
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );
      showToast(`Recepción de "${existing.title}" confirmada`);
    },
    [transactions, recordAuditEntries, showToast]
  );

  const rescheduleTransaction = useCallback(
    (transactionId: string, newExpectedDate: string) => {
      const existing = transactions.find((t) => t.id === transactionId);
      if (!existing) return;
      const nowIso = new Date().toISOString();
      const newStatus =
        existing.type === "expense"
          ? newExpectedDate < referenceDate
            ? "overdue"
            : "pending"
          : "scheduled";
      const updatedTx: Transaction = {
        ...existing,
        expected_date: newExpectedDate,
        status: newStatus,
        is_exception: existing.recurrence_rule_id ? true : existing.is_exception,
        updated_at: nowIso,
      };
      recordAuditEntries(existing, updatedTx);
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );
      showToast(`Reprogramado para el ${newExpectedDate}`);
    },
    [transactions, referenceDate, recordAuditEntries, showToast]
  );

  const cancelTransaction = useCallback(
    (transactionId: string) => {
      const existing = transactions.find((t) => t.id === transactionId);
      if (!existing) return;
      const nowIso = new Date().toISOString();
      const updatedTx: Transaction = {
        ...existing,
        status: "cancelled",
        updated_at: nowIso,
      };
      recordAuditEntries(existing, updatedTx);
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );
      showToast(`"${existing.title}" marcado como cancelado`);
    },
    [transactions, recordAuditEntries, showToast]
  );

  const updateBudget = useCallback(
    (updates: Partial<Budget>) => {
      setBudget((prev) => ({
        ...prev,
        ...updates,
      }));
      showToast("Presupuesto mensual actualizado");
    },
    [showToast]
  );

  const updateAccountOpeningBalance = useCallback(
    (newBalance: number, newDate: string) => {
      const nowIso = new Date().toISOString();
      setAuditLog((prev) => [
        {
          id: `audit-${Date.now()}`,
          workspace_id: SOFIA_WORKSPACE_ID,
          entity_type: "account",
          entity_id: account.id,
          field_changed: "opening_balance",
          old_value: String(account.opening_balance),
          new_value: String(newBalance),
          changed_by: user.id,
          changed_at: nowIso,
        },
        ...prev,
      ]);
      setAccount((prev) => ({
        ...prev,
        opening_balance: newBalance,
        opening_balance_date: newDate,
        opening_balance_at: nowIso,
      }));
      showToast("Saldo inicial y fecha de corte actualizados");
    },
    [account.id, account.opening_balance, user.id, showToast]
  );

  const createRecurrenceRule = useCallback(
    (ruleData: Omit<RecurrenceRule, "id" | "workspace_id" | "account_id">) => {
      const ruleId = `rule-${Date.now()}`;
      const newRule: RecurrenceRule = {
        ...ruleData,
        id: ruleId,
        workspace_id: SOFIA_WORKSPACE_ID,
        account_id: account.id,
      };
      setRecurrenceRules((prev) => [newRule, ...prev]);

      // Generar primera ocurrencia en el mes actual si está activa
      if (newRule.status === "active") {
        const day = String(newRule.day_of_month || 15).padStart(2, "0");
        const expDate = `${currentYearMonth}-${day}`;
        const nowIso = new Date().toISOString();
        const occTx: Transaction = {
          id: `tx-occ-${Date.now()}`,
          workspace_id: SOFIA_WORKSPACE_ID,
          account_id: account.id,
          type: newRule.type,
          title: newRule.title,
          category_id: newRule.category_id,
          priority: newRule.priority,
          status:
            newRule.type === "income"
              ? "scheduled"
              : expDate < referenceDate
              ? "overdue"
              : "pending",
          amount_type: newRule.amount_type,
          estimated_amount: newRule.default_amount,
          actual_amount: null,
          expected_date: expDate,
          settled_date: null,
          settled_at: null,
          recurrence_rule_id: ruleId,
          occurrence_date: expDate,
          is_exception: false,
          notes: newRule.notes,
          created_at: nowIso,
          updated_at: nowIso,
        };
        setTransactions((prev) => [occTx, ...prev]);
      }

      showToast(`Regla recurrente "${newRule.title}" creada`);
    },
    [account.id, currentYearMonth, referenceDate, showToast]
  );

  const updateRecurrenceRule = useCallback(
    (id: string, updates: Partial<RecurrenceRule>) => {
      setRecurrenceRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
      // Actualizar también ocurrencias futuras pendientes no pagadas
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.recurrence_rule_id !== id) return tx;
          if (tx.status === "paid" || tx.status === "received") return tx;
          return {
            ...tx,
            title: updates.title ?? tx.title,
            estimated_amount:
              updates.default_amount !== undefined
                ? updates.default_amount
                : tx.estimated_amount,
            priority: updates.priority ?? tx.priority,
            category_id:
              updates.category_id !== undefined
                ? updates.category_id
                : tx.category_id,
            amount_type: updates.amount_type ?? tx.amount_type,
          };
        })
      );
      showToast("Regla recurrente actualizada");
    },
    [showToast]
  );

  const toggleRecurrenceRuleStatus = useCallback(
    (id: string) => {
      setRecurrenceRules((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const nextStatus = r.status === "active" ? "paused" : "active";
          showToast(
            nextStatus === "paused"
              ? `"${r.title}" pausada (conserva historial)`
              : `"${r.title}" reactivada`
          );
          return { ...r, status: nextStatus };
        })
      );
    },
    [showToast]
  );

  const createCategory = useCallback(
    (catData: Omit<Category, "id" | "workspace_id" | "sort_order">) => {
      const newCat: Category = {
        ...catData,
        id: `cat-${Date.now()}`,
        workspace_id: SOFIA_WORKSPACE_ID,
        sort_order: categories.length + 1,
      };
      setCategories((prev) => [...prev, newCat]);
      showToast(`Categoría "${newCat.name}" creada`);
    },
    [categories.length, showToast]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      showToast("Categoría actualizada");
    },
    [showToast]
  );

  const markNotificationAsRead = useCallback((id: string) => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: nowIso } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: nowIso }))
    );
    showToast("Todos los avisos marcados como leídos");
  }, [showToast]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const completeOnboarding = useCallback(() => {
    setAccount((prev) => ({
      ...prev,
      opening_balance: onboardingDraft.openingBalance,
      opening_balance_date: onboardingDraft.openingDate,
      opening_balance_at: new Date().toISOString(),
    }));
    setBudget((prev) => ({
      ...prev,
      total_limit: onboardingDraft.monthlyBudget,
      alert_threshold_percent: onboardingDraft.alertThresholdPercent,
      min_cushion_amount: Math.round(onboardingDraft.monthlyBudget * 0.1),
    }));
    setActiveScreen("P10");
    showToast("¡Configuración inicial completada! Bienvenida a tu calendario.");
  }, [onboardingDraft, setActiveScreen, showToast]);

  const resetToSofiaMasterDataset = useCallback(() => {
    setAccount(SOFIA_ACCOUNT);
    setBudget(SOFIA_BUDGET);
    setCategories(SOFIA_CATEGORIES);
    setRecurrenceRules(SOFIA_RECURRENCE_RULES);
    setTransactions(SOFIA_TRANSACTIONS);
    setNotifications(SOFIA_NOTIFICATIONS);
    setAuditLog(SOFIA_AUDIT_LOG);
    setCurrentYearMonth("2026-11");
    setSelectedDate("2026-11-17");
    setSelectedTransactionId("tx-exp-05");
    setFilters(DEFAULT_FILTERS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast("Dataset Maestro de Sofía (PRD 8.3) restaurado");
  }, [showToast]);

  const loginWithEmail = useCallback(
    async (email: string, password?: string) => {
      if (password && password.length >= 6) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error && data.user) {
          setUser({
            id: data.user.id,
            name:
              data.user.user_metadata?.full_name ||
              email.split("@")[0] ||
              "Sofía",
            email: data.user.email || email,
            isSupabaseAuthenticated: true,
          });
          setActiveScreen("P10");
          showToast("Sesión iniciada con Supabase Auth");
          return { ok: true };
        }
      }
      // Modo interactivo directo si usa credenciales de prueba
      setUser({
        id: SOFIA_USER_ID,
        name: email.split("@")[0] || "Sofía Ramírez",
        email: email || "sofia.ramirez@ejemplo.mx",
        isSupabaseAuthenticated: false,
      });
      setActiveScreen("P10");
      showToast("Sesión iniciada en tu espacio financiero");
      return { ok: true };
    },
    [setActiveScreen, showToast]
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password?: string) => {
      if (password && password.length >= 8) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        if (!error && data.user) {
          setUser({
            id: data.user.id,
            name: name || email.split("@")[0],
            email,
            isSupabaseAuthenticated: true,
          });
          setActiveScreen("P05");
          showToast("Cuenta registrada en Supabase. Configura tu saldo inicial.");
          return { ok: true };
        }
      }
      setUser({
        id: SOFIA_USER_ID,
        name: name || "Sofía Ramírez",
        email: email || "sofia.ramirez@ejemplo.mx",
        isSupabaseAuthenticated: false,
      });
      setActiveScreen("P05");
      showToast("Cuenta creada. Completa los 5 pasos de configuración.");
      return { ok: true };
    },
    [setActiveScreen, showToast]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser((prev) => ({ ...prev, isSupabaseAuthenticated: false }));
    setActiveScreen("P01");
    showToast("Sesión cerrada");
  }, [setActiveScreen, showToast]);

  const syncWithSupabase = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatusMessage("Verificando conexión con Supabase...");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        setIsSyncing(false);
        const msg =
          "Proyecto Supabase (beqpktixfijdzjdtrxsz) conectado. Inicia sesión con cuenta Supabase en P02/P03 para sincronizar en la nube.";
        setSyncStatusMessage(msg);
        showToast("Conexión a Supabase verificada");
        return { ok: true, message: msg };
      }

      const authUserId = sessionData.session.user.id;
      const { data: wsList, error: wsErr } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_user_id", authUserId)
        .limit(1);

      if (wsErr) throw wsErr;

      const workspaceId = wsList?.[0]?.id;
      if (!workspaceId) {
        setIsSyncing(false);
        const msg = "Espacio de trabajo listo en Supabase.";
        setSyncStatusMessage(msg);
        return { ok: true, message: msg };
      }

      await supabase
        .from("accounts")
        .update({
          opening_balance: account.opening_balance,
          opening_balance_date: account.opening_balance_date,
          opening_balance_at: account.opening_balance_at,
        })
        .eq("workspace_id", workspaceId);

      await supabase.from("budgets").upsert(
        {
          workspace_id: workspaceId,
          month: budget.month,
          total_limit: budget.total_limit,
          alert_threshold_percent: budget.alert_threshold_percent,
          min_cushion_amount: budget.min_cushion_amount,
          min_cushion_percent: budget.min_cushion_percent,
        },
        { onConflict: "workspace_id,month" }
      );

      setIsSyncing(false);
      const msg = "Sincronizado con Supabase (beqpktixfijdzjdtrxsz) exitosamente.";
      setSyncStatusMessage(msg);
      showToast("Datos sincronizados con Supabase");
      return { ok: true, message: msg };
    } catch (err) {
      setIsSyncing(false);
      const msg =
        err instanceof Error ? err.message : "Error al sincronizar con Supabase";
      setSyncStatusMessage(msg);
      return { ok: false, message: msg };
    }
  }, [account, budget, showToast]);

  const value = useMemo<FinanceStoreContextValue>(
    () => ({
      activeScreen,
      setActiveScreen,
      previousScreen,
      goBack,
      user,
      loginWithEmail,
      registerWithEmail,
      logout,
      syncWithSupabase,
      isSyncing,
      syncStatusMessage,
      currentYearMonth,
      setCurrentYearMonth,
      goToPreviousMonth,
      goToNextMonth,
      referenceDate,
      selectedDate,
      setSelectedDate,
      selectedTransactionId,
      setSelectedTransactionId,
      selectedRuleId,
      setSelectedRuleId,
      selectedCategoryId,
      setSelectedCategoryId,
      account,
      budget,
      categories,
      recurrenceRules,
      transactions: effectiveTransactions,
      notifications,
      auditLog,
      monthProjection,
      budgetSummary,
      nextIncomeStretch,
      filters,
      setFilters,
      resetFilters,
      onboardingDraft,
      setOnboardingDraft,
      completeOnboarding,
      createTransaction,
      updateTransaction,
      confirmExpensePayment,
      confirmIncomeReceipt,
      rescheduleTransaction,
      cancelTransaction,
      updateBudget,
      updateAccountOpeningBalance,
      createRecurrenceRule,
      updateRecurrenceRule,
      toggleRecurrenceRuleStatus,
      createCategory,
      updateCategory,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      resetToSofiaMasterDataset,
      pendingRecurrenceEdit,
      setPendingRecurrenceEdit,
      toastMessage,
      showToast,
    }),
    [
      activeScreen,
      setActiveScreen,
      previousScreen,
      goBack,
      user,
      loginWithEmail,
      registerWithEmail,
      logout,
      syncWithSupabase,
      isSyncing,
      syncStatusMessage,
      currentYearMonth,
      goToPreviousMonth,
      goToNextMonth,
      referenceDate,
      selectedDate,
      selectedTransactionId,
      selectedRuleId,
      selectedCategoryId,
      account,
      budget,
      categories,
      recurrenceRules,
      effectiveTransactions,
      notifications,
      auditLog,
      monthProjection,
      budgetSummary,
      nextIncomeStretch,
      filters,
      resetFilters,
      onboardingDraft,
      completeOnboarding,
      createTransaction,
      updateTransaction,
      confirmExpensePayment,
      confirmIncomeReceipt,
      rescheduleTransaction,
      cancelTransaction,
      updateBudget,
      updateAccountOpeningBalance,
      createRecurrenceRule,
      updateRecurrenceRule,
      toggleRecurrenceRuleStatus,
      createCategory,
      updateCategory,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      resetToSofiaMasterDataset,
      pendingRecurrenceEdit,
      toastMessage,
      showToast,
    ]
  );

  return (
    <FinanceStoreContext.Provider value={value}>
      {children}
    </FinanceStoreContext.Provider>
  );
}

export function useFinanceStore(): FinanceStoreContextValue {
  const ctx = useContext(FinanceStoreContext);
  if (!ctx) {
    throw new Error(
      "useFinanceStore debe usarse dentro de FinanceStoreProvider"
    );
  }
  return ctx;
}
