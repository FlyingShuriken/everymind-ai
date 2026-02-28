"use client";

import { useEffect, useState } from "react";
import { DISABILITY_OPTIONS, PREFERENCE_OPTIONS, FONT_SIZE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type OutputMode = "visual" | "video" | "interactive";

const OUTPUT_MODE_OPTIONS: { value: OutputMode; label: string; description: string }[] = [
  { value: "visual", label: "Visual", description: "AI-generated illustrations for each section" },
  { value: "video", label: "Video", description: "Short explainer videos per section" },
  { value: "interactive", label: "Interactive", description: "Embedded exercises and activities" },
];

interface StudentProfile {
  id: string;
  name: string;
  description?: string;
  disabilities: string[];
  preferences: string[];
  accessibilityNeeds: {
    fontSize: string;
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };
  outputModes: OutputMode[];
  isDefault: boolean;
}

type FormState = {
  name: string;
  description: string;
  disabilities: string[];
  preferences: string[];
  accessibilityNeeds: {
    fontSize: string;
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };
  outputModes: OutputMode[];
  isDefault: boolean;
};

const defaultForm: FormState = {
  name: "",
  description: "",
  disabilities: [],
  preferences: [],
  accessibilityNeeds: {
    fontSize: "default",
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
  },
  outputModes: [],
  isDefault: false,
};

function TogglePill({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        checked
          ? "bg-[#EBF7F0] text-[#3D8A5A]"
          : "bg-[#F5F4F1] text-[#6D6C6A] hover:bg-[#ECEAE7]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#9C9B99]">
      {children}
    </p>
  );
}

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfiles() {
    const res = await fetch("/api/student-profiles");
    if (res.ok) setProfiles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/student-profiles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: StudentProfile[]) => { setProfiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(profile: StudentProfile) {
    setEditingId(profile.id);
    setForm({
      name: profile.name,
      description: profile.description ?? "",
      disabilities: profile.disabilities,
      preferences: profile.preferences,
      accessibilityNeeds: profile.accessibilityNeeds,
      outputModes: profile.outputModes ?? [],
      isDefault: profile.isDefault,
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
    setError(null);
  }

  function toggleArrayItem(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Profile name is required"); return; }
    setSaving(true);
    setError(null);

    const url = editingId ? `/api/student-profiles/${editingId}` : "/api/student-profiles";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Failed to save profile");
      setSaving(false);
      return;
    }

    await fetchProfiles();
    cancelForm();
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/student-profiles/${id}`, { method: "DELETE" });
    if (res.ok) setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="px-14 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1A1918]">Student Profiles</h1>
          <p className="mt-1 text-sm text-[#9C9B99]">
            Customize AI-generated content for specific student groups
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="flex items-center gap-2 rounded-full bg-[#3D8A5A] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + New profile
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl bg-white p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1918]">
              {editingId ? "Edit Profile" : "New Student Profile"}
            </h2>
            <button
              type="button"
              onClick={cancelForm}
              className="text-sm text-[#9C9B99] hover:text-[#6D6C6A]"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Name & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="mb-1.5 block text-sm font-medium text-[#1A1918]">
                  Profile name <span className="text-[#3D8A5A]">*</span>
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-[#E5E4E1] bg-[#F5F4F1] px-4 py-2.5 text-sm text-[#1A1918] outline-none transition-colors placeholder:text-[#C1C0BE] focus:border-[#3D8A5A] focus:bg-white"
                  placeholder="e.g. ADHD Class, Deaf Students"
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="prof-desc" className="mb-1.5 block text-sm font-medium text-[#1A1918]">
                  Description
                </label>
                <input
                  id="prof-desc"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-[#E5E4E1] bg-[#F5F4F1] px-4 py-2.5 text-sm text-[#1A1918] outline-none transition-colors placeholder:text-[#C1C0BE] focus:border-[#3D8A5A] focus:bg-white"
                  placeholder="Short description of this group"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#F0EFED]" />

            {/* Learning Needs */}
            <div>
              <SectionLabel>Learning Needs</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {DISABILITY_OPTIONS.filter((o) => o.value !== "none").map((option) => (
                  <TogglePill
                    key={option.value}
                    label={option.label}
                    checked={form.disabilities.includes(option.value)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        disabilities: toggleArrayItem(f.disabilities, option.value),
                      }))
                    }
                    disabled={saving}
                  />
                ))}
              </div>
            </div>

            {/* Learning Preferences */}
            <div>
              <SectionLabel>Learning Preferences</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((option) => (
                  <TogglePill
                    key={option.value}
                    label={option.label}
                    checked={form.preferences.includes(option.value)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        preferences: toggleArrayItem(f.preferences, option.value),
                      }))
                    }
                    disabled={saving}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#F0EFED]" />

            {/* Accessibility */}
            <div>
              <SectionLabel>Accessibility</SectionLabel>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="prof-fontsize" className="mb-1.5 block text-sm font-medium text-[#1A1918]">
                    Font size
                  </label>
                  <select
                    id="prof-fontsize"
                    value={form.accessibilityNeeds.fontSize}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        accessibilityNeeds: { ...f.accessibilityNeeds, fontSize: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-[#E5E4E1] bg-[#F5F4F1] px-4 py-2.5 text-sm text-[#1A1918] outline-none focus:border-[#3D8A5A] focus:bg-white"
                    disabled={saving}
                  >
                    {FONT_SIZE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-3 pt-1">
                  {[
                    { key: "highContrast", label: "High contrast mode" },
                    { key: "reducedMotion", label: "Reduced motion" },
                    { key: "screenReaderOptimized", label: "Screen reader optimized" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3">
                      <div
                        className={cn(
                          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                          form.accessibilityNeeds[key as keyof typeof form.accessibilityNeeds]
                            ? "border-[#3D8A5A] bg-[#3D8A5A]"
                            : "border-[#D1D0CD] bg-white"
                        )}
                        onClick={() =>
                          !saving &&
                          setForm((f) => ({
                            ...f,
                            accessibilityNeeds: {
                              ...f.accessibilityNeeds,
                              [key]: !f.accessibilityNeeds[key as keyof typeof f.accessibilityNeeds],
                            },
                          }))
                        }
                      >
                        {form.accessibilityNeeds[key as keyof typeof form.accessibilityNeeds] && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-[#6D6C6A]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Formats */}
            <div>
              <SectionLabel>Output Formats</SectionLabel>
              <p className="mb-3 text-xs text-[#9C9B99]">
                Additional content formats generated alongside text.
              </p>
              <div className="flex flex-wrap gap-2">
                {OUTPUT_MODE_OPTIONS.map((option) => (
                  <TogglePill
                    key={option.value}
                    label={option.label}
                    checked={form.outputModes.includes(option.value)}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        outputModes: toggleArrayItem(f.outputModes, option.value) as OutputMode[],
                      }))
                    }
                    disabled={saving}
                  />
                ))}
              </div>
            </div>

            {/* Default toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <div
                className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                  form.isDefault ? "border-[#3D8A5A] bg-[#3D8A5A]" : "border-[#D1D0CD] bg-white"
                )}
                onClick={() => !saving && setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
              >
                {form.isDefault && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#6D6C6A]">Set as default profile</span>
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#3D8A5A] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                className="rounded-full border border-[#E5E4E1] px-6 py-2.5 text-sm font-semibold text-[#6D6C6A] transition-colors hover:bg-[#F5F4F1]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : profiles.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E4E1] py-24 text-center">
          <h3 className="mb-2 text-lg font-semibold text-[#1A1918]">No profiles yet</h3>
          <p className="mb-6 text-sm text-[#9C9B99]">
            Create a profile to adapt AI content for specific student groups
          </p>
          <button
            onClick={startCreate}
            className="rounded-full bg-[#3D8A5A] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + New profile
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {profiles.map((profile) => (
            <li key={profile.id} className="rounded-2xl bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Name + default badge */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#1A1918]">{profile.name}</h3>
                    {profile.isDefault && (
                      <span className="rounded-full bg-[#EBF7F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D8A5A]">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {profile.description && (
                    <p className="mt-1 text-sm text-[#9C9B99]">{profile.description}</p>
                  )}

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.disabilities.map((d) => {
                      const option = DISABILITY_OPTIONS.find((o) => o.value === d);
                      return (
                        <span key={d} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                          {option?.label ?? d}
                        </span>
                      );
                    })}
                    {profile.preferences.map((p) => {
                      const option = PREFERENCE_OPTIONS.find((o) => o.value === p);
                      return (
                        <span key={p} className="rounded-full bg-[#F5F4F1] px-2.5 py-0.5 text-xs font-medium text-[#6D6C6A]">
                          {option?.label ?? p}
                        </span>
                      );
                    })}
                    {profile.outputModes?.map((m) => {
                      const option = OUTPUT_MODE_OPTIONS.find((o) => o.value === m);
                      return (
                        <span key={m} className="rounded-full bg-[#EBF7F0] px-2.5 py-0.5 text-xs font-medium text-[#3D8A5A]">
                          {option?.label ?? m}
                        </span>
                      );
                    })}
                    {profile.disabilities.length === 0 &&
                      profile.preferences.length === 0 &&
                      (profile.outputModes?.length ?? 0) === 0 && (
                        <span className="text-xs text-[#C1C0BE]">No settings configured</span>
                      )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => startEdit(profile)}
                    className="rounded-full border border-[#E5E4E1] px-4 py-1.5 text-sm font-medium text-[#6D6C6A] transition-colors hover:bg-[#F5F4F1]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="rounded-full border border-[#E5E4E1] px-4 py-1.5 text-sm font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
