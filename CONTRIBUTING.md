# Contributing to ALDA

Thank you for your interest in contributing to ALDA.

ALDA is an early open source AI meeting coach. The project welcomes improvements in documentation, prompts, tests, accessibility, UI/UX, local AI support and integrations.

## Ways to contribute

- Report bugs through GitHub Issues.
- Suggest new coaching modes or meeting workflows.
- Improve documentation and examples.
- Add tests for API routes and AI provider logic.
- Improve prompts and evaluation examples.
- Help with accessibility and localization.
- Propose integrations with calendar, email or CRM tools.

## Good first issues

If you are new to the project, start with [`docs/good-first-issues.md`](docs/good-first-issues.md).

Good beginner areas include:

- documentation improvements;
- examples and screenshots;
- prompt examples;
- setup improvements;
- accessibility improvements;
- tests for small isolated features.

## Development setup

```bash
git clone https://github.com/jamitengola/alda.git
cd alda
npm install
cp .env.example .env.local
npm run dev
```

## Running tests

The project uses [Vitest](https://vitest.dev/) for automated testing. You can run the test suite locally with:

```bash
npm run test
```

Tests using the `mock` provider do not require external API keys and will run locally.

## Before opening a pull request

Run the basic checks locally:

```bash
npm run lint --if-present
npm run build --if-present
npm run test --if-present
```

## Pull request guidelines

1. Create an issue before large changes.
2. Keep pull requests focused and small when possible.
3. Explain the problem, solution and testing steps.
4. Run lint/build/test checks before submitting when possible.

## Suggested branch naming

```txt
feature/add-calendar-integration
fix/provider-error-handling
docs/improve-setup-guide
test/add-provider-tests
```

## Code of conduct

Be respectful, constructive and inclusive. The goal is to build a useful open source AI productivity tool for a broad community.