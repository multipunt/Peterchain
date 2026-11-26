import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { buildUnifiedDashboardPayload } from "@/lib/providers/registry";
import { loadSystemConfig } from "@/lib/store/configStore";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = loadSystemConfig();
  const initialData = await buildUnifiedDashboardPayload(
    "BTC",
    "30d",
    "auto",
    config
  );

  return <DashboardClient initialData={initialData} />;
}
