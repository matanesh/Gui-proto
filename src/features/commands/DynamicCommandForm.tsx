import { useEffect, useMemo, useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CommandDefinition, CommandParameters } from "@/models";

interface DynamicCommandFormProps {
  command: CommandDefinition;
  submitting: boolean;
  onSubmit: (parameters: CommandParameters) => void;
}

type FieldErrors = Record<string, string>;

function defaultsFor(command: CommandDefinition): CommandParameters {
  const values: CommandParameters = {};
  for (const field of command.configurableFields) {
    if (field.defaultValue !== null) {
      values[field.key] = field.defaultValue;
    } else if (field.type === "boolean") {
      values[field.key] = false;
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

export function DynamicCommandForm({ command, submitting, onSubmit }: DynamicCommandFormProps) {
  const initialValues = useMemo(() => defaultsFor(command), [command]);
  const [values, setValues] = useState<CommandParameters>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Reset the form whenever a different command is selected.
  useEffect(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const setValue = (key: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    for (const field of command.configurableFields) {
      const value = values[field.key];
      if (field.required && (value === "" || value === undefined)) {
        next[field.key] = `${field.label} is required.`;
        continue;
      }
      if (field.type === "number" && value !== "" && Number.isNaN(Number(value))) {
        next[field.key] = `${field.label} must be a number.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const parameters: CommandParameters = {};
    for (const field of command.configurableFields) {
      const raw = values[field.key];
      parameters[field.key] = field.type === "number" ? Number(raw) : (raw ?? "");
    }
    onSubmit(parameters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {command.configurableFields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          {field.type === "boolean" ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{field.description}</p>
                )}
              </div>
              <Switch
                id={field.key}
                checked={Boolean(values[field.key])}
                onCheckedChange={(checked) => setValue(field.key, checked)}
              />
            </div>
          ) : (
            <>
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="ml-1 text-status-error">*</span>}
              </Label>
              {field.type === "select" ? (
                <Select
                  value={String(values[field.key] ?? "")}
                  onValueChange={(v) => setValue(field.key, v)}
                >
                  <SelectTrigger id={field.key} aria-invalid={Boolean(errors[field.key])}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  value={String(values[field.key] ?? "")}
                  aria-invalid={Boolean(errors[field.key])}
                  aria-describedby={errors[field.key] ? `${field.key}-error` : undefined}
                  onChange={(e) => setValue(field.key, e.target.value)}
                />
              )}
              {field.description && !errors[field.key] && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
              {errors[field.key] && (
                <p id={`${field.key}-error`} className="text-xs text-status-error">
                  {errors[field.key]}
                </p>
              )}
            </>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={submitting || !command.enabled}>
        {submitting ? <Loader2 className="animate-spin" /> : <Rocket />}
        {submitting ? "Submitting…" : `Launch ${command.name}`}
      </Button>
    </form>
  );
}
