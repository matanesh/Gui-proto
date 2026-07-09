import { AssistantPanel } from "./AssistantPanel";
import { useUiStore } from "@/store/uiStore";

export function FloatingAssistant() {
  const open = useUiStore((s) => s.assistantOpen);
  const setOpen = useUiStore((s) => s.setAssistantOpen);
  return <AssistantPanel open={open} onOpenChange={setOpen} />;
}
