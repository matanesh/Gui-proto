import { PageHeader } from "@/components/layout/PageHeader";
import { EventStreamPanel } from "./EventStreamPanel";

export function EventStreamPage() {
  return (
    <div>
      <PageHeader
        title="Live Event Stream"
        description="Every event emitted by the running scenario, in one place — filter by severity or component, and follow a correlation id across the run."
      />
      <EventStreamPanel maxHeightClassName="max-h-[calc(100vh-16rem)]" limit={400} title="All events" />
    </div>
  );
}
