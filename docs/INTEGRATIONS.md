# AI Agent Integrations

This guide explains how to integrate `excalidraw-agent` with AI coding assistants and agents.

## Table of Contents
- [Cursor](#cursor)
- [Claude Code](#claude-code)
- [Clawdbot](#clawdbot)
- [Generic AI Agents](#generic-ai-agents)
- [MCP Integration](#mcp-integration)
- [Best Practices](#best-practices)

---

## Cursor

[Cursor](https://cursor.sh) is an AI-powered code editor. Use excalidraw-agent to create architecture diagrams directly from your codebase.

### Setup

Add to your project's `.cursorrules`:

```markdown
## Diagram Generation

When creating diagrams, use excalidraw-agent CLI:
- Install: npm install -g excalidraw-agent
- Create: excalidraw-agent quick "<DSL>" -o diagram.excalidraw
- Export: excalidraw-agent export diagram.excalidraw --output diagram.png

### DSL Reference
- [Label] = Rectangle (process/step)
- (Label) = Ellipse (start/end)
- {Label} = Diamond (decision)
- -> = Arrow
- --> = Dashed arrow
```

### Example Prompts

**Architecture Diagram:**
```
Create an architecture diagram showing:
API Gateway -> Auth Service -> User DB
           -> Product Service -> Product DB
Save as architecture.excalidraw and export to PNG
```

**Flow from Code:**
```
Analyze the checkout flow in src/checkout.ts and create a flowchart
```

---

## Claude Code

[Claude Code](https://claude.ai/code) is Anthropic's AI coding agent. It can use excalidraw-agent via shell commands.

### Setup

Ensure excalidraw-agent is installed globally:
```bash
npm install -g excalidraw-agent
```

### CLAUDE.md Configuration

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

# Export to PNG
excalidraw-agent export file.excalidraw --output out.png
```

### Style Presets
- default: Soft pastels
- colorful: Vibrant
- minimal: Grayscale
- blueprint: Dark blue
```

---

## Clawdbot

[Clawdbot](https://github.com/codefrau/clawdbot) is a multi-channel AI assistant. excalidraw-agent integrates via shell commands.

### Setup

Install on the host running Clawdbot:
```bash
npm install -g excalidraw-agent
npx playwright install chromium  # For PNG export
```

### Usage

Ask Clawdbot to create diagrams:

**User:** Create a deployment pipeline diagram: Build -> Test -> Stage -> Production

**Clawdbot:**
```bash
excalidraw-agent quick "(Start) -> [Build] -> [Test] -> [Stage] -> [Production] -> (Done)" \
  -o deployment-pipeline.excalidraw --style colorful

excalidraw-agent export deployment-pipeline.excalidraw --output deployment-pipeline.png
```

### Skill Configuration

Create a Clawdbot skill at `skills/excalidraw/SKILL.md`:

```markdown
## Excalidraw Diagram Skill

Use excalidraw-agent CLI for creating diagrams.

### Commands
- excalidraw-agent quick "<DSL>" -o <file>
- excalidraw-agent create <file>
- excalidraw-agent add <file> --data '<json>'
- excalidraw-agent export <file> --output <out>

### DSL Syntax
- [Label] = Rectangle
- (Label) = Ellipse
- {Label} = Diamond
- -> = Arrow
- --> = Dashed arrow
```

---

## Generic AI Agents

For any AI agent with shell access, add these instructions to the system prompt:

### System Prompt Template

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

## Export
excalidraw-agent export diagram.excalidraw --output diagram.png

## Utilities
excalidraw-agent list diagram.excalidraw --format table
excalidraw-agent info diagram.excalidraw
excalidraw-agent validate diagram.excalidraw

All output is JSON for easy parsing. Use --verbose for debugging.
```

### JSON Output

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

excalidraw-agent can be exposed as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server.

### Configuration (Planned)

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

### Tools (Planned)

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
  "backgroundColor": "#a5d8ff"
}'
```

### 3. Use stdin for Cross-Platform JSON
```bash
echo '{"type":"rectangle","x":0,"y":0}' | excalidraw-agent add file.excalidraw --stdin
```

### 4. Validate Before Sharing
```bash
excalidraw-agent validate diagram.excalidraw --strict
```

### 5. Export for Documentation
```bash
excalidraw-agent export diagram.excalidraw --output preview.png --scale 2
```

### 6. Use Batch for Atomic Operations
```bash
excalidraw-agent batch diagram.excalidraw --stdin << 'EOF'
[
  {"op":"add","element":{"type":"rectangle","x":0,"y":0,"width":100,"height":50}},
  {"op":"add","element":{"type":"text","x":10,"y":15,"text":"Box 1"}}
]
EOF
```

---

## Troubleshooting

### PNG Export Fails
```bash
npm install -g playwright
npx playwright install chromium
```

### Command Not Found
```bash
npm install -g excalidraw-agent
# Or use npx
npx excalidraw-agent quick "[A] -> [B]" -o out.excalidraw
```

### Windows Shell Issues
Use stdin for JSON data instead of shell quoting:
```bash
echo '{"type":"rectangle"}' | excalidraw-agent add file.excalidraw --stdin
```
