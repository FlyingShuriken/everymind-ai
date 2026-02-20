export const DISABILITY_OPTIONS = [
  { value: "deaf", label: "Deaf / Hard of Hearing" },
  { value: "blind", label: "Blind" },
  { value: "low-vision", label: "Low Vision" },
  { value: "adhd", label: "ADHD" },
  { value: "dyslexia", label: "Dyslexia" },
  { value: "autism", label: "Autism Spectrum" },
  { value: "motor", label: "Motor / Physical Disability" },
  { value: "cognitive", label: "Cognitive Disability" },
  { value: "none", label: "None of the above" },
] as const;

export const PREFERENCE_OPTIONS = [
  { value: "text", label: "Text-based learning" },
  { value: "visual", label: "Visual learning (images, diagrams)" },
  { value: "audio", label: "Audio learning (lectures, podcasts)" },
  { value: "interactive", label: "Interactive learning (quizzes, exercises)" },
] as const;

export const FONT_SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "Extra Large" },
] as const;
