"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AudioPlayer } from "./audio-player";
import { PodcastPlayer } from "./podcast-player";
import { VisualGallery } from "./visual-gallery";
import { VideoPlayer } from "./video-player";
import { InteractiveExercises } from "./interactive-exercises";

interface SectionData {
  title: string;
  body: string;
  summary: string;
  keyTerms: { term: string; definition: string }[];
}

interface ContentItem {
  id: string;
  contentType: string;
  contentData: string;
  metadata: string;
}

interface CourseViewerProps {
  courseId: string;
  contents: ContentItem[];
  progress?: Record<string, { completed: boolean }>;
  onSectionComplete?: (contentId: string) => void;
}

type Tab = "text" | "podcast" | "visual" | "video" | "interactive";

const TAB_LABELS: Record<Tab, string> = {
  text: "Text",
  podcast: "Podcast",
  visual: "Visual",
  video: "Video",
  interactive: "Interactive",
};

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^- /gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function CourseViewer({
  courseId,
  contents,
  progress = {},
  onSectionComplete,
}: CourseViewerProps) {
  const textSections = contents.filter((c) => c.contentType === "TEXT");
  const podcastContent = contents.find((c) => c.contentType === "PODCAST");
  const visualContents = contents.filter((c) => c.contentType === "VISUAL");
  const videoContents = contents.filter((c) => c.contentType === "VIDEO");
  const interactiveContents = contents.filter((c) => c.contentType === "INTERACTIVE");

  const availableTabs: Tab[] = ["text"];
  if (podcastContent) availableTabs.push("podcast");
  if (visualContents.length > 0) availableTabs.push("visual");
  if (videoContents.length > 0) availableTabs.push("video");
  if (interactiveContents.length > 0) availableTabs.push("interactive");

  const [activeTab, setActiveTab] = useState<Tab>("text");

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      {availableTabs.length > 1 && (
        <nav aria-label="Course content formats" className="border-b">
          <ul role="tablist" className="flex gap-1">
            {availableTabs.map((tab) => (
              <li key={tab} role="presentation">
                <button
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`tab-panel-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Text tab */}
      <div
        id="tab-panel-text"
        role="tabpanel"
        aria-label="Text content"
        hidden={activeTab !== "text"}
      >
        <div className="space-y-8">
          {textSections.map((content) => {
            const data: SectionData = JSON.parse(content.contentData);
            const metadata = JSON.parse(content.metadata || "{}");

            const isCompleted = progress[content.id]?.completed ?? false;

            return (
              <article key={content.id} className="space-y-4">
                <details
                  onToggle={(e) => {
                    if (
                      e.currentTarget.open &&
                      !isCompleted &&
                      onSectionComplete
                    ) {
                      onSectionComplete(content.id);
                    }
                  }}
                >
                  <summary className="cursor-pointer text-xl font-semibold">
                    <span className="inline-flex items-center gap-2">
                      {data.title}
                      {isCompleted && (
                        <span
                          aria-label="Completed"
                          className="text-base text-green-600"
                        >
                          ✓
                        </span>
                      )}
                    </span>
                  </summary>

                  <div className="mt-4 space-y-4 pl-1">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {data.body}
                      </ReactMarkdown>
                    </div>

                    {data.keyTerms.length > 0 && (
                      <details className="rounded-md border p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Key Terms ({data.keyTerms.length})
                        </summary>
                        <dl className="mt-2 space-y-2">
                          {data.keyTerms.map((kt) => (
                            <div key={kt.term}>
                              <dt className="text-sm font-medium">{kt.term}</dt>
                              <dd className="text-sm text-muted-foreground">
                                {kt.definition}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}

                    <div className="rounded-md bg-muted p-3">
                      <h3 className="mb-1 text-sm font-medium">Summary</h3>
                      <p className="text-sm">{data.summary}</p>
                    </div>

                    <AudioPlayer
                      courseId={courseId}
                      contentId={content.id}
                      transcript={stripMarkdown(data.body)}
                      cachedUrl={metadata.audioUrl}
                    />
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </div>

      {/* Podcast tab */}
      {podcastContent && (
        <div
          id="tab-panel-podcast"
          role="tabpanel"
          aria-label="Podcast content"
          hidden={activeTab !== "podcast"}
        >
          {(() => {
            const data = JSON.parse(podcastContent.contentData) as {
              podcastUrl: string;
              courseTitle: string;
            };
            return (
              <PodcastPlayer
                podcastUrl={data.podcastUrl}
                courseTitle={data.courseTitle}
              />
            );
          })()}
        </div>
      )}

      {/* Visual tab */}
      {visualContents.length > 0 && (
        <div
          id="tab-panel-visual"
          role="tabpanel"
          aria-label="Visual content"
          hidden={activeTab !== "visual"}
        >
          <div className="space-y-8">
            {visualContents.map((content) => {
              const data = JSON.parse(content.contentData) as {
                images: Array<{ url: string; caption: string; altText: string; sectionTitle: string }>;
                sectionTitle: string;
              };
              return (
                <section key={content.id}>
                  <h3 className="mb-3 font-semibold">{data.sectionTitle}</h3>
                  <VisualGallery
                    sectionTitle={data.sectionTitle}
                    images={data.images}
                  />
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* Video tab */}
      {videoContents.length > 0 && (
        <div
          id="tab-panel-video"
          role="tabpanel"
          aria-label="Video content"
          hidden={activeTab !== "video"}
        >
          <div className="space-y-8">
            {videoContents.map((content) => {
              const data = JSON.parse(content.contentData) as {
                videoUrl: string;
                sectionTitle: string;
              };
              return (
                <section key={content.id}>
                  <h3 className="mb-3 font-semibold">{data.sectionTitle}</h3>
                  <VideoPlayer
                    videoUrl={data.videoUrl}
                    sectionTitle={data.sectionTitle}
                  />
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive tab */}
      {interactiveContents.length > 0 && (
        <div
          id="tab-panel-interactive"
          role="tabpanel"
          aria-label="Interactive exercises"
          hidden={activeTab !== "interactive"}
        >
          <div className="space-y-8">
            {interactiveContents.map((content) => {
              const data = JSON.parse(content.contentData) as {
                sectionTitle: string;
                exercises: Array<{
                  type: "fill-in-blank" | "multiple-choice" | "short-answer";
                  question: string;
                  sentence?: string;
                  options?: string[];
                  correctAnswer: string | number;
                  hint?: string;
                  explanation: string;
                }>;
              };
              return (
                <section key={content.id}>
                  <h3 className="mb-3 font-semibold">{data.sectionTitle}</h3>
                  <InteractiveExercises
                    sectionTitle={data.sectionTitle}
                    exercises={data.exercises}
                  />
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
