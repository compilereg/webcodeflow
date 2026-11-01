import { createContext, useContext, type ReactNode } from "react";
import { useContestDashboard } from "./useContestDashboard";

type ContestDashboardValue = ReturnType<typeof useContestDashboard>;

const ContestDashboardContext = createContext<ContestDashboardValue | null>(
  null
);

export function ContestDashboardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useContestDashboard();
  return (
    <ContestDashboardContext.Provider value={value}>
      {children}
    </ContestDashboardContext.Provider>
  );
}

export function useContestDashboardContext(): ContestDashboardValue {
  const ctx = useContext(ContestDashboardContext);
  if (!ctx) {
    throw new Error(
      "useContestDashboardContext must be used within ContestDashboardProvider"
    );
  }
  return ctx;
}
