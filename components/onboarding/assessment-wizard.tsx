"use client";

import { useReducer, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  "Your role",
  "Learning needs",
  "Your learning preferences",
  "Accessibility",
];

const STEP_SUBTITLES = [
  "Are you a student or a teacher?",
  "Do you have any specific learning needs? Select all that apply.",
  "How do you learn best? Select all that apply.",
  "Set your accessibility preferences.",
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
        result = preferencesSchema.safeParse({
          preferences: state.preferences,
        });
        break;
      case 3:
        return true;
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

  const totalSteps = STEP_LABELS.length;
  const isLastStep = state.currentStep === totalSteps - 1;

  return (
    <div className="w-full max-w-[600px] rounded-3xl bg-white p-12">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-6 rounded-full transition-colors ${
              i <= state.currentStep ? "bg-[#3D8A5A]" : "bg-[#E5E4E1]"
            }`}
          />
        ))}
        <span className="ml-2 text-xs font-medium text-[#9C9B99]">
          Step {state.currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Heading */}
      <h1
        ref={stepHeadingRef}
        tabIndex={-1}
        className="mb-2 text-[26px] font-bold text-[#1A1918] outline-none"
      >
        {STEP_LABELS[state.currentStep]}
      </h1>
      <p className="mb-8 text-[15px] text-[#6D6C6A]">
        {STEP_SUBTITLES[state.currentStep]}
      </p>

      {/* Step content */}
      <div className="mb-8">
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
            onChange={(v) =>
              dispatch({ type: "SET_DISABILITIES", payload: v })
            }
            error={state.errors.disabilities}
          />
        )}
        {state.currentStep === 2 && (
          <StepPreferences
            value={state.preferences}
            onChange={(v) =>
              dispatch({ type: "SET_PREFERENCES", payload: v })
            }
            error={state.errors.preferences}
          />
        )}
        {state.currentStep === 3 && (
          <StepAccessibility
            value={state.accessibilityNeeds}
            onChange={(v) =>
              dispatch({ type: "SET_ACCESSIBILITY", payload: v })
            }
          />
        )}
        {state.errors.submit && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {state.errors.submit}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={state.currentStep === 0}
          className="rounded-full bg-[#F5F4F1] px-6 py-3 text-sm font-medium text-[#6D6C6A] transition-colors hover:bg-[#E5E4E1] disabled:opacity-0"
        >
          Back
        </button>
        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state.submitting}
            className="rounded-full bg-[#3D8A5A] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {state.submitting ? "Saving…" : "Complete setup"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-[#3D8A5A] px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Next step →
          </button>
        )}
      </div>
    </div>
  );
}
