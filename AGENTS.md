## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter, ai-tools

---

## Default Engineering Rules

- Before planning or changing anything, always read `docs/CodingRules.md`
  (global engineering rules) and `docs/ProjectCodingRules.md` (this project's
  domain map: routes, feature pieces, Convex tables and functions, and the
  business rules that go with them); reuse those patterns before adding a new
  abstraction.
- Apply Ponytail principles to every task: use the smallest working solution, prefer the standard library, native platform features, and existing dependencies, and avoid speculative abstractions, boilerplate, and unnecessary files.
- Do not simplify away input validation, security, accessibility, or error handling that prevents data loss.
- After completing any code creation or modification, always run `bunx --bun oxlint`. The `--bun` flag is required because this project uses the TypeScript `oxlint.config.ts`; plain `bunx oxlint` can run Oxlint through the installed Node.js version and fail before linting. Fix reported issues and rerun it before handing off the work.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`src/convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
