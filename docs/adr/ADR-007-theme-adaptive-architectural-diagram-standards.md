# ADR 007: Theme-Adaptive Architectural Diagram Standards and Native Mermaid Adoption

## Status
Accepted

## Date
2026-09-13

## Context
1. **Transparent Raster Diagrams on Dark Mode Interfaces:**
   Previously, architecture diagrams in `diagrams/` were exported from Draw.io as PNG files with transparent backgrounds (`alpha = 0`) using black text (`#000000`) and black connection strokes. When viewed on GitHub's Dark Mode theme (`#0d1117`), the black titles, text annotations, and relationship arrows became invisible due to near-zero contrast, rendering critical architectural documentation unreadable.
2. **Text Clipping & Maintenance Overhead:**
   Static raster images suffered from text clipping and label overlapping (e.g. `CurriculumDashboard.tsx` overlapping into adjacent nodes in the component diagram). Furthermore, maintaining static PNGs required external GUI drawing tools, creating friction when updating documentation alongside code changes.

## Decision
1. **Primary Native GitHub Mermaid Specification:**
   - Author system architecture, data flows, component boundaries, and sequence lifecycles primarily as native `mermaid` code blocks directly inside Markdown documentation.
   - Leverage GitHub's built-in Mermaid engine to dynamically adapt colors, contrast, node shapes, and text colors according to the reader's active theme (Light or Dark Mode).
2. **Structured Tiered Architecture Pattern:**
   - For System Context diagrams, enforce a structured 3-tier horizontal layout:
     - **Tier 1 (Left / Stakeholders):** Actors (`Students`, `Instructors`, `Staff`, `Admins`)
     - **Tier 2 (Center / Application Core):** Web Platform (React 18 + Vite, Academic Rule Engine, Modern Academic Chat Surface)
     - **Tier 3 (Right / External Services):** Cloud & AI Services (Firebase Auth/RTDB, n8n AI Orchestrator, Pinecone, LLM)
   - Eliminates convoluted crisscrossing arrows and organizes data flows by functional domain.
3. **Solid-White Canvas Rule for Legacy Raster Exports:**
   - Any supplementary or detailed Draw.io PNG images kept in `diagrams/` must be composited onto a solid white canvas (`#FFFFFF`) with card padding, strictly prohibiting transparent backgrounds for black-text diagrams.

## Consequences
- Guaranteed 100% legibility and accessibility across GitHub Light Mode, Dark Mode, and mobile viewports.
- Zero text overlap, clipping, or line disappearance across all diagrammatic representations.
- Vector-sharp rendering on all screen densities without raster pixelation.
- Transparent version control where architectural diagram changes are tracked directly via git diffs.
