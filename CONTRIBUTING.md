# Contributing to CropVue

Thanks for your interest in contributing!

## Prerequisites

- Node.js >= 20
- [pnpm](https://pnpm.io/) (latest)

## Setup

```bash
git clone https://github.com/rutbergphilip/cropvue.git
cd cropvue
pnpm install
```

## Development

```bash
pnpm dev          # Start playground with hot reload
pnpm build        # Build all packages
pnpm test:run     # Run unit tests
pnpm test:e2e     # Run E2E tests (requires playwright)
pnpm docs:dev     # Start docs dev server
```

The monorepo contains three packages:

| Package | Path | Description |
|---------|------|-------------|
| `@cropvue/core` | `packages/core` | Headless composables and engine |
| `cropvue` | `packages/vue` | Vue 3 components |
| `@cropvue/nuxt` | `packages/nuxt` | Nuxt module |

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests if applicable
4. Ensure `pnpm test:run` and `pnpm build` pass
5. Open a PR with a clear description of the change

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning. If your PR changes public API or fixes a bug, add a changeset:

```bash
pnpm changeset
```

Follow the prompts to describe your change.
