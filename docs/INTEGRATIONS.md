# AI Agent Integrations

This guide explains how to use `excalidraw-agent` with popular AI coding assistants and agents.

## Table of Contents
- [Cursor](#cursor)
- [Claude Code](#claude-code)
- [Clawdbot](#clawdbot)
- [Generic AI Agents](#generic-ai-agents)
- [MCP Integration](#mcp-integration)

---

## Cursor

[Cursor](https://cursor.sh) is an AI-powered code editor. You can use excalidraw-agent to create architecture diagrams directly from your codebase.

### Setup

Add to your project's `.cursorrules` or instruct Cursor:

```
When asked to create diagrams or visualizations, use the excalidraw-agent CLI:
- Install: npm install -g excalidraw-agent
- Create diagrams with: excalidraw-agent quick "<DSL>" -o diagram.excalidraw
- Export to PNG: excalidraw-agent export diagram.excalidraw --output diagram.png
```

### Example Prompts

**Architecture Diagram:**
```
Create an architecture diagram showing our microservices: 
API Gateway -> Auth Service -> User DB
           -> Product Service -> Product DB
           -> Order Service -> Order DB
Save it as architecture.excalidraw
```

Cursor will run:
```bash
excalidraw-agent quick "[API Gateway] -> [Auth Service] -> [[User DB]]" -o architecture.excalidraw --style colorful
excalidraw-agent add architecture.excalidraw --data '{"type":"arrow","x":200,"y":130,"points":[[0,0],[100,50]]}'
# ... additional elements
excalidraw-agent export architecture.excalidraw --output architecture.png
```

**Flow Diagram from Code:**
```
Analyze the checkout flow in src/checkout.ts and create a flowchart showing the process
```

### Cursor Rules Template

```markdown
# .cursorrules

## Diagram Generation
When creating diagrams:
1. Use excalidraw-agent CLI for all diagram creation
2. Use the quick DSL for simple flows: `excalidraw-agent quick "[A] -> [B]" -o out.excalidraw`
3. Use JSON data for complex elements
4. Always validate: `excalidraw-agent validate diagram.excalidraw`
5. Export to PNG for preview: `excalidraw-agent export diagram.excalidraw --output diagram.png`

## DSL Reference
- [Label] = Rectangle (process/step)
- (Label) = Ellipse (start/end)
- {Label} = Diamond (decision)
- -> = Arrow, --> = Dashed arrow
```

---

## Claude Code

[Claude Code](https://claude.ai/code) is Anthropic's AI coding agent. It can use excalidraw-agent via shell commands.

### Setup

Ensure excalidraw-agent is installed globally:
```bash
npm install -g excalidraw-agent
```

### Example Session

**You:** Create a sequence diagram showing the OAuth flow

**Claude Code:**
```bash
# Create the OAuth flow diagram
excalidraw-agent create oauth-flow.excalidraw --force

# Add the actors/services
excalidraw-agent add oauth-flow.excalidraw --data '{
  "type": "rectangle", "x": 50, "y": 50, "width": 100, "height": 40,
  "backgroundColor": "#a5d8ff", "fillStyle": "solid"
}'
excalidraw-agent add oauth-flow.excalidraw --data '{
  "type": "text", "x": 70, "y": 60, "text": "Client", "fontSize": 16
}'

# ... more elements ...

# Validate and export
excalidraw-agent validate oauth-flow.excalidraw
excalidraw-agent export oauth-flow.excalidraw --output oauth-flow.png
```

### CLAUDE.md Instructions

Add to your project's `CLAUDE.md`:

```markdown
## Diagram Tools

This project uses excalidraw-agent for diagram generation.

### Quick Reference
```bash
# Quick diagram from DSL
excalidraw-agent quick "[Step 1] -> [Step 2] -> {Done?}" -o flow.excalidraw

# Add custom element
excalidraw-agent add file.excalidraw --data '{"type":"rectangle","x":0,"y":0,"width":100,"height":50}'

# List elements
excalidraw-agent list file.excalidraw --format table

# Export
excalidraw-agent export file.excalidraw --output out.png
```

### Style Presets
- `--style default` - Soft pastels
- `--style colorful` - Vibrant
- `--style minimal` - Clean grayscale
- `--style blueprint` - Dark blue theme
```

---

## Clawdbot

[Clawdbot](https://github.com/codefrau/clawdbot) is a multi-channel AI assistant. excalidraw-agent integrates seamlessly via shell commands.

### Setup

excalidraw-agent should be installed on the host running Clawdbot:
```bash
npm install -g excalidraw-agent
npx playwright install chromium  # For PNG export
```

### Using with Clawdbot

Simply ask Clawdbot to create diagrams:

**You:** Create a diagram showing our deployment pipeline: Build -> Test -> Stage -> Production

**Clawdbot (Pip 🦊):**
```bash
excalidraw-agent quick "(Start) -> [Build] -> [Test] -> [Stage] -> [Production] -> (Done)" \
  -o /Users/karthikp/clawd/deployment-pipeline.excalidraw \
  --style colorful

excalidraw-agent export /Users/karthikp/clawd/deployment-pipeline.excalidraw \
  --output /Users/karthikp/clawd/deployment-pipeline.png

open /Users/karthikp/clawd/deployment-pipeline.png
```

### Skill Integration

You can create a Clawdbot skill for enhanced diagram support:

```markdown
# skills/excalidraw/SKILL.md

## Excalidraw Diagram Skill

Use excalidraw-agent CLI for creating diagrams.

### Commands
- `excalidraw-agent quick "<DSL>" -o <file>` - Quick diagram
- `excalidraw-agent create <file>` - New empty file
- `excalidraw-agent add <file> --data '<json>'` - Add element
- `excalidraw-agent export <file> --output <out>` - Export PNG/SVG

### DSL Syntax
- `[Label]` = Rectangle
- `(Label)` = Ellipse
- `{Label}` = Diamond
- `->` = Arrow
- `-->` = Dashed arrow

### Examples
```bash
# Architecture diagram
excalidraw-agent quick "[Frontend] -> [API] -> [[Database]]" -o arch.excalidraw

# Flowchart with decision
excalidraw-agent quick "(Start) -> [Process] -> {OK?} -> [Done]" -o flow.excalidraw
```
```

---

## Generic AI Agents

For any AI agent with shell access, provide these instructions:

### System Prompt Addition

```
You have access to excalidraw-agent, a CLI for creating Excalidraw diagrams.

## Quick Diagram (DSL)
excalidraw-agent quick "<dsl>" -o output.excalidraw
- [Label] = Rectangle
- (Label) = Ellipse  
- {Label} = Diamond
- -> = Arrow
- --> = Dashed arrow

## Manual Creation
excalidraw-agent create diagram.excalidraw
excalidraw-agent add diagram.excalidraw --data '{"type":"rectangle","x":100,"y":100,"width":150,"height":60}'
excalidraw-agent add diagram.excalidraw --data '{"type":"text","x":110,"y":120,"text":"Hello"}'

## Export
excalidraw-agent export diagram.excalidraw --output diagram.png
excalidraw-agent export diagram.excalidraw --output diagram.svg

## Utilities
excalidraw-agent list diagram.excalidraw --format table
excalidraw-agent info diagram.excalidraw
excalidraw-agent validate diagram.excalidraw

All output is JSON for easy parsing. Use --verbose for debugging.
```

### JSON Output Pattern

All commands support `--json` for structured output:

```bash
$ excalidraw-agent info diagram.excalidraw --json
{
  "version": 2,
  "source": "excalidraw-agent",
  "elementCount": 5,
  "elementTypes": { "rectangle": 2, "text": 2, "arrow": 1 },
  "bounds": { "x": 100, "y": 100, "width": 400, "height": 200 }
}
```

---

## MCP Integration

excalidraw-agent can be exposed as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server for tool-use capable models.

### MCP Server (Coming Soon)

```json
{
  "mcpServers": {
    "excalidraw": {
      "command": "excalidraw-agent",
      "args": ["mcp-serve"],
      "env": {}
    }
  }
}
```

### Tools Exposed

| Tool | Description |
|------|-------------|
| `excalidraw_create` | Create new diagram |
| `excalidraw_add` | Add element |
| `excalidraw_quick` | Quick DSL diagram |
| `excalidraw_export` | Export to PNG/SVG |
| `excalidraw_list` | List elements |
| `excalidraw_validate` | Validate file |

---

## Best Practices

### 1. Use Quick DSL for Simple Diagrams
```bash
excalidraw-agent quick "[A] -> [B] -> [C]" -o simple.excalidraw
```

### 2. Use JSON for Complex Positioning
```bash
excalidraw-agent add file.excalidraw --data '{
  "type": "rectangle",
  "x": 100,
  "y": 200,
  "width": 150,
  "height": 80,
  "backgroundColor": "#a5d8ff",
  "strokeColor": "#1864ab"
}'
```

### 3. Always Validate Before Sharing
```bash
excalidraw-agent validate diagram.excalidraw --strict
```

### 4. Export for Preview
```bash
excalidraw-agent export diagram.excalidraw --output preview.png --scale 2
```

### 5. Use Batch for Multiple Operations
```bash
excalidraw-agent batch diagram.excalidraw --ops '[
  {"op":"add","element":{"type":"rectangle","x":0,"y":0,"width":100,"height":50}},
  {"op":"add","element":{"type":"text","x":10,"y":15,"text":"Box 1"}}
]'
```

---

## Troubleshooting

### PNG Export Fails
```bash
# Install Playwright
npm install -g playwright
npx playwright install chromium
```

### Command Not Found
```bash
# Install globally
npm install -g excalidraw-agent

# Or use npx
npx excalidraw-agent quick "[A] -> [B]" -o out.excalidraw
```

### Validation Errors
```bash
# Check what's wrong
excalidraw-agent validate file.excalidraw

# Get detailed JSON output
excalidraw-agent validate file.excalidraw --json
```

---

## Examples Repository

See the [examples/](../examples/) directory for sample diagrams and scripts.
