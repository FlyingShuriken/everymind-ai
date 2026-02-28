# EveryMind.ai

**An AI-powered, accessibility-first educational platform for students with disabilities and diverse learning preferences.**

---

## The Problem

Students with disabilities — including dyslexia, ADHD, blindness, deafness, and other learning differences — often encounter educational materials that simply don't work for them. Most learning platforms treat accessibility as an afterthought, bolting on accommodations after the fact. Teachers, meanwhile, lack efficient tools to create truly inclusive content for the diverse needs of their students.

The result: a persistent and unnecessary educational gap between students with disabilities and their peers.

---

## The Solution

EveryMind.ai is an end-to-end platform that:

1. **Assesses** student learning profiles — disabilities, preferences, and specific accessibility needs
2. **Accepts** learning materials — upload PDFs, DOCX files, or enter a topic
3. **Generates** personalized courses automatically in multiple formats
4. **Delivers** content in the format that works best for each student

The same material becomes a structured text course, audio narration, visual illustrations, short video explainers, and interactive exercises — all generated automatically and tailored to the student's profile.

---

## Key Differentiators

Unlike existing adaptive learning platforms (DreamBox, Knewton, Coursebox, eduMe), EveryMind.ai is:

| Feature       | Most Platforms                      | EveryMind.ai                                |
| ------------- | ----------------------------------- | ------------------------------------------- |
| Accessibility | Add-on afterthought                 | Designed from day one                       |
| Scope         | Single purpose (convert OR deliver) | End-to-end (assess -> generate -> deliver)  |
| Content       | Converts existing materials         | Generates multimodal formats from any input |
| Users         | Students OR teachers                | Both, in a single platform                  |
| Science       | Often based on learning styles myth | Grounded in UDL research                    |

---

## Research Foundation

### Universal Design for Learning (UDL)

EveryMind.ai is built on the UDL framework — a research-backed approach supported by modern neuroscience and systematic academic reviews. UDL provides:

- **Multiple means of representation** — offering choice in how learners access content
- **Multiple means of action & expression** — options for demonstrating knowledge
- **Multiple means of engagement** — diverse ways to motivate learners

### Why Not "Learning Styles"?

Despite widespread belief in visual/auditory/kinesthetic learning styles, the research is clear: **matching teaching methods to a student's preferred style provides essentially no benefit** (effect size d = 0.04 across a meta-analysis of 31 studies; less than 30% of education academics consider learning styles theory evidence-based).

EveryMind.ai does not restrict content based on assumed styles. Instead, it provides multimodal content to every student — which research shows benefits everyone, especially students with disabilities.

---

## Who It's For

**Students** with:

- Dyslexia — text simplification, audio narration, multimodal content
- ADHD — structured pacing, interactive quizzes, clear progress tracking
- Visual impairments — screen reader-compatible content, audio-first delivery
- Hearing impairments — visual-first content, captioning-ready text output
- Other learning disabilities — personalized profiles, flexible content formats

**Teachers** who want to:

- Upload existing materials and get accessible versions automatically
- Create student profiles with specific disabilities and output mode preferences
- Deliver content in multiple formats without manual reformatting

---

## How It Works

### For Students

1. Sign up and complete a short onboarding assessment (disabilities, preferences, accessibility needs)
2. Browse courses created by teachers or generate your own from any topic
3. Learn through text, audio narration, podcasts, images, videos, and interactive exercises
4. Take quizzes and track progress across all content

### For Teachers

1. Create student profiles with specific disabilities, preferences, and output modes (Settings)
2. Upload PDFs or DOCX files — lecture notes, textbooks, handouts
3. The platform extracts content and generates a full structured course
4. Students receive content in their accessible formats automatically
5. Share courses via link

### The Generation Pipeline

```
Upload PDF / DOCX  (or enter topic string)
        │
        ▼
Stage 1 — Document Extraction
  ├─ PDF: pages → base64 image data URLs → Gemini vision (4 pages/chunk)
  │        chunk summaries → collapsed to master document summary
  └─ DOCX: mammoth plain text extraction
        │
        ▼
Stage 2 — Course Structuring
  └─ Gemini generates course outline: 5–8 sections with titles + learning objectives
        │
        ▼
Stage 3 — Content Expansion (per section, adapted to student disability profile)
  └─ Gemini expands each section in parallel → full markdown content
        │
        ▼
Stage 4 — Multimodal Asset Generation (concurrent, based on outputModes)
  ├─ Gemini TTS: per-section audio narration (always)
  ├─ Gemini: quiz generation (5–10 questions)
  ├─ Gemini: interactive exercises (fill-in-blank, MCQ, short answer) — if "interactive"
  ├─ Imagen 4.0 Fast: 1 illustration per section (concurrency 2) — if "visual"
  └─ Veo 3.1 Fast: 8-second video per section (concurrency 1) — if "video"
        │
        ▼
All assets → Firebase Storage
Content rows → Firestore courses/{id}/contents
Course status → READY
```

### Disability-Specific Content Adaptation

The student's disability profile is injected into every Gemini content generation prompt. The model adapts its output accordingly:

| Disability           | Content Adaptations                                                            |
| -------------------- | ------------------------------------------------------------------------------ |
| Dyslexia             | Shorter paragraphs, simpler vocabulary, clearer structure                      |
| ADHD                 | Bullet-point sections, explicit objectives, structured pacing                  |
| Blindness            | Screen-reader-optimised text, descriptive headings, no visual-only information |
| Deafness             | Visual-first content, no audio-only information                                |
| Cognitive disability | Simplified language, repetition, reinforcement exercises                       |

