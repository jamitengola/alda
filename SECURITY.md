# Security Policy

ALDA is an early open source project. Security reports are welcome and appreciated.

## Supported versions

The project is currently in active early development. Security fixes will be applied to the main branch until formal releases are published.

## Reporting a vulnerability

If you find a security issue, please do not publish sensitive details publicly before there is time to investigate.

You can report it by opening a GitHub issue with a high-level description that does not expose secrets, exploit details or private data. If the issue involves credentials, meeting data or private user information, provide only the minimum necessary context.

## Sensitive data

Please never commit:

- OpenAI API keys;
- Ollama proxy credentials;
- `.env.local` files;
- meeting transcripts containing private data;
- screenshots with confidential information;
- production database files.

## Recommended local setup

Use `.env.example` as the template and keep real secrets only in `.env.local` or your deployment provider secret manager.