import { AdminClient, type AdminTab } from "@/components/backoffice/AdminClient";
import { loadSystemConfig } from "@/lib/store/configStore";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const config = loadSystemConfig();
  const validTabs: AdminTab[] = ["providers", "mapping", "rules"];
  const tab = validTabs.includes(params.tab as AdminTab)
    ? (params.tab as AdminTab)
    : "providers";

  return <AdminClient initialConfig={config} initialTab={tab} />;
}
