# Contributing

Conventions the team follows.

## Branch strategy

- `main` — production. Protected branch. Deploys automatically.
- `dev` — integration branch. All feature branches merge here first.
- `feature/<short-name>` — new features
- `fix/<short-name>` — bug fixes
- `chore/<short-name>` — refactors, deps, non-user-facing work

Flow: `feature/x` → PR into `dev` → merge → QA on staging → PR from `dev` into `main` when ready to release.

## Commit format

Conventional Commits, brief and scoped:

```
feat(admin): add ticket bulk-assign
fix(backend): correct sitemap XML escape for ampersand
chore(deps): bump react-router to 7.1
docs(seo): add IndexNow section
refactor(frontend): extract Hero into section
```

The scope is one of: `backend`, `frontend`, `admin`, `docs`, `deps`, `infra`, or a specific feature area.

## Pull requests

- **Title:** the same format as the commit message
- **Description:** what changed, why, and any screenshots for UI
- **Checklist:**
  - [ ] I've tested locally
  - [ ] Lint passes (`npm run lint` in each affected project)
  - [ ] No console errors in the browser
  - [ ] Docs updated if I changed public behavior

Small PRs are better than big ones. Aim for <300 lines diff when possible.

## Code style

Enforced by ESLint + Prettier — run `npm run format` before committing. Key conventions:

### JavaScript / JSX

- ES Modules only, never CommonJS
- Single quotes, semicolons required
- 100-char line width
- Trailing commas everywhere they're valid
- Named exports over default when there's more than one thing per file
- Async/await over `.then()` chains
- Guard clauses instead of nested conditionals

### React

- Function components only, no class components except `ErrorBoundary`
- Hooks in the same order across components
- `useState` before `useEffect` before `useMemo` before other hooks
- One component per file except in "combined module" files (e.g. `OrdersPage.jsx` exports `OrdersListPage` and `OrderDetailsPage`)
- Props destructured in the parameter list
- Event handlers named `handle<Thing>` (`handleSubmit`, `handleClick`)

### CSS (Tailwind)

- Use utility classes; avoid `@apply` in components except inside `@utility` blocks
- Prefer semantic tokens over raw colors: `text-ink`, not `text-slate-900`
- Compose long class strings with `cn()` from `utils/format.js`
- Never use `!important`
- Never use inline `style={}` except for computed values (widths, positions from JS)

### Backend

- Every controller is `asyncHandler`-wrapped
- Errors thrown as `ApiError.<method>()` — never `throw new Error()`
- Responses via `ApiResponse.ok()` / `ApiResponse.created()` — never `res.json()` directly
- Validators separate from controllers (`validators/*.js`), imported by routes
- Business logic in `services/*.js` — controllers stay thin
- Mongoose queries use `.lean()` for reads that don't need document methods
- Always `.select()` to explicitly pick fields on reads that go over the wire

## File naming

- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utilities: `camelCase.js`
- Constants: `camelCase.js` or `SCREAMING_SNAKE_CASE` inside
- Route handlers: `<resource>.controller.js`, `<resource>.routes.js`, `<resource>.service.js`
- Tests: colocated as `<name>.test.js` next to the file under test

## Documentation

- Update the relevant doc when you change public behavior
- Keep the sub-project READMEs (`backend/README.md`, `frontend/README.md`, `admin/README.md`) current
- Add JSDoc to any exported function that isn't obvious from its name

## Testing (aspirational)

The current codebase has no tests — this is a known gap. When adding tests:

- Unit tests: Vitest for frontend + admin, Jest for backend
- Component tests: React Testing Library
- E2E: Playwright targeting the three deployed URLs

Priority for adding tests, in order:

1. Auth flows (login, refresh, logout, 2FA)
2. Stripe webhook handler
3. Order lifecycle
4. Admin CRUD for the top 3 content types
5. Public site checkout flow

## Reviewing

Reviewers should check:

- Does this actually solve the problem?
- Is it in the right place? (`services/` vs `controllers/` vs `utils/`)
- Are there tests? If not, is the risk acceptable?
- Any UI changes: does it match the design system?
- Any DB queries: are they indexed?
- Any new dependencies: are they maintained and necessary?

Approve with `LGTM` or leave specific change requests. Don't rubber-stamp — every review is a chance to catch something.
