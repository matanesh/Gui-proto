import { Badge } from "@/components/ui/badge";
import { COMPONENT_LABEL } from "@/models";
import type { ComponentName } from "@/models";

export function ComponentBadge({ component }: { component: ComponentName }) {
  return <Badge variant="outline">{COMPONENT_LABEL[component]}</Badge>;
}
