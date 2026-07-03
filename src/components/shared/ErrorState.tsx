import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "The request failed. This can be a simulated transient error — retrying is safe.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-status-error/30 bg-status-error/5 py-10 text-center">
      <AlertTriangle className="h-7 w-7 text-status-error" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
