#!/bin/bash
# Generate all example diagrams

set -e

echo "Generating example diagrams..."

# Simple flowchart
echo "1. Creating flowchart..."
excalidraw-agent quick "(Start) -> [Input] -> [Process] -> {Valid?} -> [Output] -> (End)" \
  -o flowchart.excalidraw --force

# Architecture diagram
echo "2. Creating architecture diagram..."
excalidraw-agent quick "[Web App] -> [API Gateway] -> [Auth Service]" \
  -o architecture.excalidraw --style colorful --force

# Add more services to architecture
excalidraw-agent add architecture.excalidraw --data '{
  "type": "rectangle",
  "x": 100,
  "y": 200,
  "width": 150,
  "height": 60,
  "backgroundColor": "#b2f2bb",
  "fillStyle": "solid"
}'
excalidraw-agent add architecture.excalidraw --data '{
  "type": "text",
  "x": 120,
  "y": 220,
  "text": "User Service",
  "fontSize": 16
}'

# Vertical diagram
echo "3. Creating vertical diagram..."
excalidraw-agent quick "[Design] -> [Develop] -> [Test] -> [Deploy]" \
  -o vertical.excalidraw --direction vertical --style minimal --force

# Blueprint style
echo "4. Creating blueprint diagram..."
excalidraw-agent quick "[Frontend] -> [Backend] -> [[Database]]" \
  -o blueprint.excalidraw --style blueprint --force

# Decision tree
echo "5. Creating decision tree..."
excalidraw-agent quick "(Start) -> {Is Valid?} -> [Process] -> {Complete?} -> (End)" \
  -o decision-tree.excalidraw --force

# Export all to PNG
echo "6. Exporting to PNG..."
for f in *.excalidraw; do
  name="${f%.excalidraw}"
  excalidraw-agent export "$f" --output "${name}.png" 2>/dev/null || echo "  Skipped PNG for $f (Playwright not installed)"
done

# Validate all
echo "7. Validating all diagrams..."
for f in *.excalidraw; do
  if excalidraw-agent validate "$f" --json | grep -q '"valid":true'; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f (validation failed)"
  fi
done

echo ""
echo "Done! Generated examples:"
ls -la *.excalidraw
