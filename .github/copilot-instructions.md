# AI Coding Agent Instructions - Storefront SaaS

## Project Overview
This is a **Next.js 16.1.1 storefront SaaS application** using TypeScript, React 19, and Tailwind CSS. The project uses the App Router pattern (files in `app/` directory) and is configured for strict TypeScript checking.

## Architecture & Key Patterns

### App Router Structure
- **`app/layout.tsx`** - Root layout wraps all pages; imports global CSS and sets up font optimization (Geist Sans/Mono via `next/font`)
- **`app/page.tsx`** - Home page entry point; currently shows starter template
- **`app/globals.css`** - Global Tailwind + CSS imports; all styles cascade through layout

**Pattern**: Use Server Components by default; wrap Client Components with `"use client"` directive. Keep data fetching in Server Components when possible.

### Styling & Tailwind
- **Config**: `@tailwindcss/postcss` v4 with PostCSS integration (`postcss.config.mjs`)
- **Classes**: Already using Tailwind in `page.tsx` (e.g., `flex`, `min-h-screen`, `dark:` prefixes)
- **Convention**: Prefer Tailwind utilities over custom CSS; use `dark:` prefix for dark mode variants

## Developer Workflows

### Essential Commands
```bash
npm run dev       # Start dev server on http://localhost:3000 (hot reload enabled)
npm run build     # Production build to .next/
npm run start     # Start production server (requires build first)
npm run lint      # Run ESLint (uses eslint-config-next/core-web-vitals + TypeScript)
```

### Debugging & Development
- **TypeScript**: Strict mode enabled; `tsconfig.json` path alias `@/*` points to root for cleaner imports
- **Hot reload**: Any changes to `app/**` files auto-refresh; check console for build errors
- **Linting**: ESLint runs with Next.js best practices + TypeScript rules; violations block some operations

## Type Conventions

- **Metadata type**: Import from `"next"` (`import type { Metadata }`); use for page-level SEO/meta tags
- **React types**: Use `React.ReactNode` for `children` props (see `layout.tsx` example)
- **Layout exports**: Always export named function and typed `Metadata` for root layout

## Key Files Reference

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript config; strict mode, path aliases (`@/*`) |
| `next.config.ts` | Next.js runtime config (currently minimal) |
| `package.json` | Dependencies: Next 16.1.1, React 19, Tailwind 4 |
| `eslint.config.mjs` | ESLint + Next.js + TypeScript rules |

## Common Tasks

**Adding a new page**:
1. Create `app/some-feature/page.tsx` (folders auto-create routes)
2. Export default component; optionally export `metadata` for SEO
3. Use Tailwind classes; reference globals.css for custom utility patterns

**Component best practices**:
- Default to Server Components; use `"use client"` only for interactivity (hooks, events)
- Import `Image` from `"next/image"` for optimized images (auto-optimization, responsive loading)
- Keep components under `app/` in feature-based folders (not a separate `components/` for initial MVP)

## External Dependencies
- **Next.js 16.1.1**: Handles routing, image optimization, font loading
- **React 19**: Latest features; automatic JSX transform
- **Tailwind CSS 4**: PostCSS-based styling
- **TypeScript 5**: Strict type checking
- No backend/database configured yet; API routes can be added via `app/api/` directory

## Questions or Gaps?
Flag unclear patterns; this guide will be updated as the project evolves.
