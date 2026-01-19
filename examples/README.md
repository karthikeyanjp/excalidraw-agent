# Example Diagrams

These diagrams were created entirely with excalidraw-agent commands.

## 1. Flowchart (`flowchart.excalidraw`)

A standard flowchart showing process flow with decision branching.

![Flowchart](diagrams/flowchart.png)

**Created with:**
```bash
# Create shapes with IDs
excalidraw-agent add diagram.excalidraw --type ellipse --x 200 --y 20 \
  --width 100 --height 50 --fill "#d3f9d8" --label "Start" --id start

excalidraw-agent add diagram.excalidraw --type diamond --x 175 --y 230 \
  --width 150 --height 80 --fill "#fff3bf" --label "Valid?" --id decision

# Connect with edge-to-edge arrows
excalidraw-agent connect diagram.excalidraw --from start --to process1
excalidraw-agent connect diagram.excalidraw --from decision --to error --label "No"
```

## 2. Microservices Architecture (`microservices.excalidraw`)

Multi-tier architecture with services, message queue, and databases.

![Microservices](diagrams/microservices.png)

**Features:**
- Client → API Gateway → Services
- Services → Message Queue (async)
- Services → Databases
- Color-coded by layer

## 3. Quick DSL Demo (`quick-demo.excalidraw`)

Created with single command using DSL syntax.

![Quick Demo](diagrams/quick-demo.png)

```bash
excalidraw-agent quick "[Input] -> [Process] -> {Valid?} -> [Output]" \
  -o diagram.excalidraw --style colorful
```

## DSL Syntax Reference

| Syntax | Shape |
|--------|-------|
| `[Label]` | Rectangle |
| `(Label)` | Ellipse |
| `{Label}` | Diamond |
| `<Label>` | Text |
| `->` | Arrow |
| `-->` | Dashed arrow |
| `--` | Line |
