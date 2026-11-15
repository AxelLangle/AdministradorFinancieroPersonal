"use client";

import {
  useBottomSheetDragToDismiss,
  useHorizontalSwipe,
} from "@/lib/hooks/useSwipeGesture";

import React, { useState } from "react";
import { useFinanceStore } from "@/lib/store/finance-store";
import type { ScreenId } from "@/lib/finance/types";
import { InteractiveTutorialModal } from "@/components/screens/TutorialAndManualModal";
import {
  Calendar,
  ListFilter,
  PieChart,
  MoreHorizontal,
  Plus,
  Smartphone,
  Monitor,
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  Moon,
  Sun,
  HelpCircle,
  BookOpen,
} from "lucide-react";

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
    goBack,
    notifications,
    toastMessage,
    theme,
    toggleTheme,
    openTutorialAtPhase,
  } = useFinanceStore();

  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  const MAIN_TAB_ORDER = ["P10", "P18", "P20", "P28"] as const;
  const mainTabIndex = MAIN_TAB_ORDER.indexOf(
    activeScreen as (typeof MAIN_TAB_ORDER)[number]
  );
  const isMainTab = mainTabIndex !== -1;
  const isSubScreenForBack = [
    "P12",
    "P12B",
    "P13",
    "P13B",
    "P14",
    "P15",
    "P16",
    "P17",
    "P22",
    "P23",
    "P24",
    "P25",
    "P26",
    "P27",
    "P29",
    "P30",
    "MANUAL",
  ].includes(activeScreen);

  const mainSwipeHandlers = useHorizontalSwipe({
    enabled: isMainTab || isSubScreenForBack,
    edgeOnly: !isMainTab && isSubScreenForBack,
    edgeWidth: 56,
    threshold: 58,
    onSwipeLeft: () => {
      if (isMainTab && mainTabIndex < MAIN_TAB_ORDER.length - 1) {
        setActiveScreen(MAIN_TAB_ORDER[mainTabIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (isMainTab && mainTabIndex > 0) {
        setActiveScreen(MAIN_TAB_ORDER[mainTabIndex - 1]);
      } else if (!isMainTab && isSubScreenForBack) {
        goBack();
      }
    },
  });

  const plusSheetDrag = useBottomSheetDragToDismiss({
    enabled: plusMenuOpen,
    onClose: () => setPlusMenuOpen(false),
  });
  const [viewportMode, setViewportMode] = useState<"mobile" | "responsive">(
    "mobile"
  );

  const unreadNotifications = notifications.filter((n) => !n.read_at).length;
  const showBottomNav = !NO_BOTTOM_NAV_SCREENS.includes(activeScreen);

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
    "MANUAL",
  ].includes(activeScreen);

  return (
    <div className="min-h-[100dvh] bg-[#EAE8E1] text-[#26332D] flex flex-col items-center">
      {/* Barra superior limpia de producción: Modo Oscuro, Manual y Guía Rápida */}
      <div className="w-full bg-[#26332D] text-[#F6F5F0] px-3.5 py-2 text-xs flex items-center justify-between gap-2 z-40 border-b border-[#34483D]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#34483D] flex items-center justify-center text-[#91A68C]">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-tight text-white">
            Calendario Financiero
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {showBottomNav && (
            <>
              <button
                type="button"
                onClick={() => openTutorialAtPhase(1)}
                title="Ver tutorial interactivo de uso"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#34483D]/80 hover:bg-[#34483D] text-[#E8DCCB] transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tutorial</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen("MANUAL")}
                title="Abrir manual completo de usuario"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#34483D]/80 hover:bg-[#34483D] text-[#E8DCCB] transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            title={
              theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#34483D]/80 hover:bg-[#34483D] text-[#E8DCCB] transition cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#D99A32]" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#91A68C]" />
                <span className="hidden sm:inline">Oscuro</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setViewportMode((m) =>
                m === "mobile" ? "responsive" : "mobile"
              )
            }
            title="Alternar vista móvil / pantalla completa"
            className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#34483D]/60 hover:bg-[#34483D] text-[#E8DCCB] transition cursor-pointer"
          >
            {viewportMode === "mobile" ? (
              <Smartphone className="w-3.5 h-3.5" />
            ) : (
              <Monitor className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Contenedor Mobile-First */}
      <div
        className={`relative w-full bg-[#F6F5F0] min-h-[calc(100dvh-37px)] flex flex-col shadow-2xl border-x border-[#E4E6DE] transition-all ${
          viewportMode === "mobile" ? "max-w-[430px]" : "max-w-5xl"
        }`}
      >
        {/* Toast Flotante */}
        {toastMessage && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#26332D] text-[#F6F5F0] px-4 py-2.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 border border-[#91A68C]/40">
            <span className="w-2 h-2 rounded-full bg-[#23845B]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tutorial Interactivo para Nuevos Usuarios */}
        <InteractiveTutorialModal />

        {/* Contenido de la vista activa */}
        <main
          {...mainSwipeHandlers}
          className={`flex-1 flex flex-col touch-pan-y ${
            showBottomNav ? "pb-24" : "pb-6"
          }`}
        >
          {children}
        </main>

        {/* Hoja de acción rápida del botón central "+" */}
        {plusMenuOpen && (
          <div
            onClick={plusSheetDrag.handleBackdropClick}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center"
          >
            <div
              {...plusSheetDrag.sheetTouchHandlers}
              style={plusSheetDrag.sheetStyle}
              className="w-full max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 border-t border-[#E4E6DE] shadow-2xl"
            >
              <div className="w-12 h-1.5 rounded-full bg-[#E4E6DE] mx-auto mb-3" />
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
                  className="flex flex-col items-start p-4 rounded-2xl bg-[#FDF5F2] border border-[#F1D8CE] hover:opacity-90 transition text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#C94C4C]/15 text-[#C94C4C] flex items-center justify-center mb-2">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#26332D]">
                    Nuevo gasto
                  </span>
                  <span className="text-[11px] text-[#68736B] mt-0.5">
                    Pendiente por pagar o ya pagado
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    setActiveScreen("P13");
                  }}
                  className="flex flex-col items-start p-4 rounded-2xl bg-[#EDF7F2] border border-[#C6E7D6] hover:opacity-90 transition text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#23845B]/15 text-[#23845B] flex items-center justify-center mb-2">
                    <ArrowUpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#26332D]">
                    Nuevo ingreso
                  </span>
                  <span className="text-[11px] text-[#68736B] mt-0.5">
                    Programado por cobrar o recibido
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de navegación inferior persistente */}
        {showBottomNav && (
          <nav
            aria-label="Navegación principal"
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E4E6DE] px-1.5 pt-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] grid grid-cols-5 items-center shadow-[0_-4px_20px_rgba(38,51,45,0.06)] ${
              viewportMode === "mobile" ? "max-w-[430px]" : "max-w-5xl"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveScreen("P10")}
              className={`min-h-[48px] w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition cursor-pointer ${
                isCalendarTabActive
                  ? "text-[#34483D] bg-[#F0F1EB]/80 font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10.5px] leading-tight mt-0.5 whitespace-nowrap">
                Calendario
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen("P18")}
              className={`min-h-[48px] w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition cursor-pointer ${
                isMovementsTabActive
                  ? "text-[#34483D] bg-[#F0F1EB]/80 font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <ListFilter className="w-5 h-5" />
              <span className="text-[10.5px] leading-tight mt-0.5 whitespace-nowrap">
                Movimientos
              </span>
            </button>

            <div className="relative -top-3 flex items-center justify-center">
              <button
                type="button"
                aria-label="Agregar movimiento"
                onClick={() => setPlusMenuOpen((prev) => !prev)}
                className="w-13 h-13 rounded-full bg-[#34483D] hover:bg-[#26332D] text-[#FFFFFF] shadow-lg flex items-center justify-center transition transform active:scale-95 cursor-pointer border-4 border-[#F6F5F0]"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveScreen("P20")}
              className={`min-h-[48px] w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition cursor-pointer ${
                isBudgetTabActive
                  ? "text-[#34483D] bg-[#F0F1EB]/80 font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <PieChart className="w-5 h-5" />
              <span className="text-[10.5px] leading-tight mt-0.5 whitespace-nowrap">
                Presupuesto
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen("P28")}
              className={`relative min-h-[48px] w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition cursor-pointer ${
                isMoreTabActive
                  ? "text-[#34483D] bg-[#F0F1EB]/80 font-semibold"
                  : "text-[#68736B] hover:text-[#26332D]"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <MoreHorizontal className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#C94C4C]" />
                )}
              </div>
              <span className="text-[10.5px] leading-tight mt-0.5 whitespace-nowrap">
                Más
              </span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
