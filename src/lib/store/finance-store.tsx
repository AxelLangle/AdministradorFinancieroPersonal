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
  ThemeMode,
  Transaction,
  TransactionFilters,
} from "../finance/types";
import {
  applyRecurrenceEditScope,
  calculateBudgetSummary,
  calculateMonthProjection,
  calculateNextIncomeStretch,
  getDaysInMonth,
  getNextYearMonth,
  getPreviousYearMonth,
  getTodayMexicoCity,
} from "../finance/engine";
import { supabase } from "../supabase/client";

const THEME_STORAGE_KEY = "afp_theme_mode";
const TUTORIAL_SEEN_PREFIX = "afp_tutorial_seen_";

const DEFAULT_BASE_CATEGORIES: Omit<Category, "workspace_id">[] = [
  {
    id: "cat-vivienda",
    name: "Hogar y Vivienda",
    kind: "expense",
    default_priority: "essential",
    icon: "home",
    color_token: "terracotta",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "cat-servicios",
    name: "Servicios (Luz, Agua, Internet)",
    kind: "expense",
    default_priority: "essential",
    icon: "bolt",
    color_token: "terracotta",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "cat-despensa",
    name: "Despensa y Supermercado",
    kind: "expense",
    default_priority: "essential",
    icon: "shopping_cart",
    color_token: "forest",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "cat-transporte",
    name: "Transporte y Gasolina",
    kind: "expense",
    default_priority: "important",
    icon: "directions_car",
    color_token: "amber",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "cat-salud",
    name: "Salud y Seguros",
    kind: "expense",
    default_priority: "important",
    icon: "shield",
    color_token: "amber",
    sort_order: 5,
    is_active: true,
  },
  {
    id: "cat-educacion",
    name: "Educación y Cursos",
    kind: "expense",
    default_priority: "important",
    icon: "school",
    color_token: "sage",
    sort_order: 6,
    is_active: true,
  },
  {
    id: "cat-tarjetas",
    name: "Tarjetas y Créditos",
    kind: "expense",
    default_priority: "essential",
    icon: "credit_card",
    color_token: "terracotta",
    sort_order: 7,
    is_active: true,
  },
  {
    id: "cat-suscripciones",
    name: "Suscripciones Digitales",
    kind: "expense",
    default_priority: "flexible",
    icon: "subscriptions",
    color_token: "slate",
    sort_order: 8,
    is_active: true,
  },
  {
    id: "cat-entretenimiento",
    name: "Entretenimiento y Salidas",
    kind: "expense",
    default_priority: "flexible",
    icon: "movie",
    color_token: "slate",
    sort_order: 9,
    is_active: true,
  },
  {
    id: "cat-nomina",
    name: "Sueldo y Nómina",
    kind: "income",
    default_priority: "essential",
    icon: "payments",
    color_token: "emerald",
    sort_order: 10,
    is_active: true,
  },
  {
    id: "cat-freelance",
    name: "Freelance y Otros Ingresos",
    kind: "income",
    default_priority: "important",
    icon: "work",
    color_token: "emerald",
    sort_order: 11,
    is_active: true,
  },
];

export interface OnboardingDraft {
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
  // Navegación
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;
  previousScreen: ScreenId;
  goBack: () => void;

  // Tema (Claro / Oscuro)
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;

  // Tutorial interactivo para nuevos usuarios
  isTutorialOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;

