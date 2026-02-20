"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DISABILITY_OPTIONS } from "@/lib/constants";

interface StepNeedsSelectionProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function StepNeedsSelection({ value, onChange, error }: StepNeedsSelectionProps) {
  const errorId = "needs-error";

  function handleToggle(optionValue: string, checked: boolean) {
    if (optionValue === "none") {
      onChange(checked ? ["none"] : []);
    } else {
      const without = value.filter((v) => v !== "none" && v !== optionValue);
      onChange(checked ? [...without, optionValue] : without);
    }
  }

  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold">
        Do you have any disabilities or learning needs?
      </legend>
      <p className="mb-4 text-sm text-muted-foreground">
        Select all that apply. This helps us provide content in the best formats for you.
      </p>
      <div
        className="space-y-3"
        role="group"
        aria-describedby={error ? errorId : undefined}
      >
        {DISABILITY_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`need-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => handleToggle(option.value, !!checked)}
            />
            <Label htmlFor={`need-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
