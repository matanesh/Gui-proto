import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";

export function RunDetailsPage() {
  const { runId } = useParams<{ runId: string }>();
  return (
    <div>
      <PageHeader title="Run Details" description={`Run ${runId ?? "unknown"}`} />
      <p className="text-sm text-muted-foreground">Screen under construction.</p>
    </div>
  );
}
