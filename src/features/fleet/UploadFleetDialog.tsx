import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  hasFleetOverride,
  resetFleetOverrides,
  setAccessPointsCsv,
  setConnectedDevicesCsv,
} from "@/services/fleetApi";

export function UploadFleetDialog() {
  const queryClient = useQueryClient();
  // Bump to remount the file inputs (clears the chosen filename).
  const [resetKey, setResetKey] = useState(0);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["fleet"] });

  const handleFile = async (
    file: File | undefined,
    apply: (text: string) => void,
    label: string,
  ) => {
    if (!file) return;
    try {
      apply(await file.text());
      invalidate();
      toast.success(`${label} loaded`, { description: file.name });
    } catch {
      toast.error(`Could not read ${label.toLowerCase()}`);
    }
  };

  const reset = () => {
    resetFleetOverrides();
    setResetKey((k) => k + 1);
    invalidate();
    toast.success("Reset to bundled CSVs");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload fleet CSV</DialogTitle>
          <DialogDescription>
            Replace the fleet for this session. Files are parsed in your browser — nothing is
            uploaded anywhere. Unknown columns are preserved and shown in the details panel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ap-csv">Access points CSV (parents)</Label>
            <Input
              id="ap-csv"
              key={`ap-${resetKey}`}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleFile(e.target.files?.[0], setAccessPointsCsv, "Access points")}
            />
            <p className="text-xs text-muted-foreground">
              Columns: id, name, ip, lat, lng, group, deviceStatus, heading, fov, range (+ any extras).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dev-csv">Connected devices CSV (children)</Label>
            <Input
              id="dev-csv"
              key={`dev-${resetKey}`}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleFile(e.target.files?.[0], setConnectedDevicesCsv, "Connected devices")}
            />
            <p className="text-xs text-muted-foreground">
              Columns: id, parentId, name, ip, type (+ any extras). parentId links to an access point id.
            </p>
          </div>

          {hasFleetOverride() && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              Reset to bundled CSVs
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
