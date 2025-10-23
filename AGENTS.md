# Repository Guidelines

## Project Structure & Module Organization
- `front-end/` contains the React SPA; `src/component/` holds pages, `src/hooks/` custom hooks, `src/class/` editor helpers, and static assets in `src/img/`.
- Styles live in `src/index.scss` and component-scoped SCSS imports; colocate assets and keep imports relative to `src/`.
- `back-end/` hosts the Express + TypeScript API; routers are in `src/router/`, shared DTOs in `src/all_Types.ts`, and database helpers in `src/store_mysql.ts`.
- Environment variables load via `dotenv`; track required keys in team docs and never commit secrets.

## Build, Test, and Development Commands
- `cd front-end && npm run dev` starts webpack-dev-server with HMR on `localhost:8080` for UI work.
- `cd front-end && npm run build` compiles production assets into `front-end/build/`; run before shipping static files.
- `cd back-end && npm run start` launches the API with `ts-node` + `nodemon`; `npm run build` emits JS under `back-end/dist/`.
- `cd back-end && npm run pstart` runs the compiled server with pm2; keep the `tooniz` process name consistent across environments.

## Coding Style & Naming Conventions
- Use TypeScript, 2-space indentation, double quotes, and trailing semicolons; order imports as core → third-party → local modules.
- Name React components with `PascalCase` (`EditorUI.tsx`), hooks with a `use` prefix, and utilities with camelCase filenames.
- Prefer functional components and derived state; keep side effects inside hooks and share styling via SCSS rather than inline styles.
- Run `npm run "Typescript Compile"` or the respective `build` script before pushing to catch type regressions.

## Testing Guidelines
- No automated suite is committed yet; introduce Jest + React Testing Library for UI and supertest for Express endpoints as you extend features.
- Co-locate front-end tests as `ComponentName.test.tsx`; place API tests under `back-end/src/__tests__/` with mirrored folder names.
- Cover success and failure paths for every new route or complex hook and target ≥80% coverage on touched files.
- Use a disposable `.env.test` or dockerized MySQL when running integration tests to avoid polluting developer data.

## Commit & Pull Request Guidelines
- Write imperative, English summaries around 60 characters (e.g., `feat: add editor layout`) and add bodies when context is non-obvious.
- Keep commits scoped to one concern; split front-end and back-end changes unless they must land together.
- Open PRs with a short changelog, linked issues, and screenshots or screen capture when UI changes are visible.
- Verify type checks and builds locally before requesting review and tag maintainers responsible for the affected area.


## 한국어로 답변해줘