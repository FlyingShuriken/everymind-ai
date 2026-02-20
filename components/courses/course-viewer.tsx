"use client";

import { AudioPlayer } from "./audio-player";

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
}

export function CourseViewer({ courseId, contents }: CourseViewerProps) {
  const textSections = contents.filter((c) => c.contentType === "TEXT");

  return (
    <div className="space-y-8">
      {textSections.map((content) => {
        const data: SectionData = JSON.parse(content.contentData);
        const metadata = JSON.parse(content.metadata || "{}");

        return (
          <article key={content.id} className="space-y-4">
            <details open>
              <summary className="cursor-pointer text-xl font-semibold">
                {data.title}
              </summary>

              <div className="mt-4 space-y-4 pl-1">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(data.body),
                  }}
                />

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
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, "<p>$1</p>");
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^- /gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
