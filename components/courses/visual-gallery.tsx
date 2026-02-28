"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

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
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const slides = images.map((img) => ({
    src: img.url,
    alt: img.altText,
    title: img.sectionTitle,
    description: img.caption,
  }));

  return (
    <section aria-label={`Visual illustrations for ${sectionTitle}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image, i) => (
          <figure key={i} className="group overflow-hidden rounded-xl border border-[#E5E4E1]">
            <button
              type="button"
              onClick={() => { setIndex(i); setOpen(true); }}
              className="relative block w-full cursor-zoom-in overflow-hidden"
              aria-label={`View ${image.altText} fullscreen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.altText}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
                  <svg className="h-4 w-4 text-[#1A1918]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </button>
            <figcaption className="px-4 py-2.5 text-sm text-[#6D6C6A]">
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Captions, Zoom]}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        captions={{ showToggle: false, descriptionMaxLines: 3 }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
        }}
      />
    </section>
  );
}
