"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface StudentProfile {
  id: string;
  name: string;
  description?: string;
  disabilities: string[];
  preferences: string[];
  isDefault: boolean;
}

interface NewCourseFormProps {
  onSubmit: (data: {
    title: string;
    sourceType: "upload" | "topic";
    topic?: string;
    fileUrls?: string[];
    studentProfileId?: string;
  }) => void;
  loading?: boolean;
  isTeacher?: boolean;
}

const INFO_ITEMS = [
  "Structured text with key terms",
  "Visual diagram gallery",
  "Interactive exercises & quiz",
  "Section-by-section audio",
  "Personalised for your learner",
];

export function NewCourseForm({
  onSubmit,
  loading,
  isTeacher,
}: NewCourseFormProps) {
  const [sourceType, setSourceType] = useState<"upload" | "topic">("topic");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  useEffect(() => {
    if (!isTeacher) return;
    fetch("/api/student-profiles")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: StudentProfile[]) => {
        setProfiles(data);
        const defaultProfile = data.find((p) => p.isDefault);
        if (defaultProfile) setSelectedProfileId(defaultProfile.id);
      })
      .catch(() => {});
  }, [isTeacher]);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    if (valid.length === 0) {
      setError("Only PDF and DOCX files are supported");
      return;
    }
    const tooLarge = valid.find((f) => f.size > 25 * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" exceeds 25MB limit`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a course title");
      return;
    }
    if (sourceType === "topic" && !topic.trim()) {
      setError("Please describe the topic");
      return;
    }
    if (sourceType === "upload" && files.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    let fileUrls: string[] | undefined;

    if (sourceType === "upload") {
      setUploading(true);
      try {
        fileUrls = [];
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
          }
          const data = await res.json();
          fileUrls.push(data.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      title: title.trim(),
      sourceType,
      topic: sourceType === "topic" ? topic.trim() : undefined,
      fileUrls,
      studentProfileId:
        isTeacher && selectedProfileId ? selectedProfileId : undefined,
    });
  };

  const busy = loading || uploading;

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-8">
        {/* Left column — form */}
        <div className="flex w-160 flex-shrink-0 flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="course-title"
              className="text-sm font-semibold text-[#1A1918]"
            >
              Course title
            </label>
            <input
              id="course-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Photosynthesis"
              disabled={busy}
              className="rounded-xl border border-[#E5E4E1] bg-white px-4 py-3.5 text-sm text-[#1A1918] placeholder-[#9C9B99] outline-none transition-colors focus:border-[#3D8A5A] focus:ring-2 focus:ring-[#EBF7F0] disabled:opacity-50"
            />
          </div>

          {/* Source type */}
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-semibold text-[#1A1918]">
              Content source
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setSourceType("topic")}
                disabled={busy}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  sourceType === "topic"
                    ? "bg-[#EBF7F0] text-[#3D8A5A]"
                    : "bg-white border border-[#E5E4E1] text-[#6D6C6A] hover:bg-[#F5F4F1]"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full border-2 ${
                    sourceType === "topic"
                      ? "border-[#3D8A5A] bg-[#3D8A5A]"
                      : "border-[#D1D0CD]"
                  }`}
                />
                Topic
              </button>
              <button
                type="button"
                onClick={() => setSourceType("upload")}
                disabled={busy}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  sourceType === "upload"
                    ? "bg-[#EBF7F0] text-[#3D8A5A]"
                    : "bg-white border border-[#E5E4E1] text-[#6D6C6A] hover:bg-[#F5F4F1]"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full border-2 ${
                    sourceType === "upload"
                      ? "border-[#3D8A5A] bg-[#3D8A5A]"
                      : "border-[#D1D0CD]"
                  }`}
                />
                Upload File
              </button>
            </div>
          </div>

          {/* Topic textarea */}
          {sourceType === "topic" && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="topic"
                className="text-sm font-semibold text-[#1A1918]"
              >
                Topic
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={5}
                placeholder="Describe the topic you want to learn about…"
                disabled={busy}
                className="resize-none rounded-xl border border-[#E5E4E1] bg-white px-4 py-3.5 text-sm text-[#1A1918] placeholder-[#9C9B99] outline-none transition-colors focus:border-[#3D8A5A] focus:ring-2 focus:ring-[#EBF7F0] disabled:opacity-50"
              />
            </div>
          )}

          {/* File upload */}
          {sourceType === "upload" && (
            <div className="flex flex-col gap-3">
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop files here or click to browse"
                className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                  dragOver
                    ? "border-[#3D8A5A] bg-[#EBF7F0]"
                    : "border-[#E5E4E1] hover:border-[#D1D0CD]"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <p className="text-sm text-[#9C9B99]">
                  Drag and drop PDF or DOCX files here, or{" "}
                  <span className="font-medium text-[#3D8A5A]">browse</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  multiple
                  className="sr-only"
                  onChange={(e) => handleFiles(e.target.files)}
                  aria-label="Upload files"
                />
              </div>
              {files.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-[#E5E4E1] px-4 py-3 text-sm"
                    >
                      <span className="text-[#1A1918]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-[#9C9B99] hover:text-[#6D6C6A] transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Student profile (teachers only) */}
          {isTeacher && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="student-profile"
                className="text-sm font-semibold text-[#1A1918]"
              >
                Student profile
              </label>
              <p className="text-xs text-[#9C9B99]">
                Select the student group this course is designed for.
              </p>
              <select
                id="student-profile"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="rounded-xl border border-[#E5E4E1] bg-white px-4 py-3.5 text-sm text-[#1A1918] outline-none transition-colors focus:border-[#3D8A5A] disabled:opacity-50"
                disabled={busy}
              >
                <option value="">No specific profile</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.description ? ` — ${p.description}` : ""}
                  </option>
                ))}
              </select>
              <Link
                href="/dashboard/settings"
                className="text-xs text-[#3D8A5A] hover:underline"
              >
                Manage student profiles →
              </Link>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-[#3D8A5A] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Generate course"}
          </button>
        </div>

        {/* Right column — info panel */}
        <div className="flex-1">
          <div className="rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-[#1A1918]">
              What gets generated
            </h3>
            <div className="flex flex-col gap-3">
              {INFO_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#3D8A5A]" />
                  <span className="text-sm text-[#6D6C6A]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
