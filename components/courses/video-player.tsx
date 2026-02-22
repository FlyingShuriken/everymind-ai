"use client";

interface VideoPlayerProps {
  videoUrl: string;
  sectionTitle: string;
}

export function VideoPlayer({ videoUrl, sectionTitle }: VideoPlayerProps) {
  return (
    <section aria-label={`Video for ${sectionTitle}`} className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <video
          controls
          preload="metadata"
          className="w-full"
          aria-label={`Explainer video for ${sectionTitle}`}
        >
          <source src={videoUrl} type="video/mp4" />
          <p>Your browser does not support video playback.</p>
        </video>
      </div>
      <p className="text-xs text-muted-foreground">
        AI-generated video for: {sectionTitle}
      </p>
    </section>
  );
}
