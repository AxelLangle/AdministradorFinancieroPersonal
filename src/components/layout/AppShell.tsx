"use client";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { ScreenId } from "@/lib/finance/types";
import {
  Calendar,
  ListFilter,
  PieChart,
  MoreHorizontal,
  Plus,
  Layers,
  RotateCcw,
  CloudUpload,
  ChevronDown,
  Smartphone,
  Monitor,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
} from "lucide-react";

interface ScreenMeta {
  id: ScreenId;
  code: string;
  title: string;
  group: string;
}

export const ALL_SCREENS_CATALOG: ScreenMeta[] = [
  // Acceso
  { id: "P01", code: "P01", title: "Bienvenida", group: "1. Acceso" },
  { id: "P02", code: "P02", title: "Registro", group: "1. Acceso" },
  { id: "P03", code: "P03", title: "Inicio de sesión", group: "1. Acceso" },
  { id: "P04", code: "P04", title: "Recuperar contraseña", group: "1. Acceso" },
  // Onboarding
  { id: "P05", code: "P05", title: "Paso 1: Saldo inicial", group: "2. Onboarding" },
  { id: "P06", code: "P06", title: "Paso 2: Presupuesto mensual", group: "2. Onboarding" },
  { id: "P07", code: "P07", title: "Paso 3: Categorías iniciales", group: "2. Onboarding" },
  { id: "P08", code: "P08", title: "Paso 4: Primeros ingresos", group: "2. Onboarding" },
  { id: "P09", code: "P09", title: "Paso 5: Gastos fijos recurrentes", group: "2. Onboarding" },
  // Núcleo y Calendario
  { id: "P10", code: "P10", title: "Inicio / Calendario mensual", group: "3. Núcleo y Calendario" },
  { id: "P11", code: "P11", title: "Detalle del día (Bottom Sheet)", group: "3. Núcleo y Calendario" },
  { id: "P12", code: "P12", title: "Nuevo gasto (Pendiente)", group: "3. Núcleo y Calendario" },
  { id: "P12B", code: "P12-B", title: "Nuevo gasto (Pagado)", group: "3. Núcleo y Calendario" },
  { id: "P13", code: "P13", title: "Nuevo ingreso (Programado)", group: "3. Núcleo y Calendario" },
  { id: "P13B", code: "P13-B", title: "Nuevo ingreso (Recibido)", group: "3. Núcleo y Calendario" },
  { id: "P14", code: "P14", title: "Detalle de movimiento", group: "3. Núcleo y Calendario" },
  { id: "P15", code: "P15", title: "Confirmar pago de gasto", group: "3. Núcleo y Calendario" },
  { id: "P16", code: "P16", title: "Confirmar recepción de ingreso", group: "3. Núcleo y Calendario" },
  { id: "P17", code: "P17", title: "Alcance de edición recurrente", group: "3. Núcleo y Calendario" },
  // Historial y Presupuesto
  { id: "P18", code: "P18", title: "Movimientos", group: "4. Historial y Presupuesto" },
  { id: "P19", code: "P19", title: "Filtros combinables", group: "4. Historial y Presupuesto" },
  { id: "P20", code: "P20", title: "Presupuesto mensual", group: "4. Historial y Presupuesto" },
  { id: "P21", code: "P21", title: "Editar presupuesto", group: "4. Historial y Presupuesto" },
  // Gestión y Configuración
  { id: "P22", code: "P22", title: "Recurrentes", group: "5. Gestión y Configuración" },
  { id: "P23", code: "P23", title: "Nueva regla recurrente", group: "5. Gestión y Configuración" },
  { id: "P24", code: "P24", title: "Editar regla recurrente", group: "5. Gestión y Configuración" },
  { id: "P25", code: "P25", title: "Categorías", group: "5. Gestión y Configuración" },
  { id: "P26", code: "P26", title: "Nueva categoría", group: "5. Gestión y Configuración" },
  { id: "P27", code: "P27", title: "Editar categoría", group: "5. Gestión y Configuración" },
  { id: "P28", code: "P28", title: "Menú Más", group: "5. Gestión y Configuración" },
  { id: "P29", code: "P29", title: "Configuración", group: "5. Gestión y Configuración" },
  { id: "P30", code: "P30", title: "Centro de avisos", group: "5. Gestión y Configuración" },
  // Estados especiales
  { id: "P31", code: "P31", title: "Inicio vacío", group: "6. Estados Especiales" },
  { id: "P32", code: "P32", title: "Proyección incompleta", group: "6. Estados Especiales" },
  { id: "P33", code: "P33", title: "Error de conexión", group: "6. Estados Especiales" },
];

