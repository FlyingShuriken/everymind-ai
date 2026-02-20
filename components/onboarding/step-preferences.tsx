"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PREFERENCE_OPTIONS } from "@/lib/constants";

interface StepPreferencesProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function StepPreferences({ value, onChange, error }: StepPreferencesProps) {
  const errorId = "pref-error";

  function handleToggle(optionValue: string, checked: boolean) {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  }

  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold">
        How do you prefer to learn?
      </legend>
      <p className="mb-4 text-sm text-muted-foreground">
        Select all formats you enjoy. We provide content in multiple formats — this helps us prioritize.
      </p>
      <div
        className="space-y-3"
        role="group"
        aria-describedby={error ? errorId : undefined}
      >
        {PREFERENCE_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`pref-${option.value}`}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => handleToggle(option.value, !!checked)}
            />
            <Label htmlFor={`pref-${option.value}`}>{option.label}</Label>
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
