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

The same material becomes a structured text course, an audio narration, and an interactive quiz — all generated automatically and tailored to the student's profile.

---

## Key Differentiators

Unlike existing adaptive learning platforms (DreamBox, Knewton, Coursebox, eduMe), EveryMind.ai is:

| Feature | Most Platforms | EveryMind.ai |
|---|---|---|
| Accessibility | Add-on afterthought | Designed from day one |
| Scope | Single purpose (convert OR deliver) | End-to-end (assess → generate → deliver) |
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
- Create courses for students with specific accessibility needs
- Deliver content in multiple formats without manual reformatting

---

## How It Works

### For Students
1. Sign up and complete a short onboarding assessment (disabilities, preferences, accessibility needs)
2. Browse courses created by teachers or generate your own from any topic
3. Learn through text, audio narration, and interactive quizzes
4. Track progress across all content

### For Teachers
1. Upload PDFs or DOCX files — lecture notes, textbooks, handouts
2. The platform extracts content and generates a full structured course
3. Students receive content in their preferred, accessible formats automatically

### The Generation Pipeline

```
Upload PDF/DOCX
      ↓
Extract content (PDF pages → AI vision; DOCX → plain text)
      ↓
AI generates course outline (4–8 sections)
      ↓
AI expands each section into full content
      ↓
AI generates quiz questions from material
      ↓
OpenAI TTS generates audio narration
      ↓
Course ready: Text + Audio + Quiz
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) via Prisma 7 |
| Authentication | Clerk |
| AI (Text & Reasoning) | OpenRouter → configurable model (default: GPT-4o) |
| AI (Audio) | OpenAI TTS |
| Document Extraction | PDF vision rendering + Mammoth (DOCX) |
| File Storage | Vercel Blob (production) / local filesystem (development) |
| Deployment | Vercel |

### Accessibility Stack

- **shadcn/ui** — built on Radix UI primitives, WAI-ARIA compliant by default
- **eslint-plugin-jsx-a11y** — accessibility linting on every commit
- **WCAG 2.2** — target compliance (4.5:1 contrast, POUR principles)
- **Semantic HTML first** — native elements over custom ARIA widgets
- **VoiceOver / NVDA / JAWS** — tested across major screen readers

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
| Weeks 1–2 | Foundation: auth, database, onboarding assessment | ✅ Complete |
| Weeks 3–4 | Core AI: document processing, course generation, audio | ✅ Complete |
| Weeks 5–6 | Multimodal: images, progress tracking, teacher dashboard | 🔄 In progress |
| Weeks 7–8 | Accessibility testing, real user testing, launch | ⏳ Upcoming |

---

## Getting Started (Development)

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in: DATABASE_URL, OPENROUTER_API_KEY, Clerk keys

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Further Reading

- [`RESEARCH.md`](./RESEARCH.md) — Full market research, UDL framework, disability-specific technologies, competitor analysis
- [`TECH.md`](./TECH.md) — Complete tech stack rationale, AI service comparisons, cost analysis, implementation roadmap
- [`CLAUDE.md`](./CLAUDE.md) — Codebase guide for AI-assisted development
