import { Outlet } from "react-router-dom";
import {
  DesktopNotificationPrompt,
  useContestClock,
} from "features/contest-realtime";
import {
  ContestDashboardProvider,
  useContestDashboardContext,
} from "features/contest-dashboard";
import { ContestSidebar } from "./ContestSidebar";
import Footer from "./Footer";
import Navbar from "./Navbar";

function ContestLayoutInner() {
  const { timeLeft, hasInitialData } = useContestClock();
  const { teamName, username, rank, standingsIssue, progressRatio } =
    useContestDashboardContext();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface text-foreground">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-3 py-5 sm:px-4 sm:py-6 lg:flex-row lg:items-stretch lg:gap-6 lg:px-6">
        <div className="w-full shrink-0 lg:sticky lg:top-[4.5rem] lg:w-[300px] lg:self-start xl:w-[320px]">
          <ContestSidebar
            displayName={teamName}
            username={username}
            rank={rank}
            standingsIssue={standingsIssue}
            timeLeft={timeLeft}
            hasInitialData={hasInitialData}
            progressRatio={progressRatio}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Outlet />
        </div>
      </main>

      <Footer />
      <DesktopNotificationPrompt />
    </div>
  );
}

/** Shared chrome for authenticated contest pages: navbar + pinned sidebar. */
export default function ContestLayout() {
  return (
    <ContestDashboardProvider>
      <ContestLayoutInner />
    </ContestDashboardProvider>
  );
}
