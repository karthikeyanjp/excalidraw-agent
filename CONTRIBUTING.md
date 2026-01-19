# Contributing to excalidraw-agent

First off, thank you for considering contributing! 🎉

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/karthikeyanjp/excalidraw-agent/issues)
- If not, create a new issue with:
  - Clear title and description
  - Steps to reproduce
  - Expected vs actual behavior
  - Your environment (OS, Node version, etc.)

### Suggesting Features

- Open an issue with the `enhancement` label
- Describe the use case and proposed solution
- Be open to discussion!

### Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit with clear messages
7. Push and open a PR

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/excalidraw-agent.git
cd excalidraw-agent

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in watch mode during development
npm run test:watch
```

## Code Style

- TypeScript with strict mode
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Follow existing patterns in the codebase

## Testing

- All new features should have tests
- Run the full test suite before submitting: `npm test`
- For stability, we target 100+ test runs: `npm run test:100`

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add new quick DSL syntax`
- `fix: handle empty elements array`
- `docs: update README examples`
- `test: add validation edge cases`

## Questions?

Feel free to open an issue for any questions!
