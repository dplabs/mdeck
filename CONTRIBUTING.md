# Contributing to mdeck

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Table of contents

- [Development setup](#development-setup)
- [Project structure](#project-structure)
- [Running the examples](#running-the-examples)
- [Making changes](#making-changes)
- [Commit conventions](#commit-conventions)
- [Pull requests](#pull-requests)
- [CI checks](#ci-checks)

---

## Development setup

**Prerequisites:** Node.js 20 or 22, npm.

```bash
git clone https://github.com/dplabs/mdeck
cd mdeck
npm install
```

Key commands:

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at `http://localhost:5173` |
| `npm run build` | Type-check + build to `dist/` |
| `npm test` | Run tests with vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint `src/` with ESLint |
| `npx tsc --noEmit` | Type-check without emitting |

---

## Project structure

```
src/
  index.ts          # Public entry point
  mdeck/
    api.ts          # createSlideshow() and public API
    converter.ts    # Markdown → slide HTML conversion
    lexer.ts        # Slide lexer / tokeniser
    parser.ts       # Slide parser
    highlighter.ts  # highlight.js integration
    macros.ts       # Macro system
    scaler.ts       # Slide scaling
    dom.ts          # DOM utilities
    models/         # Data models
    components/     # UI components
    controllers/    # Input controllers (keyboard, touch, etc.)
    views/          # Presenter / clone views
  __tests__/        # Vitest test files
docs/               # Markdown documentation
examples/           # Ready-to-run HTML demos
```

---

## Running the examples

```bash
npm run dev
```

Then open any of the example URLs listed in [docs/getting-started.md](docs/getting-started.md#running-the-examples-locally).

---

## Making changes

1. **Fork** the repo and create a branch from `main`.
2. Make your changes with focused, well-scoped commits.
3. Add or update tests in `src/__tests__/` for any changed behaviour.
4. Ensure all checks pass before opening a PR:

```bash
npx tsc --noEmit   # type-check
npm run lint       # lint
npm test           # tests
npm run build      # build
```

### Guidelines

- Keep the library **dependency-light** — new runtime dependencies require strong justification.
- Maintain **remark.js compatibility** — existing slide decks must continue to work.
- Write **TypeScript** throughout; avoid `any` unless unavoidable.
- Only add code comments where the logic genuinely needs clarification.

---

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint and husky.

**Format:** `<type>(<optional scope>): <description>`

Common types:

| Type | When to use |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, or dependency updates |
| `perf` | Performance improvement |

**Examples:**

```
feat: add sourceUrl option to load external markdown files
fix: preserve slide order when using template property
docs: document content classes syntax
chore: bump markdown-it to v14
```

The commit message hook will reject non-conforming messages on commit.

---

## Pull requests

- Open PRs against the `main` branch.
- Keep PRs focused — one feature or fix per PR.
- Fill in the PR description explaining **what** changed and **why**.
- Reference any related issues (e.g. `Closes #42`).
- Ensure CI passes before requesting review.

---

## CI checks

GitHub Actions runs on every push and pull request against Node.js 20 and 22:

1. **Type-check** — `npx tsc --noEmit`
2. **Tests** — `npm test`
3. **Build** — `npm run build`

All three must pass for a PR to be merged.
