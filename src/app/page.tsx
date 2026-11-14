"use client";

import React, { useEffect } from "react";
import {
  FinanceStoreProvider,
  useFinanceStore,
} from "@/lib/store/finance-store";
import { AppShell } from "@/components/layout/AppShell";
import { AccessScreens } from "@/components/screens/AccessScreens";
import { OnboardingScreens } from "@/components/screens/OnboardingScreens";
import { CalendarCoreScreens } from "@/components/screens/CalendarCoreScreens";
import { TransactionModalsScreens } from "@/components/screens/TransactionModalsScreens";
import { HistoryAndBudgetScreens } from "@/components/screens/HistoryAndBudgetScreens";
import { ManagementScreens } from "@/components/screens/ManagementScreens";

function ScreenRouter() {
  const { activeScreen } = useFinanceStore();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignorar en desarrollo si falla registro SW
      });
    }
  }, []);

  if (["P01", "P02", "P03", "P04"].includes(activeScreen)) {
    return <AccessScreens />;
  }

  if (["P05", "P06", "P07", "P08", "P09"].includes(activeScreen)) {
    return <OnboardingScreens />;
  }

  if (["P10", "P11", "P31", "P32", "P33"].includes(activeScreen)) {
    return <CalendarCoreScreens />;
  }

  if (
    ["P12", "P12B", "P13", "P13B", "P14", "P15", "P16", "P17"].includes(
      activeScreen
    )
  ) {
    return <TransactionModalsScreens />;
  }

  if (["P18", "P19", "P20", "P21"].includes(activeScreen)) {
    return <HistoryAndBudgetScreens />;
  }

  return <ManagementScreens />;
}

export default function HomePage() {
  return (
    <FinanceStoreProvider>
      <AppShell>
        <ScreenRouter />
      </AppShell>
    </FinanceStoreProvider>
  );
}
