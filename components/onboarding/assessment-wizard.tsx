"use client";

import { useReducer, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StepRoleSelection } from "./step-role-selection";
import { StepNeedsSelection } from "./step-needs-selection";
import { StepPreferences } from "./step-preferences";
import { StepAccessibility } from "./step-accessibility";
import {
  roleSchema,
  needsSchema,
  preferencesSchema,
} from "@/lib/validators";

const STEP_LABELS = [
  "Your Role",
  "Learning Needs",
  "Preferences",
  "Accessibility",
];

interface WizardState {
  currentStep: number;
  role: string;
  disabilities: string[];
  preferences: string[];
  accessibilityNeeds: {
    fontSize: string;
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };
  errors: Record<string, string>;
  submitting: boolean;
}

type Action =
  | { type: "SET_ROLE"; payload: string }
  | { type: "SET_DISABILITIES"; payload: string[] }
  | { type: "SET_PREFERENCES"; payload: string[] }
  | { type: "SET_ACCESSIBILITY"; payload: WizardState["accessibilityNeeds"] }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "SET_SUBMITTING"; payload: boolean };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.payload, errors: {} };
    case "SET_DISABILITIES":
      return { ...state, disabilities: action.payload, errors: {} };
    case "SET_PREFERENCES":
      return { ...state, preferences: action.payload, errors: {} };
    case "SET_ACCESSIBILITY":
      return { ...state, accessibilityNeeds: action.payload };
    case "NEXT_STEP":
      return { ...state, currentStep: state.currentStep + 1, errors: {} };
    case "PREV_STEP":
      return { ...state, currentStep: state.currentStep - 1, errors: {} };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
  }
}

const initialState: WizardState = {
  currentStep: 0,
  role: "",
  disabilities: [],
  preferences: [],
  accessibilityNeeds: {
    fontSize: "default",
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
  },
  errors: {},
  submitting: false,
};

export function AssessmentWizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const focusHeading = useCallback(() => {
    setTimeout(() => stepHeadingRef.current?.focus(), 100);
  }, []);

  function validateCurrentStep(): boolean {
    let result;
    switch (state.currentStep) {
      case 0:
        result = roleSchema.safeParse({ role: state.role });
        break;
      case 1:
        result = needsSchema.safeParse({ disabilities: state.disabilities });
        break;
      case 2:
        result = preferencesSchema.safeParse({ preferences: state.preferences });
        break;
      case 3:
        return true; // defaults are always valid
    }

    if (result && !result.success) {
      const firstIssue = result.error.issues[0];
      dispatch({
        type: "SET_ERRORS",
        payload: { [firstIssue.path[0] as string]: firstIssue.message },
      });
      return false;
    }
    return true;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    dispatch({ type: "NEXT_STEP" });
    focusHeading();
  }

  function handleBack() {
    dispatch({ type: "PREV_STEP" });
    focusHeading();
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;
    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const res = await fetch("/api/learning-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: state.role,
          disabilities: state.disabilities,
          preferences: state.preferences,
          accessibilityNeeds: state.accessibilityNeeds,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      router.push("/dashboard");
    } catch {
      dispatch({
        type: "SET_ERRORS",
        payload: { submit: "Something went wrong. Please try again." },
      });
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }

  const isLastStep = state.currentStep === STEP_LABELS.length - 1;
  const progressValue = ((state.currentStep + 1) / STEP_LABELS.length) * 100;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="mb-4">
          <Progress value={progressValue} aria-label={`Step ${state.currentStep + 1} of ${STEP_LABELS.length}`} />
          <nav aria-label="Wizard progress" className="mt-2">
            <ol className="flex gap-2 text-sm text-muted-foreground">
              {STEP_LABELS.map((label, i) => (
                <li
                  key={label}
                  aria-current={i === state.currentStep ? "step" : undefined}
                  className={i === state.currentStep ? "font-semibold text-foreground" : ""}
                >
                  {label}
                  {i < STEP_LABELS.length - 1 && <span className="ml-2" aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <CardTitle>
          <h2 ref={stepHeadingRef} tabIndex={-1} className="outline-none">
            {STEP_LABELS[state.currentStep]}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.currentStep === 0 && (
          <StepRoleSelection
            value={state.role}
            onChange={(v) => dispatch({ type: "SET_ROLE", payload: v })}
            error={state.errors.role}
          />
        )}
        {state.currentStep === 1 && (
          <StepNeedsSelection
            value={state.disabilities}
            onChange={(v) => dispatch({ type: "SET_DISABILITIES", payload: v })}
            error={state.errors.disabilities}
          />
        )}
        {state.currentStep === 2 && (
          <StepPreferences
            value={state.preferences}
            onChange={(v) => dispatch({ type: "SET_PREFERENCES", payload: v })}
            error={state.errors.preferences}
          />
        )}
        {state.currentStep === 3 && (
          <StepAccessibility
            value={state.accessibilityNeeds}
            onChange={(v) => dispatch({ type: "SET_ACCESSIBILITY", payload: v })}
          />
        )}
        {state.errors.submit && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {state.errors.submit}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={state.currentStep === 0}
        >
          Back
        </Button>
        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={state.submitting}>
            {state.submitting ? "Saving..." : "Complete Setup"}
          </Button>
        ) : (
          <Button onClick={handleNext}>Next</Button>
        )}
      </CardFooter>
    </Card>
  );
}
