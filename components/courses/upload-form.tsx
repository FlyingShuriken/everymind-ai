"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface UploadFormProps {
  onSubmit: (data: {
    title: string;
    sourceType: "upload" | "topic";
    topic?: string;
    fileUrls?: string[];
  }) => void;
  loading?: boolean;
}

export function UploadForm({ onSubmit, loading }: UploadFormProps) {
  const [sourceType, setSourceType] = useState<"upload" | "topic">("topic");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError("Please enter a topic");
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
          const res = await fetch("/api/upload", { method: "POST", body: formData });
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
    });
  };

  const busy = loading || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium">
          Course Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. Introduction to Photosynthesis"
          disabled={busy}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Source Type</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sourceType"
              value="topic"
              checked={sourceType === "topic"}
              onChange={() => setSourceType("topic")}
              disabled={busy}
            />
            Topic
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sourceType"
              value="upload"
              checked={sourceType === "upload"}
              onChange={() => setSourceType("upload")}
              disabled={busy}
            />
            Upload File
          </label>
        </div>
      </fieldset>

      {sourceType === "topic" && (
        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-medium">
            Topic Description
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            rows={4}
            placeholder="Describe the topic you want to learn about..."
            disabled={busy}
          />
        </div>
      )}

      {sourceType === "upload" && (
        <div>
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop files here or click to browse"
            className={`rounded-md border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
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
            <p className="text-sm text-muted-foreground">
              Drag and drop PDF or DOCX files here, or click to browse
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
            <ul className="mt-3 space-y-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-foreground"
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

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Creating..." : "Create Course"}
      </Button>
    </form>
  );
}
