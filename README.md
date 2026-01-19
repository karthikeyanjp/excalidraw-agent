# excalidraw-agent

> **Work in Progress** - This project is under active development. APIs may change. Contributions and feedback welcome!

[![npm version](https://img.shields.io/npm/v/excalidraw-agent.svg)](https://www.npmjs.com/package/excalidraw-agent)
[![CI](https://github.com/karthikeyanjp/excalidraw-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/karthikeyanjp/excalidraw-agent/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**An agent-first CLI for creating, reading, modifying, and exporting Excalidraw drawings programmatically.**

Built for AI agents, automation pipelines, and developers who want to create diagrams from the command line.

## Features

- **Create & Modify** - Full CRUD operations on `.excalidraw` files
- **Agent-First** - JSON input/output, composable, pipe-friendly
- **Quick DSL** - Create diagrams with simple text syntax
- **Export** - PNG and SVG output with Playwright
- **Validate** - Schema validation against official Excalidraw spec
- **Auto-Connect** - Smart element connections
- **Style Presets** - Colorful, minimal, blueprint themes

## Installation

```bash
npm install -g excalidraw-agent

# For PNG export support (optional)
npx playwright install chromium
```

## Quick Start

### Create a diagram in one command

```bash
# Quick DSL syntax
excalidraw-agent quick "[Start] -> [Process] -> {Decision?} -> [End]" -o flow.excalidraw

# Export to PNG
excalidraw-agent export flow.excalidraw --output flow.png
```

### Step-by-step creation

```bash
# Create a new file
excalidraw-agent create diagram.excalidraw

# Add elements
excalidraw-agent add diagram.excalidraw --data '{
  "type": "rectangle",
  "x": 100, "y": 100,
  "width": 200, "height": 100,
  "backgroundColor": "#a5d8ff"
}'

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
| `list <file>` | List elements with filters |
| `modify <file>` | Modify element properties |
| `delete <file>` | Delete elements |
| `info <file>` | Show file metadata and statistics |
| `export <file>` | Export to PNG or SVG |
| `validate <file>` | Validate against Excalidraw schema |
| `connect <file>` | Auto-connect two elements |
| `quick <dsl>` | Create diagram from DSL |
| `batch <file>` | Execute multiple operations |

## Quick DSL Syntax

Create diagrams with intuitive text syntax:

```bash
# Shapes
[Label]   # Rectangle
(Label)   # Ellipse
{Label}   # Diamond
<Label>   # Text only

# Connections
->        # Arrow
-->       # Dashed arrow
--        # Line

# Examples
excalidraw-agent quick "[Input] -> [Process] -> [Output]" -o flow.excalidraw
excalidraw-agent quick "(Start) -> [Step 1] -> {OK?} -> [Step 2] -> (End)" -o flow.excalidraw
```

### Style Presets

```bash
--style default    # Soft pastel colors
--style colorful   # Vibrant colors
--style minimal    # Grayscale, clean
--style blueprint  # Dark blue theme
```

### Layout Direction

```bash
--direction horizontal  # Left to right (default)
--direction vertical    # Top to bottom
```

## Element Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| `rectangle` | Box shape | x, y, width, height |
| `ellipse` | Oval/circle | x, y, width, height |
| `diamond` | Decision shape | x, y, width, height |
| `text` | Text label | x, y, text, fontSize |
| `arrow` | Arrow connector | x, y, points, endArrowhead |
| `line` | Line connector | x, y, points |
| `freedraw` | Freehand drawing | x, y, points, pressures |

## Export Options

```bash
# SVG export
excalidraw-agent export diagram.excalidraw --output out.svg

# PNG export (requires Playwright)
excalidraw-agent export diagram.excalidraw --output out.png

# Options
--scale <n>         # Scale factor (e.g., 2 for 2x)
--padding <px>      # Padding around content
--dark              # Dark mode
--background <color> # Override background color
```

## Validation

Validate files against the official Excalidraw schema:

```bash
excalidraw-agent validate diagram.excalidraw

# Strict mode (warnings become errors)
excalidraw-agent validate diagram.excalidraw --strict

# JSON output
excalidraw-agent validate diagram.excalidraw --json
```

## Agent Integration

Designed for AI agents and automation:

```bash
# JSON output for parsing
excalidraw-agent list diagram.excalidraw --json

# Stdin support
echo '{"type":"rectangle","x":0,"y":0}' | excalidraw-agent add diagram.excalidraw --stdin

# Batch operations
excalidraw-agent batch diagram.excalidraw --ops '[
  {"op":"add","element":{"type":"rectangle","x":0,"y":0,"width":100,"height":50}},
  {"op":"add","element":{"type":"text","x":10,"y":15,"text":"Hello"}}
]'

# Verbose mode for debugging
excalidraw-agent create diagram.excalidraw --verbose
```

## Programmatic Usage

```typescript
import { createFlowchartFromDSL } from 'excalidraw-agent';

const diagram = await createFlowchartFromDSL('[A] -> [B] -> [C]');
```

## Specification

This tool generates files conforming to the [Excalidraw file format](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/data/types.ts). Key specifications:

- **File Format**: JSON with `type: "excalidraw"` and `version: 2`
- **Element Types**: rectangle, ellipse, diamond, text, arrow, line, freedraw, image, frame
- **Properties**: Follows official [element type definitions](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/element/types.ts)

The `validate` command checks files against this specification:
```bash
excalidraw-agent validate diagram.excalidraw --strict
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

# Install
npm install

# Build
npm run build

# Test
npm test

# Run 100x stability test
npm run test:100
```

## AI Agent Integration

excalidraw-agent is designed for AI agents. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for detailed integration guides:

- **[Cursor](docs/INTEGRATIONS.md#cursor)** - AI-powered code editor
- **[Claude Code](docs/INTEGRATIONS.md#claude-code)** - Anthropic's coding agent
- **[Clawdbot](docs/INTEGRATIONS.md#clawdbot)** - Multi-channel AI assistant
- **[Generic Agents](docs/INTEGRATIONS.md#generic-ai-agents)** - Any AI with shell access
- **[MCP](docs/INTEGRATIONS.md#mcp-integration)** - Model Context Protocol (coming soon)

### Quick Integration

Add to your AI agent's system prompt or rules:
```
For diagrams, use excalidraw-agent:
- Quick: excalidraw-agent quick "[A] -> [B] -> [C]" -o out.excalidraw
- Export: excalidraw-agent export out.excalidraw --output out.png
- Shapes: [rect] (ellipse) {diamond} <text>
- Arrows: -> (solid) --> (dashed)
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © [Karthikeyan JP](https://github.com/karthikeyanjp)
