# excalidraw-agent

> **Work in Progress** - This project is under active development. APIs may change. Contributions and feedback welcome.

[![npm version](https://img.shields.io/npm/v/excalidraw-agent.svg)](https://www.npmjs.com/package/excalidraw-agent)
[![CI](https://github.com/karthikeyanjp/excalidraw-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/karthikeyanjp/excalidraw-agent/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An agent-first CLI for creating, reading, modifying, and exporting Excalidraw drawings programmatically.

## Why excalidraw-agent?

### The Problem

AI coding assistants (Cursor, Claude Code, Copilot, etc.) are excellent at generating code, but struggle with visual artifacts like architecture diagrams, flowcharts, and system designs. When an AI needs to create a diagram, it typically:

1. Outputs Mermaid/PlantUML code that requires a separate rendering step
2. Describes the diagram in text, leaving you to draw it manually
3. Cannot modify existing diagrams—only create new ones from scratch

### The Solution

**excalidraw-agent** provides a CLI that AI agents can use to directly create and manipulate Excalidraw diagrams through shell commands. This enables:

- **Programmatic diagram creation** - AI agents can create diagrams as easily as they create code files
- **Iterative refinement** - Modify existing diagrams element by element, just like editing code
- **Native Excalidraw output** - Files open directly in Excalidraw, Obsidian, and other compatible tools
- **Export capabilities** - Generate PNG/SVG for documentation and presentations

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Agent-First** | JSON input/output, composable commands, verbose debugging |
| **Idempotent** | Same input produces same output |
| **Spec-Compliant** | Validates against official Excalidraw schema |
| **Cross-Platform** | Works on macOS, Linux, and Windows |

## Installation

```bash
npm install -g excalidraw-agent

# For PNG export support (optional)
npx playwright install chromium
```

## Quick Start

### Create a diagram with DSL

```bash
# Quick flowchart using text DSL
excalidraw-agent quick "[Start] -> [Process] -> {Decision?} -> [End]" -o flow.excalidraw

# Export to PNG
excalidraw-agent export flow.excalidraw --output flow.png
```

### Create a diagram step-by-step

```bash
# Create a new file
excalidraw-agent create diagram.excalidraw

# Add a labeled rectangle
excalidraw-agent add diagram.excalidraw \
  --type rectangle --x 100 --y 100 --width 200 --height 80 \
  --fill "#a5d8ff" --fill-style solid \
  --label "My Component"

# Add more elements
excalidraw-agent add diagram.excalidraw \
  --type arrow --x 300 --y 140 --points "[[0,0],[100,0]]"

# List elements
excalidraw-agent list diagram.excalidraw --format table

# Export
excalidraw-agent export diagram.excalidraw --output diagram.svg
```

## Commands

| Command | Description |
|---------|-------------|
| `create <file>` | Create a new .excalidraw file |
| `add <file>` | Add elements (rectangle, ellipse, text, arrow, etc.) |
| `list <file>` | List elements with optional filters |
| `modify <file>` | Modify element properties |
| `delete <file>` | Delete elements by ID or type |
| `info <file>` | Show file metadata and statistics |
| `export <file>` | Export to PNG or SVG |
| `validate <file>` | Validate against Excalidraw schema |
| `connect <file>` | Auto-connect two elements with an arrow |
| `quick <dsl>` | Create diagram from text DSL |
| `batch <file>` | Execute multiple operations atomically |

## Quick DSL Syntax

Create diagrams using intuitive text syntax:

```
[Label]   - Rectangle (process/step)
(Label)   - Ellipse (start/end)
{Label}   - Diamond (decision)
<Label>   - Text only

->        - Arrow
-->       - Dashed arrow
--        - Line
```

### Examples

```bash
# Simple flow
excalidraw-agent quick "[Input] -> [Process] -> [Output]" -o flow.excalidraw

# Decision flow
excalidraw-agent quick "(Start) -> [Validate] -> {Valid?} -> [Save] -> (End)" -o decision.excalidraw

# Vertical layout
excalidraw-agent quick "[Step 1] -> [Step 2] -> [Step 3]" -o vertical.excalidraw --direction vertical

# With style presets
excalidraw-agent quick "[A] -> [B] -> [C]" -o styled.excalidraw --style colorful
```

### Style Presets

| Preset | Description |
|--------|-------------|
| `default` | Soft pastel colors |
| `colorful` | Vibrant colors |
| `minimal` | Clean grayscale |
| `blueprint` | Dark blue theme |

## Element Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| `rectangle` | Box shape | x, y, width, height, backgroundColor |
| `ellipse` | Oval/circle | x, y, width, height |
| `diamond` | Decision shape | x, y, width, height |
| `text` | Text label | x, y, text, fontSize |
| `arrow` | Arrow connector | x, y, points, endArrowhead |
| `line` | Line connector | x, y, points |
| `freedraw` | Freehand drawing | x, y, points |

## Export Options

```bash
# SVG export
excalidraw-agent export diagram.excalidraw --output out.svg

# PNG export (requires Playwright)
excalidraw-agent export diagram.excalidraw --output out.png

# High-resolution export
excalidraw-agent export diagram.excalidraw --output out.png --scale 2

# Dark mode
excalidraw-agent export diagram.excalidraw --output out.png --dark
```

## Validation

Validate files against the official Excalidraw schema:

```bash
# Basic validation
excalidraw-agent validate diagram.excalidraw

# Strict mode (warnings become errors)
excalidraw-agent validate diagram.excalidraw --strict

# JSON output for programmatic use
excalidraw-agent validate diagram.excalidraw --json
```

## AI Agent Integration

excalidraw-agent is designed for use with AI coding assistants. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for detailed guides on:

- Cursor
- Claude Code
- Clawdbot
- Generic AI agents with shell access
- MCP (Model Context Protocol) integration

### Quick Integration

Add to your AI agent's context:

```
For diagrams, use excalidraw-agent CLI:
- Quick: excalidraw-agent quick "[A] -> [B]" -o out.excalidraw
- Export: excalidraw-agent export out.excalidraw --output out.png
- Shapes: [rect] (ellipse) {diamond} <text>
- Arrows: -> (solid) --> (dashed)
```

## File Compatibility

Output files are standard `.excalidraw` JSON files, compatible with:

- [excalidraw.com](https://excalidraw.com)
- Obsidian Excalidraw plugin
- VS Code Excalidraw extension
- Any tool supporting the Excalidraw format

## Development

```bash
# Clone
git clone https://github.com/karthikeyanjp/excalidraw-agent.git
cd excalidraw-agent

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run 100x stability test
npm run test:100
```

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](LICENSE) for details.
