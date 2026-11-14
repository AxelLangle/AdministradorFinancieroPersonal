export type PriorityLevel = "essential" | "important" | "flexible";

export type TransactionType = "income" | "expense";

export type TransactionStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled"
  | "scheduled"
  | "received";

export type AmountType = "fixed" | "variable";

export type RecurrenceFrequency =
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "annual";

export type RecurrenceStatus = "active" | "paused";

export type RecurrenceEditScope =
  | "single" // Solo este pago / ingreso
  | "future" // Este y los siguientes
  | "all_pending"; // Todos los pendientes

export type TrafficLightColor = "green" | "amber" | "red";

export type ThemeMode = "light" | "dark";

export type ScreenId =
  | "P01" // Bienvenida
  | "P02" // Registro
  | "P03" // Inicio de sesión
  | "P04" // Recuperar contraseña
  | "P05" // Onboarding Paso 1: Saldo inicial
  | "P06" // Onboarding Paso 2: Presupuesto mensual
  | "P07" // Onboarding Paso 3: Categorías iniciales
  | "P08" // Onboarding Paso 4: Primeros ingresos
  | "P09" // Onboarding Paso 5: Gastos fijos recurrentes
  | "P10" // Inicio / Calendario mensual
  | "P11" // Detalle del día
  | "P12" // Nuevo gasto (Pendiente)
  | "P12B" // Nuevo gasto (Pagado)
  | "P13" // Nuevo ingreso (Programado)
  | "P13B" // Nuevo ingreso (Recibido)
  | "P14" // Detalle de movimiento
  | "P15" // Confirmar pago de gasto
  | "P16" // Confirmar recepción de ingreso
  | "P17" // Alcance de edición recurrente
  | "P18" // Movimientos
  | "P19" // Filtros
  | "P20" // Presupuesto
  | "P21" // Editar presupuesto
  | "P22" // Recurrentes
  | "P23" // Nueva regla recurrente
  | "P24" // Editar regla recurrente
  | "P25" // Categorías
  | "P26" // Nueva categoría
  | "P27" // Editar categoría
  | "P28" // Menú Más
  | "P29" // Configuración
  | "P30" // Centro de avisos
  | "P31" // Inicio vacío
  | "P32" // Proyección incompleta
  | "P33" // Modo sin conexión
  | "MANUAL"; // Manual Completo de Uso y Ayuda

export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  type: "liquida";
  currency: string;
  opening_balance: number;
  opening_balance_date: string; // YYYY-MM-DD
  opening_balance_at: string; // ISO timestamp
  is_active: boolean;
}

export interface Category {
  id: string;
  workspace_id: string;
  name: string;
  kind: "expense" | "income" | "both";
  default_priority: PriorityLevel;
  icon: string;
  color_token: string;
  sort_order: number;
  is_active: boolean;
}

export interface RecurrenceRule {
  id: string;
  workspace_id: string;
  account_id: string;
  type: TransactionType;
  title: string;
  category_id: string | null;
  priority: PriorityLevel;
  amount_type: AmountType;
  default_amount: number | null;
  frequency: RecurrenceFrequency;
  interval_count: number;
  day_of_month: number | null;
  semimonthly_days: string | null;
  day_of_week: number | null;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  status: RecurrenceStatus;
  notes: string | null;
}

export interface Transaction {
  id: string;
  workspace_id: string;
  account_id: string;
  type: TransactionType;
  title: string;
  category_id: string | null;
  priority: PriorityLevel;
  status: TransactionStatus;
  amount_type: AmountType;
  estimated_amount: number | null;
  actual_amount: number | null;
  expected_date: string; // YYYY-MM-DD
  settled_date: string | null; // YYYY-MM-DD
  settled_at: string | null; // ISO timestamp
  recurrence_rule_id: string | null;
  occurrence_date: string | null; // YYYY-MM-DD
  is_exception: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  workspace_id: string;
  month: string; // YYYY-MM-01
  total_limit: number;
  alert_threshold_percent: number;
  min_cushion_amount: number | null;
  min_cushion_percent: number;
}

export interface AppNotification {
  id: string;
  workspace_id: string;
  user_id: string;
  type:
    | "upcoming_due"
    | "overdue"
    | "delayed_income"
    | "budget_threshold"
    | "low_projected_balance";
  title: string;
  body: string;
  related_transaction_id: string | null;
  scheduled_for: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  workspace_id: string;
  entity_type: string;
  entity_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface TransactionFilters {
  searchQuery: string;
  type: "all" | "expense" | "income";
  statuses: TransactionStatus[];
  priorities: PriorityLevel[];
  categoryIds: string[];
  recurrenceFilter: "all" | "recurring" | "one_off";
}

export interface DailyProjectionPoint {
  date: string;
  dayNumber: number;
  incomesTotal: number;
  expensesTotal: number;
  netChange: number;
  closingBalance: number;
  hasUnquantifiedExpense: boolean;
  transactions: Transaction[];
}

export interface MonthProjectionSummary {
  yearMonth: string;
  periodRelationship: "past" | "current" | "future";
  startingBalance: number | null;
  currentBalance: number;
  receivedIncome: number;
  scheduledIncome: number;
  delayedIncome: number;
  paidExpense: number;
  pendingExpense: number;
  overdueExpenseCount: number;
  overdueExpenseAmount: number;
  delayedIncomeCount: number;
  committedExpense: number;
  projectedClosingBalance: number | null;
  historicalBalanceUnavailableMessage: string | null;
  lowestBalancePoint: {
    date: string;
    balance: number;
  } | null;
  minCushionAmount: number;
  hasUnquantifiedPendingExpenses: boolean;
  unquantifiedPendingExpensesCount: number;
  balanceTrafficLight: TrafficLightColor;
  dailyCurve: DailyProjectionPoint[];
}

export interface BudgetSummary {
  totalLimit: number;
  paidExpense: number;
  pendingExpense: number;
  committedExpense: number;
  availableBudget: number;
  committedPercent: number;
  paidPercent: number;
  pendingPercent: number;
  alertThresholdPercent: number;
  trafficLight: TrafficLightColor;
  priorityBreakdown: {
    priority: PriorityLevel;
    label: string;
    paid: number;
    pending: number;
    total: number;
    percentOfBudget: number;
  }[];
}

export interface NextIncomeStretch {
  nextIncomeTransaction: Transaction | null;
  daysUntilNextIncome: number | null;
  pendingExpensesBeforeNextIncome: number;
  pendingExpensesCountBeforeNextIncome: number;
  balanceJustBeforeNextIncome: number;
  lowestPointOfMonth: {
    date: string;
    balance: number;
  };
}
