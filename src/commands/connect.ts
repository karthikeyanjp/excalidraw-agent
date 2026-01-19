import { Command } from 'commander';
import { readFile, writeFile } from '../utils/file.js';
import { createElement } from '../utils/element.js';
import { generateVersionNonce } from '../utils/id.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ExcalidrawElement, Binding } from '../types/excalidraw.js';

export interface ConnectOptions {
  from: string;
  to: string;
  style?: 'arrow' | 'line';
  label?: string;
  color?: string;
}

/**
 * Determine which edge of an element faces another element
 */
function getClosestEdge(
  element: ExcalidrawElement,
  targetX: number,
  targetY: number
): 'left' | 'right' | 'top' | 'bottom' {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}

/**
 * Get the connection point on an element's edge
 */
function getEdgePoint(
  element: ExcalidrawElement,
  edge: 'left' | 'right' | 'top' | 'bottom'
): { x: number; y: number } {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  
  switch (edge) {
    case 'left':
      return { x: element.x, y: centerY };
    case 'right':
      return { x: element.x + element.width, y: centerY };
    case 'top':
      return { x: centerX, y: element.y };
    case 'bottom':
      return { x: centerX, y: element.y + element.height };
  }
}

/**
 * Calculate connection points and bindings between two elements
 */
function getConnectionData(
  from: ExcalidrawElement,
  to: ExcalidrawElement
): {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startBinding: Binding;
  endBinding: Binding;
} {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;

  // Determine which edges to connect
  const fromEdge = getClosestEdge(from, toCenterX, toCenterY);
  const toEdge = getClosestEdge(to, fromCenterX, fromCenterY);

  // Get edge points
  const startPoint = getEdgePoint(from, fromEdge);
  const endPoint = getEdgePoint(to, toEdge);

  return {
    startX: startPoint.x,
    startY: startPoint.y,
    endX: endPoint.x,
    endY: endPoint.y,
    startBinding: {
      elementId: from.id,
      focus: 0,
      gap: 1
    },
    endBinding: {
      elementId: to.id,
      focus: 0,
      gap: 1
    }
  };
}

/**
 * Add a bound element reference to an element
 */
function addBoundElement(
  element: ExcalidrawElement,
  boundId: string,
  boundType: string
): ExcalidrawElement {
  const currentBoundElements = element.boundElements ?? [];
  
  // Check if already bound
  if (currentBoundElements.some(b => b.id === boundId)) {
    return element;
  }
  
  return {
    ...element,
    boundElements: [...currentBoundElements, { id: boundId, type: boundType }],
    version: element.version + 1,
    versionNonce: generateVersionNonce(),
    updated: Date.now()
  };
}

export function connectCommand(): Command {
  return new Command('connect')
    .description('Connect two elements with a bound arrow or line')
    .argument('<file>', 'Path to the .excalidraw file')
    .requiredOption('--from <id>', 'ID of the source element')
    .requiredOption('--to <id>', 'ID of the target element')
    .option('--style <type>', 'Connection style: arrow or line', 'arrow')
    .option('--label <text>', 'Optional label on the connection')
    .option('--color <color>', 'Stroke color', '#1e1e1e')
    .action((filePath: string, options: ConnectOptions) => {
      verbose(`Connecting elements in: ${filePath}`);

      const file = readFile(filePath);

      // Find source and target elements
      const fromIdx = file.elements.findIndex(el => el.id === options.from || el.id.startsWith(options.from));
      const toIdx = file.elements.findIndex(el => el.id === options.to || el.id.startsWith(options.to));

      if (fromIdx === -1) {
        console.error(`Error: Source element not found: ${options.from}`);
        process.exit(1);
      }
      if (toIdx === -1) {
        console.error(`Error: Target element not found: ${options.to}`);
        process.exit(1);
      }

      const fromEl = file.elements[fromIdx];
      const toEl = file.elements[toIdx];

      // Calculate connection data with bindings
      const connData = getConnectionData(fromEl, toEl);

      // Create the connection element with bindings
      const connectionEl = createElement({
        type: options.style === 'line' ? 'line' : 'arrow',
        x: connData.startX,
        y: connData.startY,
        points: [
          [0, 0],
          [connData.endX - connData.startX, connData.endY - connData.startY]
        ],
        strokeColor: options.color,
        startBinding: connData.startBinding,
        endBinding: connData.endBinding,
        endArrowhead: options.style === 'arrow' ? 'arrow' : null
      });

      // Update source element with boundElements
      file.elements[fromIdx] = addBoundElement(fromEl, connectionEl.id, options.style === 'line' ? 'line' : 'arrow');
      
      // Update target element with boundElements
      file.elements[toIdx] = addBoundElement(toEl, connectionEl.id, options.style === 'line' ? 'line' : 'arrow');

      // Add the connection element
      file.elements.push(connectionEl);

      // If label provided, add text element at midpoint
      let labelEl: ExcalidrawElement | null = null;
      if (options.label) {
        const midX = (connData.startX + connData.endX) / 2;
        const midY = (connData.startY + connData.endY) / 2;

        labelEl = createElement({
          type: 'text',
          x: midX - 20,
          y: midY - 10,
          text: options.label,
          fontSize: 14
        });
        file.elements.push(labelEl);
      }

      writeFile(filePath, file, { force: true });

      outputJson({
        success: true,
        connection: {
          id: connectionEl.id,
          from: fromEl.id,
          to: toEl.id,
          type: options.style,
          bound: true
        },
        label: labelEl ? { id: labelEl.id, text: options.label } : null
      });
    });
}
