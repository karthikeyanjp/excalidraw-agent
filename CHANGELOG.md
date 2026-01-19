# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-19

### Added
- Initial release 🎉
- **Core Commands**
  - `create` - Create new .excalidraw files
  - `add` - Add elements (rectangle, ellipse, diamond, text, arrow, line, freedraw)
  - `list` - List and filter elements
  - `modify` - Update element properties
  - `delete` - Remove elements
  - `info` - Show file metadata
  - `export` - Export to PNG/SVG
  - `batch` - Execute multiple operations
  
- **Advanced Features**
  - `validate` - Schema validation against official Excalidraw spec
  - `connect` - Auto-connect elements with arrows
  - `quick` - Create diagrams from simple DSL syntax
  
- **Quick DSL**
  - Rectangle: `[Label]`
  - Ellipse: `(Label)`
  - Diamond: `{Label}`
  - Text: `<Label>`
  - Arrow: `->`
  - Dashed: `-->`
  - Line: `--`
  
- **Style Presets**
  - `default` - Soft pastel colors
  - `colorful` - Vibrant colors
  - `minimal` - Clean grayscale
  - `blueprint` - Dark blue theme

- **Export Options**
  - SVG export (built-in renderer)
  - PNG export (via Playwright)
  - Scale, padding, dark mode options

- **Testing**
  - 96+ unit and integration tests
  - Schema validation tests
  - CLI integration tests

### Technical
- TypeScript with ES modules
- Commander.js for CLI
- Vitest for testing
- Playwright for PNG export
