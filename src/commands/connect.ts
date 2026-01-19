import { Command } from 'commander';
import { readFile, writeFile } from '../utils/file.js';
import { createElement } from '../utils/element.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ExcalidrawFile, ExcalidrawElement } from '../types/excalidraw.js';

export interface ConnectOptions {
  from: string;
  to: string;
  style?: 'arrow' | 'line';
  label?: string;
  color?: string;
}

/**
 * Calculate connection points between two elements
 */
function getConnectionPoints(
  from: ExcalidrawElement,
  to: ExcalidrawElement
): { startX: number; startY: number; endX: number; endY: number } {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;

  // Determine connection points based on relative positions
  let startX: number, startY: number, endX: number, endY: number;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  // Connect from edges based on direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      // Connect from right to left
      startX = from.x + from.width;
      startY = fromCenterY;
      endX = to.x;
      endY = toCenterY;
    } else {
      // Connect from left to right
      startX = from.x;
      startY = fromCenterY;
      endX = to.x + to.width;
      endY = toCenterY;
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      // Connect from bottom to top
      startX = fromCenterX;
      startY = from.y + from.height;
      endX = toCenterX;
      endY = to.y;
    } else {
      // Connect from top to bottom
      startX = fromCenterX;
      startY = from.y;
      endX = toCenterX;
      endY = to.y + to.height;
    }
  }

  return { startX, startY, endX, endY };
}

export function connectCommand(): Command {
  return new Command('connect')
    .description('Connect two elements with an arrow or line')
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
      const fromEl = file.elements.find(el => el.id === options.from || el.id.startsWith(options.from));
      const toEl = file.elements.find(el => el.id === options.to || el.id.startsWith(options.to));

      if (!fromEl) {
        console.error(`Error: Source element not found: ${options.from}`);
        process.exit(1);
      }
      if (!toEl) {
        console.error(`Error: Target element not found: ${options.to}`);
        process.exit(1);
      }

      // Calculate connection points
      const points = getConnectionPoints(fromEl, toEl);

      // Create the connection element
      const connectionEl = createElement({
        type: options.style === 'line' ? 'line' : 'arrow',
        x: points.startX,
        y: points.startY,
        points: [
          [0, 0],
          [points.endX - points.startX, points.endY - points.startY]
        ],
        strokeColor: options.color,
        endArrowhead: options.style === 'arrow' ? 'arrow' : null
      });

      file.elements.push(connectionEl);

      // If label provided, add text element at midpoint
      let labelEl: ExcalidrawElement | null = null;
      if (options.label) {
        const midX = (points.startX + points.endX) / 2;
        const midY = (points.startY + points.endY) / 2;

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
          type: options.style
        },
        label: labelEl ? { id: labelEl.id, text: options.label } : null
      });
    });
}
