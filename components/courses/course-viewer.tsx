"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AudioPlayer } from "./audio-player";
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

type Tab = "text" | "visual" | "video" | "interactive";

const TAB_LABELS: Record<Tab, string> = {
  text: "Text",
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
  const visualContents = contents.filter((c) => c.contentType === "VISUAL");
  const videoContents = contents.filter((c) => c.contentType === "VIDEO");
  const interactiveContents = contents.filter(
    (c) => c.contentType === "INTERACTIVE"
  );

  const availableTabs: Tab[] = ["text"];
  if (visualContents.length > 0) availableTabs.push("visual");
  if (videoContents.length > 0) availableTabs.push("video");
  if (interactiveContents.length > 0) availableTabs.push("interactive");

  const [activeTab, setActiveTab] = useState<Tab>("text");

  return (
    <div>
      {/* Tab row */}
      {availableTabs.length > 1 && (
        <nav
          aria-label="Course content formats"
          className="mb-5 border-b border-[#E5E4E1]"
        >
          <ul role="tablist" className="flex">
            {availableTabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <li key={tab} role="presentation">
                  <button
                    role="tab"
                    aria-selected={active}
                    aria-controls={`tab-panel-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex flex-col items-center px-5 pb-0 pt-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      active
                        ? "font-semibold text-[#1A1918]"
                        : "font-medium text-[#9C9B99] hover:text-[#6D6C6A]"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                    {active && (
                      <span className="mt-2 block h-0.5 w-8 rounded-full bg-[#3D8A5A]" />
                    )}
                  </button>
                </li>
              );
            })}
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
        <div className="flex flex-col gap-4">
          {textSections.map((content) => {
            const data: SectionData = JSON.parse(content.contentData);
            const metadata = JSON.parse(content.metadata || "{}");
            const isCompleted = progress[content.id]?.completed ?? false;

            return (
              <article
                key={content.id}
                className="rounded-2xl bg-white"
              >
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
                  <summary className="flex cursor-pointer items-center justify-between gap-3 p-6">
                    <span className="text-base font-semibold text-[#1A1918]">
                      {data.title}
                    </span>
                    <span className="flex items-center gap-2">
                      {isCompleted && (
                        <span
                          aria-label="Completed"
                          className="rounded-full bg-[#C8F0D8] px-2.5 py-0.5 text-xs font-semibold text-[#3D8A5A]"
                        >
                          ✓ Done
                        </span>
                      )}
                    </span>
                  </summary>

                  <div className="px-6 pb-6">
                    <div className="prose prose-sm max-w-none text-[#3D3C3A]">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {data.body}
                      </ReactMarkdown>
                    </div>

                    {data.keyTerms?.length > 0 && (
                      <details className="mt-4 rounded-xl border border-[#E5E4E1]">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#1A1918]">
                          Key Terms ({data.keyTerms.length})
                        </summary>
                        <dl className="divide-y divide-[#F5F4F1] px-4 pb-3">
                          {data.keyTerms.map((kt) => (
                            <div key={kt.term} className="py-2">
                              <dt className="text-sm font-semibold text-[#1A1918]">
                                {kt.term}
                              </dt>
                              <dd className="text-sm text-[#6D6C6A]">
                                {kt.definition}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}

                    <div className="mt-4 rounded-xl bg-[#F5F4F1] px-4 py-3">
                      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#9C9B99]">
                        Summary
                      </h3>
                      <p className="text-sm text-[#3D3C3A]">{data.summary}</p>
                    </div>

                    <div className="mt-4">
                      <AudioPlayer
                        courseId={courseId}
                        contentId={content.id}
                        transcript={stripMarkdown(data.body)}
                        cachedUrl={metadata.audioUrl}
                      />
                    </div>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </div>

      {/* Visual tab */}
      {visualContents.length > 0 && (
        <div
          id="tab-panel-visual"
          role="tabpanel"
          aria-label="Visual content"
          hidden={activeTab !== "visual"}
        >
          <div className="flex flex-col gap-6">
            {visualContents.map((content) => {
              const data = JSON.parse(content.contentData) as {
                images: Array<{
                  url: string;
                  caption: string;
                  altText: string;
                  sectionTitle: string;
                }>;
                sectionTitle: string;
              };
              return (
                <section key={content.id} className="rounded-2xl bg-white p-6">
                  <h3 className="mb-4 text-base font-semibold text-[#1A1918]">
                    {data.sectionTitle}
                  </h3>
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
          <div className="flex flex-col gap-6">
            {videoContents.map((content) => {
              const data = JSON.parse(content.contentData) as {
                videoUrl: string;
                sectionTitle: string;
              };
              return (
                <section key={content.id} className="rounded-2xl bg-white p-6">
                  <h3 className="mb-4 text-base font-semibold text-[#1A1918]">
                    {data.sectionTitle}
                  </h3>
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
          <div className="flex flex-col gap-6">
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
                <section key={content.id} className="rounded-2xl bg-white p-6">
                  <h3 className="mb-4 text-base font-semibold text-[#1A1918]">
                    {data.sectionTitle}
                  </h3>
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
