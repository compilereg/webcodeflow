import { HomeStatsRow } from "shared/ui";
import { useContestDashboardContext } from "features/contest-dashboard";
import { QuickSubmitForm } from "./QuickSubmitForm";

export default function Home() {
  const { solved, pending, failed } = useContestDashboardContext();

  return (
    <>
      <HomeStatsRow solved={solved} pending={pending} failed={failed} />
      <QuickSubmitForm />
    </>
  );
}
