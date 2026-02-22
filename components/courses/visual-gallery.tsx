"use client";

interface SectionImage {
  url: string;
  caption: string;
  altText: string;
  sectionTitle: string;
}

interface VisualGalleryProps {
  sectionTitle: string;
  images: SectionImage[];
}

export function VisualGallery({ sectionTitle, images }: VisualGalleryProps) {
  if (images.length === 0) return null;

  return (
    <section aria-label={`Visual illustrations for ${sectionTitle}`} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image, i) => (
          <figure key={i} className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.altText}
              className="w-full object-cover"
              loading="lazy"
            />
            <figcaption className="px-3 py-2 text-sm text-muted-foreground">
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
