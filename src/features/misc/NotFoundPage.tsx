import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-primary/10 p-4 text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight">Page not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The route you requested does not exist in this console.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