  // Usuario y Autenticación Multi-usuario en Supabase
  isInitializingAuth: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    isAuthenticated: boolean;
    onboardingCompleted: boolean;
  };
  workspaceId: string;
  loginWithEmail: (
    email: string,
    password?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    password?: string
  ) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  sendPasswordResetEmail: (
    email: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncWithSupabase: () => Promise<{ ok: boolean; message: string }>;
  isSyncing: boolean;
  syncStatusMessage: string | null;

  // Fechas y selección en calendario
  currentYearMonth: string;
  setCurrentYearMonth: (ym: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  referenceDate: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  selectedRuleId: string | null;
  setSelectedRuleId: (id: string | null) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;

  // Entidades del usuario autenticado
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

  // Filtros de Movimientos
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  resetFilters: () => void;

  // Onboarding
  onboardingDraft: OnboardingDraft;
  setOnboardingDraft: React.Dispatch<React.SetStateAction<OnboardingDraft>>;
  completeOnboarding: () => Promise<void>;

  // Acciones CRUD de Movimientos (sincronizadas con Supabase)
  createTransaction: (
    tx: Omit<
      Transaction,
      "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
    >
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>,
    recurrenceScope?: RecurrenceEditScope
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  confirmExpensePayment: (params: {
    transactionId: string;
    actualAmount: number;
    settledDate: string;
    notes?: string;
  }) => Promise<void>;
  confirmIncomeReceipt: (params: {
    transactionId: string;
    actualAmount: number;
    settledDate: string;
    notes?: string;
  }) => Promise<void>;
  rescheduleTransaction: (
    transactionId: string,
    newExpectedDate: string
  ) => Promise<void>;
  cancelTransaction: (transactionId: string) => Promise<void>;

  // Presupuesto y Cuenta
  updateBudget: (updates: Partial<Budget>) => Promise<void>;
  updateAccountOpeningBalance: (
    newBalance: number,
    newDate: string
  ) => Promise<void>;

  // Reglas Recurrentes
  createRecurrenceRule: (
    rule: Omit<RecurrenceRule, "id" | "workspace_id" | "account_id">
  ) => Promise<void>;
  updateRecurrenceRule: (
    id: string,
    updates: Partial<RecurrenceRule>
  ) => Promise<void>;
  deleteRecurrenceRule: (id: string) => Promise<void>;
  toggleRecurrenceRuleStatus: (id: string) => Promise<void>;

  // Categorías
  createCategory: (
    cat: Omit<Category, "id" | "workspace_id" | "sort_order">
  ) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;

  // Avisos
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Toast global
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

const FinanceStoreContext = createContext<FinanceStoreContextValue | null>(
  null
);

export function FinanceStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const todayStr = useMemo(() => getTodayMexicoCity(), []);
  const initialYearMonth = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const [activeScreen, setActiveScreenState] = useState<ScreenId>("P01");
  const [previousScreen, setPreviousScreen] = useState<ScreenId>("P01");
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([]);

  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    isAuthenticated: false,
    onboardingCompleted: false,
  });

  const [workspaceId, setWorkspaceId] = useState<string>("");

  const [currentYearMonth, setCurrentYearMonth] =
    useState<string>(initialYearMonth);
  const [referenceDate] = useState<string>(todayStr);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const [account, setAccount] = useState<Account>({
    id: "acc-empty",
    workspace_id: "",
    name: "Cuenta principal",
    type: "liquida",
    currency: "MXN",
    opening_balance: 0,
    opening_balance_date: todayStr,
    opening_balance_at: new Date().toISOString(),
    is_active: true,
  });

  const [budget, setBudget] = useState<Budget>({
    id: "bud-empty",
    workspace_id: "",
    month: `${initialYearMonth}-01`,
    total_limit: 0,
    alert_threshold_percent: 80,
    min_cushion_amount: 0,
    min_cushion_percent: 10,
  });

  const [categories, setCategories] = useState<Category[]>(
    DEFAULT_BASE_CATEGORIES.map((c) => ({ ...c, workspace_id: "" }))
  );
  const [recurrenceRules, setRecurrenceRules] = useState<RecurrenceRule[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);

  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({
    openingBalance: 0,
    openingDate: todayStr,
    monthlyBudget: 0,
    alertThresholdPercent: 80,
    selectedCategories: DEFAULT_BASE_CATEGORIES.map((c) => c.id),
    incomes: [],
    fixedExpenses: [],
  });

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

  // Gestión de Modo Oscuro / Claro
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      } else if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      }
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Carga completa del espacio de trabajo de un usuario autenticado desde Supabase
  const loadUserWorkspaceFromSupabase = useCallback(
    async (authUser: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }) => {
      setIsSyncing(true);
      try {
        // 1. Asegurar espacio de trabajo, cuenta principal, categorías y presupuesto mediante RPC
        const { data: rpcWorkspaceId } = await supabase.rpc(
          "ensure_user_workspace" as never
        );

        // 2. Obtener perfil de public.users
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        // 3. Resolver workspace_id
        let activeWsId =
          typeof rpcWorkspaceId === "string" ? rpcWorkspaceId : "";
        if (!activeWsId) {
          const { data: wsRows } = await supabase
            .from("workspaces")
            .select("id")
            .eq("owner_user_id", authUser.id)
            .order("created_at", { ascending: true })
            .limit(1);
          activeWsId = wsRows?.[0]?.id || "";
        }

        if (!activeWsId) {
          setIsSyncing(false);
          return;
        }

        setWorkspaceId(activeWsId);

        // 4. Cargar cuenta, categorías, presupuesto, reglas, transacciones, notificaciones y bitácora en paralelo
        const [
          accRes,
          catRes,
          budRes,
          rulesRes,
          txsRes,
          notifRes,
          auditRes,
        ] = await Promise.all([
          supabase
            .from("accounts")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("created_at", { ascending: true })
            .limit(1),
          supabase
            .from("categories")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("sort_order", { ascending: true }),
          supabase
            .from("budgets")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("month", { ascending: false })
            .limit(1),
          supabase
            .from("recurrence_rules")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("created_at", { ascending: false }),
          supabase
            .from("transactions")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("expected_date", { ascending: true }),
          supabase
            .from("notifications")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("created_at", { ascending: false }),
          supabase
            .from("audit_log")
            .select("*")
            .eq("workspace_id", activeWsId)
            .order("changed_at", { ascending: false })
            .limit(50),
        ]);

        if (accRes.data?.[0]) {
          const a = accRes.data[0];
          setAccount({
            id: a.id,
            workspace_id: a.workspace_id,
            name: a.name,
            type: "liquida",
            currency: a.currency,
            opening_balance: Number(a.opening_balance),
            opening_balance_date: a.opening_balance_date,
            opening_balance_at: a.opening_balance_at,
            is_active: a.is_active,
          });
        }

        if (catRes.data && catRes.data.length > 0) {
          const loadedCats: Category[] = catRes.data.map((c) => ({
            id: c.id,
            workspace_id: c.workspace_id,
            name: c.name,
            kind: c.kind as Category["kind"],
            default_priority: c.default_priority as PriorityLevel,
            icon: c.icon,
            color_token: c.color_token,
            sort_order: c.sort_order,
            is_active: c.is_active,
          }));
          setCategories(loadedCats);
          setOnboardingDraft((prev) => ({
            ...prev,
            selectedCategories: loadedCats.map((c) => c.id),
          }));
          setSelectedCategoryId(loadedCats[0]?.id || null);
        }

        if (budRes.data?.[0]) {
          const b = budRes.data[0];
          setBudget({
            id: b.id,
            workspace_id: b.workspace_id,
            month: b.month,
            total_limit: Number(b.total_limit),
            alert_threshold_percent: Number(b.alert_threshold_percent),
            min_cushion_amount:
              b.min_cushion_amount !== null
                ? Number(b.min_cushion_amount)
                : null,
            min_cushion_percent: Number(b.min_cushion_percent),
          });
        }

        if (rulesRes.data) {
          const loadedRules: RecurrenceRule[] = rulesRes.data.map((r) => ({
            id: r.id,
            workspace_id: r.workspace_id,
            account_id: r.account_id,
            type: r.type as RecurrenceRule["type"],
            title: r.title,
            category_id: r.category_id,
            priority: r.priority as PriorityLevel,
            amount_type: r.amount_type as RecurrenceRule["amount_type"],
            default_amount:
              r.default_amount !== null ? Number(r.default_amount) : null,
            frequency: r.frequency as RecurrenceRule["frequency"],
            interval_count: r.interval_count,
            day_of_month: r.day_of_month,
            semimonthly_days: r.semimonthly_days,
            day_of_week: r.day_of_week,
            start_date: r.start_date,
            end_date: r.end_date,
            status: r.status as RecurrenceRule["status"],
            notes: r.notes,
          }));
          setRecurrenceRules(loadedRules);
          setSelectedRuleId(loadedRules[0]?.id || null);
        }

        if (txsRes.data) {
          const loadedTxs: Transaction[] = txsRes.data.map((t) => ({
            id: t.id,
            workspace_id: t.workspace_id,
            account_id: t.account_id,
            type: t.type as Transaction["type"],
            title: t.title,
            category_id: t.category_id,
            priority: t.priority as PriorityLevel,
            status: t.status as Transaction["status"],
            amount_type: t.amount_type as Transaction["amount_type"],
            estimated_amount:
              t.estimated_amount !== null ? Number(t.estimated_amount) : null,
            actual_amount:
              t.actual_amount !== null ? Number(t.actual_amount) : null,
            expected_date: t.expected_date,
            settled_date: t.settled_date,
            settled_at: t.settled_at,
            recurrence_rule_id: t.recurrence_rule_id,
            occurrence_date: t.occurrence_date,
            is_exception: t.is_exception,
            notes: t.notes,
            created_at: t.created_at,
            updated_at: t.updated_at,
          }));
          setTransactions(loadedTxs);
          setSelectedTransactionId(loadedTxs[0]?.id || null);
        }

        if (notifRes.data) {
          setNotifications(
            notifRes.data.map((n) => ({
              id: n.id,
              workspace_id: n.workspace_id,
              user_id: n.user_id,
              type: n.type as AppNotification["type"],
              title: n.title,
              body: n.body,
              related_transaction_id: n.related_transaction_id,
              scheduled_for: n.scheduled_for,
              read_at: n.read_at,
              created_at: n.created_at,
            }))
          );
        }

        if (auditRes.data) {
          setAuditLog(auditRes.data);
        }

        const isCompleted = Boolean(userProfile?.onboarding_completed);
        const displayName =
          userProfile?.name ||
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name as string) ||
          authUser.email?.split("@")[0] ||
          "Usuario";

        setUser({
          id: authUser.id,
          name: displayName,
          email: authUser.email || "",
          isAuthenticated: true,
          onboardingCompleted: isCompleted,
        });

        // Si el usuario aún no ha completado el onboarding, llevarlo al Paso 1 (P05)
        setActiveScreenState((prev) => {
          if (["P01", "P02", "P03", "P04"].includes(prev)) {
            return isCompleted ? "P10" : "P05";
          }
          return prev;
        });

        // Mostrar el tutorial interactivo si es su primera vez en el calendario
        if (isCompleted) {
          try {
            const seen = localStorage.getItem(
              `${TUTORIAL_SEEN_PREFIX}${authUser.id}`
            );
            if (!seen) {
              setIsTutorialOpen(true);
              localStorage.setItem(
                `${TUTORIAL_SEEN_PREFIX}${authUser.id}`,
                "true"
              );
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // Error silencioso en carga inicial
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Suscripción al estado de sesión de Supabase Auth
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        await loadUserWorkspaceFromSupabase(data.session.user);
      }
      if (mounted) setIsInitializingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
          session?.user
        ) {
          await loadUserWorkspaceFromSupabase(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser({
            id: "",
            name: "",
            email: "",
            isAuthenticated: false,
            onboardingCompleted: false,
          });
          setWorkspaceId("");
          setTransactions([]);
          setRecurrenceRules([]);
          setNotifications([]);
          setAuditLog([]);
          setActiveScreenState("P01");
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadUserWorkspaceFromSupabase]);

  const setActiveScreen = useCallback(
    (next: ScreenId) => {
      if (next === activeScreen) return;
      setPreviousScreen(activeScreen);
      setScreenHistory((prev) => {
        const MAIN_TABS: ScreenId[] = ["P10", "P18", "P20", "P28"];
        if (MAIN_TABS.includes(next)) {
          return [...prev.filter((s) => !["P11", "P14", "P15", "P16", "P17", "P19", "P21"].includes(s)).slice(-12), activeScreen];
        }
        return [...prev.slice(-14), activeScreen];
      });
      setActiveScreenState(next);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [activeScreen]
  );

  const goBack = useCallback(() => {
    const stack = [...screenHistory];
    let target: ScreenId | undefined = stack.pop();

    const TX_SCREENS: ScreenId[] = ["P14", "P15", "P16", "P17"];
    while (
      target &&
      TX_SCREENS.includes(target) &&
      (!selectedTransactionId ||
        !transactions.some((t) => t.id === selectedTransactionId))
    ) {
      target = stack.pop();
    }

    const fallback: ScreenId =
      target || (TX_SCREENS.includes(previousScreen) ? "P10" : previousScreen || "P10");

    setScreenHistory(stack);
    setPreviousScreen(stack[stack.length - 1] || "P10");
    setActiveScreenState(fallback);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [screenHistory, previousScreen, selectedTransactionId, transactions]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentYearMonth((prev) => getPreviousYearMonth(prev));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentYearMonth((prev) => getNextYearMonth(prev));
  }, []);

  const monthProjection = useMemo(
    () =>
      calculateMonthProjection({
        yearMonth: currentYearMonth,
        referenceDate,
        account,
        transactions,
        budget,
      }),
    [currentYearMonth, referenceDate, account, transactions, budget]
  );

  const budgetSummary = useMemo(
    () =>
      calculateBudgetSummary({
        yearMonth: currentYearMonth,
        referenceDate,
        account,
        transactions,
        budget,
      }),
    [currentYearMonth, referenceDate, account, transactions, budget]
  );

  const nextIncomeStretch = useMemo(
    () =>
      calculateNextIncomeStretch({
        yearMonth: currentYearMonth,
        referenceDate,
        account,
        transactions,
        budget,
      }),
    [currentYearMonth, referenceDate, account, transactions, budget]
  );

  // Autenticación: Inicio de sesión con correo y contraseña
  const loginWithEmail = useCallback(
    async (email: string, password?: string) => {
      if (!password) {
        return { ok: false, error: "Por favor ingresa tu contraseña." };
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return {
          ok: false,
          error:
            error.message === "Invalid login credentials"
              ? "Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta nueva."
              : error.message,
        };
      }

      if (data.user) {
        await loadUserWorkspaceFromSupabase(data.user);
        showToast("¡Bienvenido de nuevo a tu calendario financiero!");
      }
      return { ok: true };
    },
    [loadUserWorkspaceFromSupabase, showToast]
  );

  // Autenticación: Registro de nuevo usuario en plataforma
  const registerWithEmail = useCallback(
    async (name: string, email: string, password?: string) => {
      if (!password || password.length < 8) {
        return {
          ok: false,
          error: "La contraseña debe tener al menos 8 caracteres.",
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });

      if (error) {
        return {
          ok: false,
          error:
            error.message === "User already registered"
              ? "Este correo ya está registrado. Inicia sesión con tu cuenta."
              : error.message,
        };
      }

      if (data.user && data.session) {
        await loadUserWorkspaceFromSupabase(data.user);
        setActiveScreenState("P05");
        showToast("¡Cuenta creada! Vamos a configurar tu espacio paso a paso.");
        return { ok: true };
      }

      if (data.user && !data.session) {
        return {
          ok: true,
          needsEmailConfirmation: true,
        };
      }

      return { ok: true };
    },
    [loadUserWorkspaceFromSupabase, showToast]
  );

  // Autenticación con Google OAuth
  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Error al iniciar sesión con Google",
      };
    }
  }, []);

  // Recuperación de contraseña
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser({
      id: "",
      name: "",
      email: "",
      isAuthenticated: false,
      onboardingCompleted: false,
    });
    setWorkspaceId("");
    setTransactions([]);
    setRecurrenceRules([]);
    setNotifications([]);
    setAuditLog([]);
    setActiveScreenState("P01");
    showToast("Sesión cerrada correctamente");
  }, [showToast]);

  // Crear movimiento (Gasto o Ingreso)
  const createTransaction = useCallback(
    async (
      txData: Omit<
        Transaction,
        "id" | "workspace_id" | "account_id" | "created_at" | "updated_at"
      >
    ): Promise<Transaction> => {
      const nowIso = new Date().toISOString();
      const tempId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });

      const optimisticTx: Transaction = {
        ...txData,
        id: tempId,
        workspace_id: workspaceId,
        account_id: account.id,
        created_at: nowIso,
        updated_at: nowIso,
      };

      setTransactions((prev) => [optimisticTx, ...prev]);

      if (user.isAuthenticated && workspaceId && account.id !== "acc-empty") {
        const { data } = await supabase
          .from("transactions")
          .insert({
            id: tempId,
            workspace_id: workspaceId,
            account_id: account.id,
            type: txData.type,
            title: txData.title,
            category_id: txData.category_id,
            priority: txData.priority,
            status: txData.status,
            amount_type: txData.amount_type,
            estimated_amount: txData.estimated_amount,
            actual_amount: txData.actual_amount,
            expected_date: txData.expected_date,
            settled_date: txData.settled_date,
            settled_at: txData.settled_at,
            recurrence_rule_id: txData.recurrence_rule_id,
            occurrence_date: txData.occurrence_date,
            is_exception: txData.is_exception,
            notes: txData.notes,
          })
          .select("*")
          .single();

        if (data) {
          const savedTx: Transaction = {
            ...optimisticTx,
            id: data.id,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          setTransactions((prev) =>
            prev.map((t) => (t.id === tempId ? savedTx : t))
          );
          showToast(
            savedTx.type === "expense"
              ? "Gasto registrado en tu calendario"
              : "Ingreso registrado en tu calendario"
          );
          return savedTx;
        }
      }

      showToast(
        optimisticTx.type === "expense"
          ? "Gasto registrado en tu calendario"
          : "Ingreso registrado en tu calendario"
      );
      return optimisticTx;
    },
    [workspaceId, account.id, user.isAuthenticated, showToast]
  );

  // Actualizar movimiento
  const updateTransaction = useCallback(
    async (
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
        setTransactions(result.transactions);
        setRecurrenceRules(result.rules);

        if (user.isAuthenticated && workspaceId) {
          for (const tx of result.transactions) {
            if (tx.recurrence_rule_id === existing.recurrence_rule_id) {
              await supabase
                .from("transactions")
                .update({
                  title: tx.title,
                  estimated_amount: tx.estimated_amount,
                  expected_date: tx.expected_date,
                  priority: tx.priority,
                  category_id: tx.category_id,
                  amount_type: tx.amount_type,
                  is_exception: tx.is_exception,
                })
                .eq("id", tx.id);
            }
          }
        }
        showToast("Cambios aplicados a tu serie recurrente");
        return;
      }

      const nowIso = new Date().toISOString();
      const updatedTx: Transaction = {
        ...existing,
        ...updates,
        updated_at: nowIso,
      };

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTx : t))
      );

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("transactions")
          .update({
            title: updatedTx.title,
            category_id: updatedTx.category_id,
            priority: updatedTx.priority,
            status: updatedTx.status,
            amount_type: updatedTx.amount_type,
            estimated_amount: updatedTx.estimated_amount,
            actual_amount: updatedTx.actual_amount,
            expected_date: updatedTx.expected_date,
            settled_date: updatedTx.settled_date,
            settled_at: updatedTx.settled_at,
            notes: updatedTx.notes,
          })
          .eq("id", id);
      }

      showToast("Movimiento actualizado");
    },
    [
      transactions,
      recurrenceRules,
      user.isAuthenticated,
      workspaceId,
      showToast,
    ]
  );

  // Eliminar movimiento permanentemente y actualizar movimientos/presupuesto
  const deleteTransaction = useCallback(
    async (id: string) => {
      const existing = transactions.find((t) => t.id === id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setNotifications((prev) =>
        prev.filter((n) => n.related_transaction_id !== id)
      );
      setSelectedTransactionId((prev) => (prev === id ? null : prev));

      if (user.isAuthenticated && workspaceId) {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("workspace_id", workspaceId);
        if (error) {
          console.error("Error eliminando movimiento:", error);
          if (existing) {
            setTransactions((prev) =>
              prev.some((t) => t.id === id) ? prev : [...prev, existing]
            );
          }
          showToast("No se pudo eliminar el movimiento. Intenta de nuevo.");
          return;
        }
      }

      const kindLabel = existing?.type === "income" ? "Ingreso" : "Gasto";
      showToast(
        existing
          ? `${kindLabel} "${existing.title}" eliminado`
          : "Movimiento eliminado"
      );
    },
    [transactions, user.isAuthenticated, workspaceId, showToast]
  );

  // Confirmar pago de gasto
  const confirmExpensePayment = useCallback(
    async ({
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

      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("transactions")
          .update({
            status: "paid",
            actual_amount: actualAmount,
            settled_date: settledDate,
            settled_at: nowIso,
            notes: updatedTx.notes,
          })
          .eq("id", transactionId);
      }

      showToast(`Pago de "${existing.title}" confirmado`);
    },
    [transactions, user.isAuthenticated, workspaceId, showToast]
  );

  // Confirmar recepción de ingreso
  const confirmIncomeReceipt = useCallback(
    async ({
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

      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("transactions")
          .update({
            status: "received",
            actual_amount: actualAmount,
            settled_date: settledDate,
            settled_at: nowIso,
            notes: updatedTx.notes,
          })
          .eq("id", transactionId);
      }

      showToast(`Ingreso "${existing.title}" confirmado como recibido`);
    },
    [transactions, user.isAuthenticated, workspaceId, showToast]
  );

  const rescheduleTransaction = useCallback(
    async (transactionId: string, newExpectedDate: string) => {
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
        is_exception: existing.recurrence_rule_id
          ? true
          : existing.is_exception,
        updated_at: nowIso,
      };

      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? updatedTx : t))
      );

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("transactions")
          .update({
            expected_date: newExpectedDate,
            status: newStatus,
            is_exception: updatedTx.is_exception,
          })
          .eq("id", transactionId);
      }

      showToast("Fecha reprogramada exitosamente");
    },
    [transactions, referenceDate, user.isAuthenticated, workspaceId, showToast]
  );

  const cancelTransaction = useCallback(
    async (transactionId: string) => {
      const existing = transactions.find((t) => t.id === transactionId);
      if (!existing) return;

      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
      setNotifications((prev) =>
        prev.filter((n) => n.related_transaction_id !== transactionId)
      );
      setSelectedTransactionId((prev) =>
        prev === transactionId ? null : prev
      );

      if (user.isAuthenticated && workspaceId) {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionId)
          .eq("workspace_id", workspaceId);
        if (error) {
          console.error("Error cancelando compromiso:", error);
          setTransactions((prev) =>
            prev.some((t) => t.id === transactionId) ? prev : [...prev, existing]
          );
          showToast("No se pudo cancelar el compromiso. Intenta de nuevo.");
          return;
        }
      }

      showToast(`Compromiso "${existing.title}" cancelado y eliminado`);
    },
    [transactions, user.isAuthenticated, workspaceId, showToast]
  );

  const updateBudget = useCallback(
    async (updates: Partial<Budget>) => {
      const nextBudget = { ...budget, ...updates };
      setBudget(nextBudget);

      if (user.isAuthenticated && workspaceId) {
        await supabase.from("budgets").upsert(
          {
            workspace_id: workspaceId,
            month: nextBudget.month,
            total_limit: nextBudget.total_limit,
            alert_threshold_percent: nextBudget.alert_threshold_percent,
            min_cushion_amount: nextBudget.min_cushion_amount,
            min_cushion_percent: nextBudget.min_cushion_percent,
          },
          { onConflict: "workspace_id,month" }
        );
      }

      showToast("Presupuesto mensual guardado");
    },
    [budget, user.isAuthenticated, workspaceId, showToast]
  );

  const updateAccountOpeningBalance = useCallback(
    async (newBalance: number, newDate: string) => {
      const nowIso = new Date().toISOString();
      setAccount((prev) => ({
        ...prev,
        opening_balance: newBalance,
        opening_balance_date: newDate,
        opening_balance_at: nowIso,
      }));

      if (user.isAuthenticated && workspaceId && account.id !== "acc-empty") {
        await supabase
          .from("accounts")
          .update({
            opening_balance: newBalance,
            opening_balance_date: newDate,
            opening_balance_at: nowIso,
          })
          .eq("id", account.id);
      }

      showToast("Saldo inicial y fecha de corte actualizados");
    },
    [account.id, user.isAuthenticated, workspaceId, showToast]
  );

  // Reglas recurrentes
  const createRecurrenceRule = useCallback(
    async (
      ruleData: Omit<RecurrenceRule, "id" | "workspace_id" | "account_id">
    ) => {
      const tempRuleId = crypto.randomUUID
        ? crypto.randomUUID()
        : `rule-${Date.now()}`;
      let finalRuleId = tempRuleId;

      const newRule: RecurrenceRule = {
        ...ruleData,
        id: tempRuleId,
        workspace_id: workspaceId,
        account_id: account.id,
      };

      setRecurrenceRules((prev) => [newRule, ...prev]);

      if (user.isAuthenticated && workspaceId && account.id !== "acc-empty") {
        const { data } = await supabase
          .from("recurrence_rules")
          .insert({
            workspace_id: workspaceId,
            account_id: account.id,
            type: ruleData.type,
            title: ruleData.title,
            category_id: ruleData.category_id,
            priority: ruleData.priority,
            amount_type: ruleData.amount_type,
            default_amount: ruleData.default_amount,
            frequency: ruleData.frequency,
            interval_count: ruleData.interval_count,
            day_of_month: ruleData.day_of_month,
            semimonthly_days: ruleData.semimonthly_days,
            day_of_week: ruleData.day_of_week,
            start_date: ruleData.start_date,
            end_date: ruleData.end_date,
            status: ruleData.status,
            notes: ruleData.notes,
          })
          .select("*")
          .single();

        if (data) {
          finalRuleId = data.id;
          setRecurrenceRules((prev) =>
            prev.map((r) => (r.id === tempRuleId ? { ...r, id: data.id } : r))
          );
        }
      }

      // Generar ocurrencia automática en el mes actual si está activa
      if (newRule.status === "active") {
        const [y, m] = currentYearMonth.split("-").map(Number);
        const maxDay = getDaysInMonth(y, m);
        const clampedDay = String(
          Math.min(newRule.day_of_month || 15, maxDay)
        ).padStart(2, "0");
        const expDate = `${currentYearMonth}-${clampedDay}`;

        await createTransaction({
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
          recurrence_rule_id: finalRuleId,
          occurrence_date: expDate,
          is_exception: false,
          notes: newRule.notes,
        });
      }

      showToast(`Regla recurrente "${newRule.title}" creada`);
    },
    [
      workspaceId,
      account.id,
      user.isAuthenticated,
      currentYearMonth,
      referenceDate,
      createTransaction,
      showToast,
    ]
  );

  const updateRecurrenceRule = useCallback(
    async (id: string, updates: Partial<RecurrenceRule>) => {
      setRecurrenceRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );

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

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("recurrence_rules")
          .update({
            title: updates.title,
            default_amount: updates.default_amount,
            amount_type: updates.amount_type,
            frequency: updates.frequency,
            day_of_month: updates.day_of_month,
            priority: updates.priority,
            category_id: updates.category_id,
            notes: updates.notes,
          })
          .eq("id", id);
      }

      showToast("Regla recurrente actualizada");
    },
    [user.isAuthenticated, workspaceId, showToast]
  );

  const deleteRecurrenceRule = useCallback(
    async (id: string) => {
      setRecurrenceRules((prev) => prev.filter((r) => r.id !== id));
      if (user.isAuthenticated && workspaceId) {
        await supabase.from("recurrence_rules").delete().eq("id", id);
      }
      showToast("Regla recurrente eliminada");
    },
    [user.isAuthenticated, workspaceId, showToast]
  );

  const toggleRecurrenceRuleStatus = useCallback(
    async (id: string) => {
      const target = recurrenceRules.find((r) => r.id === id);
      if (!target) return;
      const nextStatus = target.status === "active" ? "paused" : "active";

      setRecurrenceRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("recurrence_rules")
          .update({ status: nextStatus })
          .eq("id", id);
      }

      showToast(
        nextStatus === "paused"
          ? `"${target.title}" pausada (conserva tu historial)`
          : `"${target.title}" reactivada`
      );
    },
    [recurrenceRules, user.isAuthenticated, workspaceId, showToast]
  );

  const createCategory = useCallback(
    async (catData: Omit<Category, "id" | "workspace_id" | "sort_order">) => {
      const tempId = crypto.randomUUID
        ? crypto.randomUUID()
        : `cat-${Date.now()}`;
      const newCat: Category = {
        ...catData,
        id: tempId,
        workspace_id: workspaceId,
        sort_order: categories.length + 1,
      };
      setCategories((prev) => [...prev, newCat]);

      if (user.isAuthenticated && workspaceId) {
        const { data } = await supabase
          .from("categories")
          .insert({
            workspace_id: workspaceId,
            name: catData.name,
            kind: catData.kind,
            default_priority: catData.default_priority,
            icon: catData.icon,
            color_token: catData.color_token,
            sort_order: newCat.sort_order,
            is_active: true,
          })
          .select("*")
          .single();

        if (data) {
          setCategories((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: data.id } : c))
          );
        }
      }

      showToast(`Categoría "${newCat.name}" creada`);
    },
    [categories.length, workspaceId, user.isAuthenticated, showToast]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("categories")
          .update({
            name: updates.name,
            kind: updates.kind,
            default_priority: updates.default_priority,
            is_active: updates.is_active,
          })
          .eq("id", id);
      }

      showToast("Categoría actualizada");
    },
    [user.isAuthenticated, workspaceId, showToast]
  );

  const markNotificationAsRead = useCallback(
    async (id: string) => {
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: nowIso } : n))
      );
      if (user.isAuthenticated && workspaceId) {
        await supabase
          .from("notifications")
          .update({ read_at: nowIso })
          .eq("id", id);
      }
    },
    [user.isAuthenticated, workspaceId]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: nowIso }))
    );
    if (user.isAuthenticated && workspaceId) {
      await supabase
        .from("notifications")
        .update({ read_at: nowIso })
        .eq("workspace_id", workspaceId)
        .is("read_at", null);
    }
    showToast("Todos los avisos marcados como leídos");
  }, [user.isAuthenticated, workspaceId, showToast]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Finalizar los 5 pasos de Onboarding (guardando en Supabase y abriendo el Tutorial Interactivo)
  const completeOnboarding = useCallback(async () => {
    const nowIso = new Date().toISOString();

    await updateAccountOpeningBalance(
      onboardingDraft.openingBalance,
      onboardingDraft.openingDate
    );

    const minCushion = Math.round(onboardingDraft.monthlyBudget * 0.1);
    await updateBudget({
      total_limit: onboardingDraft.monthlyBudget,
      alert_threshold_percent: onboardingDraft.alertThresholdPercent,
      min_cushion_amount: minCushion,
      min_cushion_percent: 10,
    });

    // Crear reglas de ingresos iniciales agregadas en Onboarding Paso 4
    const incomeCatId =
      categories.find((c) => c.kind === "income")?.id ||
      categories[0]?.id ||
      null;

    for (const inc of onboardingDraft.incomes) {
      if (inc.amount > 0) {
        await createRecurrenceRule({
          type: "income",
          title: inc.title,
          category_id: incomeCatId,
          priority: "essential",
          amount_type: "fixed",
          default_amount: inc.amount,
          frequency:
            inc.frequency === "semimonthly" ? "semimonthly" : "monthly",
          interval_count: 1,
          day_of_month: inc.dayOfMonth || 15,
          semimonthly_days: inc.frequency === "semimonthly" ? "15,last" : null,
          day_of_week: null,
          start_date: `${currentYearMonth}-01`,
          end_date: null,
          status: "active",
          notes: "Configurado durante tu bienvenida",
        });

        // Si es quincenal, crear también la ocurrencia de fin de mes
        if (inc.frequency === "semimonthly") {
          const [y, m] = currentYearMonth.split("-").map(Number);
          const endDay = String(getDaysInMonth(y, m)).padStart(2, "0");
          const endDate = `${currentYearMonth}-${endDay}`;
          await createTransaction({
            type: "income",
            title: `${inc.title} (2ª quincena)`,
            category_id: incomeCatId,
            priority: "essential",
            status: "scheduled",
            amount_type: "fixed",
            estimated_amount: inc.amount,
            actual_amount: null,
            expected_date: endDate,
            settled_date: null,
            settled_at: null,
            recurrence_rule_id: null,
            occurrence_date: null,
            is_exception: false,
            notes: "Segunda quincena del mes",
          });
        }
      }
    }

    // Crear reglas de gastos fijos recurrentes agregadas en Onboarding Paso 5
    for (const exp of onboardingDraft.fixedExpenses) {
      if (exp.amount > 0) {
        await createRecurrenceRule({
          type: "expense",
          title: exp.title,
          category_id: exp.categoryId || categories[0]?.id || null,
          priority: exp.priority,
          amount_type: exp.amountType,
          default_amount: exp.amount,
          frequency: "monthly",
          interval_count: 1,
          day_of_month: exp.dayOfMonth || 1,
          semimonthly_days: null,
          day_of_week: null,
          start_date: `${currentYearMonth}-01`,
          end_date: null,
          status: "active",
          notes: "Compromiso mensual recurrente",
        });
      }
    }

    if (user.isAuthenticated && user.id) {
      await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      setUser((prev) => ({ ...prev, onboardingCompleted: true }));
    }

    setActiveScreenState("P10");
    setIsTutorialOpen(true);
    try {
      if (user.id) {
        localStorage.setItem(`${TUTORIAL_SEEN_PREFIX}${user.id}`, nowIso);
      }
    } catch {
      // ignore
    }
    showToast("¡Tu espacio financiero está listo!");
  }, [
    onboardingDraft,
    updateAccountOpeningBalance,
    updateBudget,
    categories,
    createRecurrenceRule,
    createTransaction,
    currentYearMonth,
    user.isAuthenticated,
    user.id,
    showToast,
  ]);

  const syncWithSupabase = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      const msg =
        "Inicia sesión o regístrate para sincronizar tus finanzas en la nube.";
      setSyncStatusMessage(msg);
      return { ok: false, message: msg };
    }
    await loadUserWorkspaceFromSupabase(sessionData.session.user);
    const msg = "Tus datos están sincronizados y respaldados en la nube.";
    setSyncStatusMessage(msg);
    showToast("Sincronización completada");
    return { ok: true, message: msg };
  }, [loadUserWorkspaceFromSupabase, showToast]);

  const value = useMemo<FinanceStoreContextValue>(
    () => ({
      activeScreen,
      setActiveScreen,
      previousScreen,
      goBack,
      theme,
      toggleTheme,
      setTheme,
      isTutorialOpen,
      setIsTutorialOpen,
      isInitializingAuth,
      user,
      workspaceId,
      loginWithEmail,
      registerWithEmail,
      signInWithGoogle,
      sendPasswordResetEmail,
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
      transactions,
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
      deleteTransaction,
      confirmExpensePayment,
      confirmIncomeReceipt,
      rescheduleTransaction,
      cancelTransaction,
      updateBudget,
      updateAccountOpeningBalance,
      createRecurrenceRule,
      updateRecurrenceRule,
      deleteRecurrenceRule,
      toggleRecurrenceRuleStatus,
      createCategory,
      updateCategory,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      toastMessage,
      showToast,
    }),
    [
      activeScreen,
      setActiveScreen,
      previousScreen,
      goBack,
      theme,
      toggleTheme,
      setTheme,
      isTutorialOpen,
      isInitializingAuth,
      user,
      workspaceId,
      loginWithEmail,
      registerWithEmail,
      signInWithGoogle,
      sendPasswordResetEmail,
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
      transactions,
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
      deleteTransaction,
      confirmExpensePayment,
      confirmIncomeReceipt,
      rescheduleTransaction,
      cancelTransaction,
      updateBudget,
      updateAccountOpeningBalance,
      createRecurrenceRule,
      updateRecurrenceRule,
      deleteRecurrenceRule,
      toggleRecurrenceRuleStatus,
      createCategory,
      updateCategory,
      markNotificationAsRead,
      markAllNotificationsAsRead,
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
