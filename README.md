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

| Feature | Most Platforms | EveryMind.ai |
|---|---|---|
| Accessibility | Add-on afterthought | Designed from day one |
| Scope | Single purpose (convert OR deliver) | End-to-end (assess -> generate -> deliver) |
| Content | Converts existing materials | Generates multimodal formats from any input |
| Users | Students OR teachers | Both, in a single platform |
| Science | Often based on learning styles myth | Grounded in UDL research |

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
Upload PDF/DOCX or enter topic
      |
Extract content (PDF pages -> Gemini vision; DOCX -> mammoth plain text)
      |
Hierarchical summarization (chunk pages -> summarize -> collapse)
      |
AI generates course outline (5-8 sections with learning objectives)
      |
AI expands each section into full markdown content (adapted to student profile)
      |
In parallel:
  +-- Quiz generation (5-10 questions)
  +-- TTS audio narration (per section, always)
  +-- Podcast generation (NotebookLM) [disabled — API not yet stable]
  +-- Image generation (Imagen 4.0 Fast, if outputMode="visual")
  +-- Video generation (Veo 3.1 Fast, if outputMode="video")
  +-- Interactive exercises (fill-in-blank, MCQ, short answer, if outputMode="interactive")
      |
Course ready: Text + Audio + selected modes
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes (single codebase) |
| Database | Firebase Firestore (Admin SDK, server-side only) |
| File Storage | Firebase Cloud Storage |
| Authentication | Clerk |
| AI (Text, Quiz, Interactive) | Gemini 3 Flash Preview via `@google/genai` |
| AI (Audio Narration) | Gemini 2.5 Flash TTS |
| AI (Podcast) | NotebookLM Podcast API [disabled] |
| AI (Images) | Imagen 4.0 Fast |
| AI (Video) | Veo 3.1 Fast |
| Document Extraction | Gemini vision (PDF screenshots) + mammoth (DOCX) |
| Deployment | Vercel |

### Accessibility Stack

- **shadcn/ui** — built on Radix UI primitives, WAI-ARIA compliant by default
- **eslint-plugin-jsx-a11y** — accessibility linting
- **@axe-core/react** — runtime accessibility testing in development (console warnings)
- **WCAG 2.2** — target compliance (4.5:1 contrast, POUR principles)
- **Semantic HTML first** — native elements over custom ARIA widgets
- **VoiceOver / NVDA** — tested across major screen readers

---

## Market Context

The adaptive learning market is growing rapidly:

- **2024:** $2.87 billion
- **2025:** $4.39 billion (52.7% YoY growth)
- **2033 projection:** $28.36 billion (19.7% CAGR)

Despite this growth, no platform has combined accessibility-native design, end-to-end content generation, and multimodal delivery in a single product. That's the gap EveryMind.ai is built to fill.

---

## Development Status

| Phase | Scope | Status |
|---|---|---|
| Weeks 1-2 | Foundation: auth, database, onboarding assessment | Complete |
| Weeks 3-4 | Core AI: document processing, course generation, audio | Complete |
| Weeks 5-6 | Multimodal: images, video, podcast, interactive exercises, progress tracking | Complete |
| Weeks 7-8 | Accessibility testing, polish, deployment | In progress |

---

## Getting Started (Development)

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in: FIREBASE_SERVICE_ACCOUNT_KEY, FIREBASE_STORAGE_BUCKET, GOOGLE_API_KEY, Clerk keys

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Further Reading

- [`docs/RESEARCH.md`](./docs/RESEARCH.md) — Full market research, UDL framework, disability-specific technologies, competitor analysis
- [`docs/TECH.md`](./docs/TECH.md) — Complete tech stack details, AI services, cost analysis, implementation roadmap
- [`CLAUDE.md`](./CLAUDE.md) — Codebase guide for AI-assisted development
