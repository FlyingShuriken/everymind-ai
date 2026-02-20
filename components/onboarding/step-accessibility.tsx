"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { FONT_SIZE_OPTIONS } from "@/lib/constants";

interface AccessibilityNeeds {
  fontSize: string;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
}

interface StepAccessibilityProps {
  value: AccessibilityNeeds;
  onChange: (value: AccessibilityNeeds) => void;
}

export function StepAccessibility({ value, onChange }: StepAccessibilityProps) {
  return (
    <fieldset>
      <legend className="mb-4 text-lg font-semibold">
        Accessibility settings
      </legend>
      <p className="mb-6 text-sm text-muted-foreground">
        Customize your experience. You can change these later in your profile settings.
      </p>

      <div className="space-y-6">
        <div>
          <p className="mb-2 font-medium" id="font-size-label">Font size</p>
          <RadioGroup
            value={value.fontSize}
            onValueChange={(v) => onChange({ ...value, fontSize: v })}
            aria-labelledby="font-size-label"
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`font-${option.value}`} />
                <Label htmlFor={`font-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast">High contrast mode</Label>
          <Switch
            id="high-contrast"
            checked={value.highContrast}
            onCheckedChange={(v) => onChange({ ...value, highContrast: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reduced-motion">Reduced motion</Label>
          <Switch
            id="reduced-motion"
            checked={value.reducedMotion}
            onCheckedChange={(v) => onChange({ ...value, reducedMotion: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="screen-reader">Screen reader optimized</Label>
          <Switch
            id="screen-reader"
            checked={value.screenReaderOptimized}
            onCheckedChange={(v) => onChange({ ...value, screenReaderOptimized: v })}
          />
        </div>
      </div>
    </fieldset>
  );
}
