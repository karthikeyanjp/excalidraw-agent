# Examples

This directory contains example diagrams and scripts for excalidraw-agent.

## Quick Start Examples

### Simple Flowchart
```bash
excalidraw-agent quick "(Start) -> [Process] -> {Done?} -> (End)" -o flowchart.excalidraw
```

### Architecture Diagram
```bash
excalidraw-agent quick "[Frontend] -> [API Gateway] -> [Backend] -> [[Database]]" \
  -o architecture.excalidraw --style colorful
```

### Vertical Layout
```bash
excalidraw-agent quick "[Step 1] -> [Step 2] -> [Step 3]" \
  -o vertical.excalidraw --direction vertical
```

## Script Examples

### create-architecture.sh
Creates a microservices architecture diagram with custom positioning.

```bash
./create-architecture.sh
```

### batch-operations.sh  
Demonstrates batch operations for complex diagrams.

```bash
./batch-operations.sh
```

## Sample Diagrams

| File | Description |
|------|-------------|
| `flowchart.excalidraw` | Simple process flow |
| `architecture.excalidraw` | Microservices architecture |
| `decision-tree.excalidraw` | Decision flowchart |
| `sequence.excalidraw` | Sequence diagram style |

## Generating Examples

Run the generate script to create all examples:

```bash
./generate-examples.sh
```