const NO_BOTTOM_NAV_SCREENS: ScreenId[] = [
  "P01",
  "P02",
  "P03",
  "P04",
  "P05",
  "P06",
  "P07",
  "P08",
  "P09",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    activeScreen,
    setActiveScreen,
    notifications,
    resetToSofiaMasterDataset,
    syncWithSupabase,
    isSyncing,
    toastMessage,
  } = useFinanceStore();

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [viewportMode, setViewportMode] = useState<"mobile" | "responsive">(
    "mobile"
  );

  const unreadNotifications = notifications.filter((n) => !n.read_at).length;
  const showBottomNav = !NO_BOTTOM_NAV_SCREENS.includes(activeScreen);
  const currentMeta =
    ALL_SCREENS_CATALOG.find((s) => s.id === activeScreen) ||
    ALL_SCREENS_CATALOG[9];

  const isCalendarTabActive = [
    "P10",
    "P11",
    "P14",
    "P15",
    "P16",
    "P17",
    "P31",
    "P32",
    "P33",
  ].includes(activeScreen);
  const isMovementsTabActive = ["P18", "P19"].includes(activeScreen);
  const isBudgetTabActive = ["P20", "P21"].includes(activeScreen);
  const isMoreTabActive = [
    "P22",
    "P23",
    "P24",
    "P25",
    "P26",
    "P27",
    "P28",
    "P29",
    "P30",
  ].includes(activeScreen);

  return (
    <div className="min-h-screen bg-[#EAE8E1] text-[#26332D] flex flex-col items-center">
      {/* Barra superior discreta de herramientas / Selector de las 35 pantallas PRD & Stitch */}
      <div className="w-full bg-[#26332D] text-[#F6F5F0] px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50 border-b border-[#34483D]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCatalogOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#34483D] hover:bg-[#41594C] text-[#F6F5F0] font-medium transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#91A68C]" />
            <span>
              {currentMeta.code}: {currentMeta.title}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>
          <span className="hidden sm:inline-block text-[11px] text-[#91A68C]">
            35/35 pantallas Stitch • PRD v1.1.2
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setViewportMode((m) =>
                m === "mobile" ? "responsive" : "mobile"
              )
            }
            title="Alternar vista Mobile-First (390px) / Adaptativa"
            className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#34483D]/70 hover:bg-[#34483D] text-[#E8DCCB] transition cursor-pointer"
          >
            {viewportMode === "mobile" ? (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>390px Mobile-First</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Vista expandida</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetToSofiaMasterDataset}
            title="Restaurar Dataset Maestro de Sofía (PRD 8.3)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#34483D]/70 hover:bg-[#34483D] text-[#E8DCCB] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dataset Sofía</span>
          </button>

          <button
            type="button"
            onClick={() => syncWithSupabase()}
            disabled={isSyncing}
            title="Sincronizar con proyecto Supabase (beqpktixfijdzjdtrxsz)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#23845B] hover:bg-[#1D6E4B] text-white font-medium transition cursor-pointer disabled:opacity-50"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{isSyncing ? "Sincronizando..." : "Supabase"}</span>
          </button>
        </div>
      </div>

      {/* Panel desplegable de las 35 pantallas (P01 a P33) */}
      {catalogOpen && (
        <div className="w-full max-w-4xl bg-[#FFFFFF] border-b border-[#E4E6DE] shadow-xl rounded-b-2xl p-4 z-50 mx-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4E6DE]">
            <div>
              <h3 className="text-sm font-bold text-[#26332D]">
                Catálogo Completo de Pantallas (PRD v1.1.2 y Google Stitch)
              </h3>
              <p className="text-xs text-[#68736B]">
                Selecciona cualquier pantalla para inspeccionarla directamente o navega de forma natural dentro de la aplicación.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCatalogOpen(false)}
              className="p-1.5 rounded-lg hover:bg-[#F0F1EB] text-[#68736B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {[
              "1. Acceso",
              "2. Onboarding",
              "3. Núcleo y Calendario",
              "4. Historial y Presupuesto",
              "5. Gestión y Configuración",
              "6. Estados Especiales",
            ].map((groupName) => (
              <div
                key={groupName}
                className="bg-[#F6F5F0] rounded-xl p-2.5 border border-[#E4E6DE]"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#34483D] mb-1.5">
                  {groupName}
                </div>
                <div className="space-y-1">
                  {ALL_SCREENS_CATALOG.filter((s) => s.group === groupName).map(
                    (scr) => {
                      const active = scr.id === activeScreen;
                      return (
                        <button
                          key={scr.id}
                          type="button"
                          onClick={() => {
                            setActiveScreen(scr.id);
                            setCatalogOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                            active
                              ? "bg-[#34483D] text-white font-semibold"
                              : "hover:bg-[#E8DCCB]/60 text-[#26332D]"
                          }`}
                        >
                          <span className="truncate">
                            <strong className="mr-1.5">{scr.code}</strong>
                            {scr.title}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marco Principal Mobile-First (390px-430px o Expandido) */}
      <div
        className={`relative w-full bg-[#F6F5F0] min-h-[calc(100vh-37px)] flex flex-col shadow-2xl border-x border-[#E4E6DE] transition-all ${
          viewportMode === "mobile" ? "max-w-[430px]" : "max-w-5xl"
        }`}
      >
        {/* Toast Flotante */}
        {toastMessage && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#26332D] text-[#F6F5F0] px-4 py-2.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 border border-[#91A68C]/40 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#23845B]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Contenido de la pantalla activa */}
        <main
          className={`flex-1 flex flex-col ${
            showBottomNav ? "pb-24" : "pb-6"
          }`}
        >
          {children}
        </main>

        {/* Modal rápido del botón central "+" */}
        {plusMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center">
            <div className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#26332D]">
                    Registrar movimiento
                  </h3>
                  <p className="text-xs text-[#68736B]">
                    Elige qué deseas agregar a tu calendario financiero
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen(false)}
                  className="p-2 rounded-full bg-[#F0F1EB] text-[#68736B] hover:text-[#26332D] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    setActiveScreen("P12");
                  }}
                  className="flex flex-col items-start p-4 rounded-2xl bg-[#FDF5F2] border border-[#F1D8CE] hover:bg-[#FAEDE8] transition text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#C94C4C]/15 text-[#C94C4C] flex items-center justify-center mb-2">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#26332D]">
                    Nuevo gasto
                  </span>
                  <span className="text-[11px] text-[#68736B] mt-0.5">
                    Pendiente o ya pagado
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    setActiveScreen("P13");
                  }}
                  className="flex flex-col items-start p-4 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] hover:bg-[#E1F2EA] transition text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#23845B]/15 text-[#23845B] flex items-center justify-center mb-2">
                    <ArrowUpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#26332D]">
                    Nuevo ingreso
                  </span>
                  <span className="text-[11px] text-[#68736B] mt-0.5">
                    Programado o recibido
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de navegación inferior persistente (PRD 6.1 y 9.2) */}
        {showBottomNav && (
          <nav
            aria-label="Navegación principal"
            className={`fixed bottom-0 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E4E6DE] px-2 pt-1.5 pb-2.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(38,51,45,0.06)] ${
              viewportMode === "mobile" ? "max-w-[430px]" : "max-w-5xl"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveScreen("P10")}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
                isCalendarTabActive
                  ? "text-[#34483D] font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Calendario</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen("P18")}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
                isMovementsTabActive
                  ? "text-[#34483D] font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <ListFilter className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Movimientos</span>
            </button>

            {/* Botón de acción rápida central "+" (48px x 48px, #34483D) */}
            <div className="relative -top-3">
              <button
                type="button"
                aria-label="Agregar movimiento"
                onClick={() => setPlusMenuOpen((prev) => !prev)}
                className="w-12 h-12 rounded-full bg-[#34483D] hover:bg-[#26332D] text-[#FFFFFF] shadow-lg flex items-center justify-center transition transform active:scale-95 cursor-pointer border-4 border-[#F6F5F0]"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveScreen("P20")}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
                isBudgetTabActive
                  ? "text-[#34483D] font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <PieChart className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Presupuesto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen("P28")}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
                isMoreTabActive
                  ? "text-[#34483D] font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Más</span>
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#C94C4C]" />
              )}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