### Output Mode Mapping

The `outputModes` field on a student profile drives which generators activate in Stage 4. TTS narration is always generated.

| Disability             | Recommended outputModes     | Rationale                                  |
| ---------------------- | --------------------------- | ------------------------------------------ |
| Deaf / hard of hearing | `visual`, `interactive`     | Avoids audio dependency                    |
| Blind / low vision     | _(TTS always on)_           | Full audio pipeline                        |
| ADHD                   | `interactive`, `visual`     | Short exercise loops, visual anchors       |
| Dyslexia               | _(TTS always on)_, `visual` | Audio supports reading; visuals aid memory |
| General                | Any combination             | UDL: choice empowers all learners          |

---

## Technical Architecture

### System Overview

```
Browser (User)
  └─> Next.js Frontend (Vercel)
        └─> Clerk (Authentication)
              └─> Next.js API Routes (Vercel Serverless)
                    ├─> Firebase Firestore (Admin SDK)  — structured data
                    ├─> Firebase Cloud Storage          — generated media assets
                    └─> Google Vertex AI
                          ├─> Gemini 3 Flash Preview    — text, quiz, interactive, PDF vision
                          ├─> Gemini 2.5 Flash TTS      — per-section audio narration
                          ├─> Imagen 4.0 Fast           — educational illustrations
                          └─> Veo 3.1 Fast              — short explainer videos
```

### Google Products

EveryMind.ai is built entirely on Google's ecosystem. **Vertex AI** serves as the unified platform hosting all AI models — text generation, TTS, image, and video — via the single `@google/genai` SDK, with one GCP project and one billing account. **Firebase** (Firestore + Cloud Storage) handles all data and media storage on the same GCP infrastructure, sharing the same service account credentials. This unified Google stack eliminates multi-provider complexity and ensures seamless interoperability across every layer of the platform.

**Google AI Technology — Vertex AI:**

| Service                | Model ID                                 | Role                                                     |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Gemini 3 Flash Preview | `gemini-3-flash-preview`                 | Text generation, quiz, interactive exercises, PDF vision |
| Gemini 2.5 Flash TTS   | `gemini-2.5-flash-tts`                   | Per-section audio narration                              |
| Imagen 4.0 Fast        | `imagen-4.0-fast-generate-preview-06-06` | Educational illustrations                                |
| Veo 3.1 Fast           | `veo-3.1-fast-generate-001`              | Explainer videos                                         |

**Google Developer Tools — Firebase:**

| Service                | Role                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Firebase Firestore     | Primary database — all users, courses, content, progress       |
| Firebase Cloud Storage | Media asset store — audio (WAV/MP3), images (PNG), video (MP4) |

### Accessibility Stack

- **shadcn/ui** — built on Radix UI primitives, WAI-ARIA compliant by default
- **eslint-plugin-jsx-a11y** — accessibility linting
- **@axe-core/react** — runtime accessibility testing in development (console warnings)
- **WCAG 2.2** — target compliance (4.5:1 contrast, POUR principles)
- **Semantic HTML first** — native elements over custom ARIA widgets
- **VoiceOver / NVDA** — tested across major screen readers

---

## Challenges Faced

### PDF Content Extraction Loses Visual Information

**Problem:** Standard text extraction (`pdf-parse`) strips all visual content from PDFs — diagrams, charts, tables, mathematical equations — which are critical in educational materials.

**Solution:** Switched to a Gemini vision pipeline. PDF pages are converted to base64 image data URLs and sent to Gemini's multimodal vision API. Pages are batched in groups of 4 → each batch summarised → summaries collapsed to a master document summary → master summary feeds course generation.

**Result:** Generated courses faithfully reflect the full content of uploaded PDFs, including all diagrams, tables, and equations.

### Audio Alone Was Not Engaging Enough

**Problem:** The first iteration produced plain text with basic TTS narration. Feedback from r/ADHD and r/Dyslexia communities was consistent: robotic monotone narration of dense paragraphs failed to hold attention.

**Solution:** Added Veo video generation and Imagen illustrations after users confirmed visual explainers significantly improved retention.

**Result:** The platform grew from a text + audio tool into a five-format multimodal platform driven directly by user feedback.

### Fragmentation Was the Real Pain Point

**Problem:** Users commonly relied on 3–5 separate tools to get through a single piece of content — a PDF reader, TTS app, summariser, quiz generator. Adding another single-purpose tool would not address this.

**Solution:** Consolidated the entire learning pipeline — content generation, multimodal delivery, interactive exercises, quizzes, and progress tracking — into a single unified platform.

**Result:** Students go from uploading a document to completing a quiz entirely within EveryMind.ai.

### Standard Accessibility Support Was Missing

**Problem:** Users with visual impairments and motor disabilities reported that most AI education tools are unusable without a mouse — no screen reader support, no keyboard navigation, no high contrast mode.

**Solution:** Implemented WCAG 2.2-compliant features: full keyboard navigation, ARIA labels, semantic HTML structure, screen reader compatibility (VoiceOver, NVDA), and high contrast mode support.

**Result:** EveryMind.ai operates with built-in OS and browser accessibility tools by default.

## Getting Started (Development)

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Fill in the envs

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
