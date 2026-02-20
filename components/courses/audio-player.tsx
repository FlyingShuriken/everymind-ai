"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  courseId: string;
  contentId: string;
  transcript: string;
  cachedUrl?: string;
}

export function AudioPlayer({
  courseId,
  contentId,
  transcript,
  cachedUrl,
}: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(cachedUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const generateAudio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate audio");
      }
      const data = await res.json();
      setAudioUrl(data.audioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!audioUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={generateAudio}
          disabled={loading}
        >
          {loading ? "Generating audio..." : "Listen to this section"}
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {audioUrl && (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
          <div className="flex items-center gap-2">
            <label htmlFor={`speed-${contentId}`} className="text-xs">
              Speed:
            </label>
            <select
              id={`speed-${contentId}`}
              className="rounded border px-1 py-0.5 text-xs"
              defaultValue="1"
              onChange={(e) => {
                const audio = document.querySelector(
                  `audio[src="${audioUrl}"]`,
                ) as HTMLAudioElement | null;
                if (audio) audio.playbackRate = parseFloat(e.target.value);
              }}
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-xs text-muted-foreground underline underline-offset-2"
          aria-expanded={showTranscript}
        >
          {showTranscript ? "Hide transcript" : "Show transcript"}
        </button>
        {showTranscript && (
          <div className="mt-2 rounded-md bg-muted p-3 text-sm">
            {transcript}
          </div>
        )}
      </div>
    </div>
  );
}
