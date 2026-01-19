# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-19

### Added

**Core Commands**
- `create` - Create new .excalidraw files with customizable background and grid
- `add` - Add elements (rectangle, ellipse, diamond, text, arrow, line, freedraw)
- `list` - List and filter elements by type or ID pattern
- `modify` - Update element properties with set, move, and resize operations
- `delete` - Remove elements by ID, type, or all
- `info` - Display file metadata and element statistics
- `export` - Export to PNG (via Playwright) or SVG
- `batch` - Execute multiple operations atomically

**Advanced Commands**
- `validate` - Schema validation against official Excalidraw specification
- `connect` - Auto-connect two elements with smart edge detection
- `quick` - Create diagrams from simple text DSL

**Quick DSL**
- Rectangle syntax: `[Label]`
- Ellipse syntax: `(Label)`
- Diamond syntax: `{Label}`
- Text syntax: `<Label>`
- Arrow: `->`
- Dashed arrow: `-->`
- Line: `--`

**Style Presets**
- `default` - Soft pastel colors
- `colorful` - Vibrant colors
- `minimal` - Clean grayscale
- `blueprint` - Dark blue theme

**Export Capabilities**
- SVG export with built-in renderer
- PNG export via Playwright headless browser
- Scale, padding, and dark mode options

**Developer Experience**
- Full TypeScript implementation
- 96+ unit and integration tests
- Cross-platform support (macOS, Linux, Windows)
- JSON input/output for programmatic use
- Verbose mode for debugging

### Technical Details
- TypeScript with ES modules
- Commander.js for CLI framework
- Vitest for testing
- Playwright for PNG rendering
