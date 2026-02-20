"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface StepRoleSelectionProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function StepRoleSelection({ value, onChange, error }: StepRoleSelectionProps) {
  const errorId = "role-error";

  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold">
        What is your role?
      </legend>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        aria-describedby={error ? errorId : undefined}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="STUDENT" id="role-student" />
          <Label htmlFor="role-student">Student</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="TEACHER" id="role-teacher" />
          <Label htmlFor="role-teacher">Teacher</Label>
        </div>
      </RadioGroup>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
