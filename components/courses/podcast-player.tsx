"use client";

interface PodcastPlayerProps {
  podcastUrl: string;
  courseTitle: string;
}

export function PodcastPlayer({ podcastUrl, courseTitle }: PodcastPlayerProps) {
  return (
    <section aria-label={`Podcast for ${courseTitle}`} className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-medium">Full Course Podcast</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          An AI-generated conversational podcast covering the entire course content.
        </p>
        <audio
          controls
          className="w-full"
          src={podcastUrl}
          aria-label={`Podcast audio for ${courseTitle}`}
        />
        <a
          href={podcastUrl}
          download
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          aria-label={`Download podcast for ${courseTitle}`}
        >
          Download podcast
        </a>
      </div>
    </section>
  );
}
