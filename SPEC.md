# excalidraw-agent Specification

## Overview

`excalidraw-agent` is an agent-first CLI for creating, reading, modifying, and exporting Excalidraw drawings programmatically.

## Design Principles

1. **Agent-First**: Designed for AI agents and automation
   - JSON input/output for easy parsing
   - Composable commands for pipelines
   - Verbose mode for debugging

2. **Idempotent**: Same input produces same output
   - Deterministic element IDs when provided
   - Reproducible diagrams

3. **Spec-Compliant**: Follows official Excalidraw format
   - Validated against @excalidraw/excalidraw types
   - Compatible with excalidraw.com and plugins

## File Format

### Excalidraw File Structure
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "excalidraw-agent",
  "elements": [...],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

### Element Types

| Type | Description | Special Properties |
|------|-------------|-------------------|
| `rectangle` | Box shape | - |
| `ellipse` | Oval/circle | - |
| `diamond` | Decision shape | - |
| `text` | Text label | text, fontSize, fontFamily |
| `arrow` | Arrow connector | points, endArrowhead |
| `line` | Line connector | points |
| `freedraw` | Freehand | points, pressures |

### Base Element Properties

```typescript
interface BaseElement {
  id: string;                    // Unique ID (nanoid)
  type: ElementType;             // Element type
  x: number;                     // X position
  y: number;                     // Y position
  width: number;                 // Width
  height: number;                // Height
  angle: number;                 // Rotation (radians)
  strokeColor: string;           // Stroke color
  backgroundColor: string;       // Fill color
  fillStyle: FillStyle;          // hachure|cross-hatch|solid|zigzag
  strokeWidth: number;           // Stroke width
  strokeStyle: StrokeStyle;      // solid|dashed|dotted
  roughness: number;             // 0-2
  opacity: number;               // 0-100
  groupIds: string[];            // Group memberships
  frameId: string | null;        // Frame container
  roundness: Roundness | null;   // Corner rounding
  seed: number;                  // Random seed
  version: number;               // Change counter
  versionNonce: number;          // Version disambiguator
  isDeleted: boolean;            // Soft delete flag
  boundElements: BoundElement[]; // Bound elements
  updated: number;               // Timestamp
  link: string | null;           // Hyperlink
  locked: boolean;               // Lock flag
}
```

## CLI Commands

### Core Commands

| Command | Description | Exit Codes |
|---------|-------------|-----------|
| `create` | Create new file | 0=success, 1=exists |
| `add` | Add elements | 0=success, 4=invalid |
| `list` | List elements | 0=success, 2=not found |
| `modify` | Modify elements | 0=success, 2=not found |
| `delete` | Delete elements | 0=success, 2=not found |
| `info` | File info | 0=success, 2=not found |
| `export` | Export PNG/SVG | 0=success, 5=export fail |
| `validate` | Schema check | 0=valid, 1=invalid |

### Advanced Commands

| Command | Description |
|---------|-------------|
| `batch` | Multiple operations |
| `connect` | Auto-connect elements |
| `quick` | DSL-based creation |

## Quick DSL Syntax

```
[Label]   → Rectangle
(Label)   → Ellipse
{Label}   → Diamond
<Label>   → Text only
->        → Arrow
-->       → Dashed arrow
--        → Line
```

## Validation

Schema validation is performed against the official Excalidraw element types from `@excalidraw/excalidraw`. The validator checks:

1. **Required properties**: id, type, x, y, width, height, version, seed
2. **Type validity**: Must be a known Excalidraw element type
3. **Property types**: Correct data types for all properties
4. **Enum values**: Valid fillStyle, strokeStyle, arrowhead values
5. **File structure**: type="excalidraw", elements array, appState

## Export

### SVG Export
- Built-in renderer
- Supports all element types
- Dark mode support

### PNG Export
- Requires Playwright
- Headless Chrome rendering
- Scale factor support

## Testing

- Unit tests: Element creation, file operations, validation
- Integration tests: CLI commands, pipelines
- Stability tests: 100x test runs

## Version History

See CHANGELOG.md for release history.
