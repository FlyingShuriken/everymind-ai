"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DISABILITY_OPTIONS, PREFERENCE_OPTIONS, FONT_SIZE_OPTIONS } from "@/lib/constants";

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
    if (res.ok) {
      setProfiles(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/student-profiles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: StudentProfile[]) => {
        setProfiles(data);
        setLoading(false);
      })
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
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
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
    if (!confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/student-profiles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Student Profiles</h1>
      <p className="mb-8 text-muted-foreground">
        Create named profiles for student groups (e.g., &ldquo;ADHD Class&rdquo;, &ldquo;Deaf Students&rdquo;). Select a profile when creating a course to adapt AI-generated content for that group.
      </p>

      {showForm && (
        <section
          aria-label={editingId ? "Edit student profile" : "New student profile"}
          className="mb-8 rounded-lg border p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">
            {editingId ? "Edit Student Profile" : "New Student Profile"}
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="prof-name" className="mb-1 block text-sm font-medium">
                Profile Name <span aria-hidden>*</span>
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="e.g. ADHD Class, Deaf Students, Dyslexia Group"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="prof-desc" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <input
                id="prof-desc"
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Short description of this student group"
                disabled={saving}
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Disabilities / Learning Needs</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DISABILITY_OPTIONS.filter((o) => o.value !== "none").map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.disabilities.includes(option.value)}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          disabilities: toggleArrayItem(f.disabilities, option.value),
                        }))
                      }
                      disabled={saving}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Learning Preferences</legend>
              <div className="grid grid-cols-2 gap-2">
                {PREFERENCE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.preferences.includes(option.value)}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          preferences: toggleArrayItem(f.preferences, option.value),
                        }))
                      }
                      disabled={saving}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-medium">Accessibility Settings</legend>
              <div className="space-y-3">
                <div>
                  <label htmlFor="prof-fontsize" className="mb-1 block text-sm">
                    Font Size
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
                    className="rounded-md border px-3 py-2 text-sm"
                    disabled={saving}
                  >
                    {FONT_SIZE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.accessibilityNeeds.highContrast}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        accessibilityNeeds: {
                          ...f.accessibilityNeeds,
                          highContrast: e.target.checked,
                        },
                      }))
                    }
                    disabled={saving}
                  />
                  High contrast mode
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.accessibilityNeeds.reducedMotion}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        accessibilityNeeds: {
                          ...f.accessibilityNeeds,
                          reducedMotion: e.target.checked,
                        },
                      }))
                    }
                    disabled={saving}
                  />
                  Reduced motion
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.accessibilityNeeds.screenReaderOptimized}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        accessibilityNeeds: {
                          ...f.accessibilityNeeds,
                          screenReaderOptimized: e.target.checked,
                        },
                      }))
                    }
                    disabled={saving}
                  />
                  Screen reader optimized content
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Output Formats</legend>
              <p className="mb-2 text-xs text-muted-foreground">
                Select which additional content formats to generate when creating courses with this profile. Text is always generated.
              </p>
              <div className="space-y-2">
                {OUTPUT_MODE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.outputModes.includes(option.value)}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          outputModes: toggleArrayItem(f.outputModes, option.value) as OutputMode[],
                        }))
                      }
                      disabled={saving}
                    />
                    <span>
                      <span className="font-medium">{option.label}</span>
                      {" — "}
                      <span className="text-muted-foreground">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                disabled={saving}
              />
              Set as default profile
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {!showForm && (
        <Button onClick={startCreate} className="mb-6">
          New Student Profile
        </Button>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <p className="text-muted-foreground">
          No profiles yet. Create one to customize AI course generation for specific student groups.
        </p>
      ) : (
        <ul className="space-y-4">
          {profiles.map((profile) => (
            <li key={profile.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{profile.name}</h3>
                    {profile.isDefault && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  {profile.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{profile.description}</p>
                  )}
                  {profile.disabilities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profile.disabilities.map((d) => {
                        const option = DISABILITY_OPTIONS.find((o) => o.value === d);
                        return (
                          <span key={d} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            {option?.label ?? d}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {profile.preferences.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profile.preferences.map((p) => {
                        const option = PREFERENCE_OPTIONS.find((o) => o.value === p);
                        return (
                          <span key={p} className="rounded bg-muted px-2 py-0.5 text-xs">
                            {option?.label ?? p}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {profile.outputModes?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profile.outputModes.map((m) => {
                        const option = OUTPUT_MODE_OPTIONS.find((o) => o.value === m);
                        return (
                          <span key={m} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                            {option?.label ?? m}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(profile)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
