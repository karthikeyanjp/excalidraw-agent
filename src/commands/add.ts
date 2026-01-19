import { Command } from 'commander';
import * as fs from 'node:fs';
import { readFile, writeFile } from '../utils/file.js';
import { createElement, validateElementInput, InvalidElementError } from '../utils/element.js';
import { outputJson, verbose } from '../utils/output.js';
import type { ElementInput, ElementType, FillStyle, StrokeStyle, Arrowhead, FontFamily, TextAlign } from '../types/excalidraw.js';

export interface AddOptions {
  type?: ElementType;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  data?: string;
  stdin?: boolean;
  id?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: string;
  strokeStyle?: StrokeStyle;
  fillStyle?: FillStyle;
  roughness?: string;
  opacity?: string;
  text?: string;
  fontSize?: string;
  fontFamily?: string;
  textAlign?: TextAlign;
  points?: string;
  startBinding?: string;
  endBinding?: string;
  startArrow?: Arrowhead;
  endArrow?: Arrowhead;
  label?: string;
  labelSize?: string;
  centerIn?: string;
}

/**
 * Parse element inputs from various sources
 */
async function parseElementInputs(options: AddOptions): Promise<ElementInput[]> {
  // From stdin
  if (options.stdin) {
    const input = await readStdin();
    const parsed = JSON.parse(input);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      validateElementInput(item);
    }
    return items;
  }
  
  // From --data JSON
  if (options.data) {
    const parsed = JSON.parse(options.data);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      validateElementInput(item);
    }
    return items;
  }
  
  // From CLI options
  if (!options.type) {
    throw new InvalidElementError('--type is required when not using --stdin or --data');
  }
  
  if (options.x === undefined || options.y === undefined) {
    throw new InvalidElementError('--x and --y are required');
  }
  
  const input: ElementInput = {
    type: options.type,
    x: parseFloat(options.x),
    y: parseFloat(options.y)
  };
  
  if (options.id) input.id = options.id;
  if (options.width) input.width = parseFloat(options.width);
  if (options.height) input.height = parseFloat(options.height);
  if (options.stroke) input.strokeColor = options.stroke;
  if (options.fill) input.backgroundColor = options.fill;
  if (options.strokeWidth) input.strokeWidth = parseFloat(options.strokeWidth);
  if (options.strokeStyle) input.strokeStyle = options.strokeStyle;
  if (options.fillStyle) input.fillStyle = options.fillStyle;
  if (options.roughness) input.roughness = parseInt(options.roughness, 10);
  if (options.opacity) input.opacity = parseInt(options.opacity, 10);
  
  // Text options
  if (options.text) input.text = options.text;
  if (options.fontSize) input.fontSize = parseInt(options.fontSize, 10);
  if (options.fontFamily) input.fontFamily = parseInt(options.fontFamily, 10) as FontFamily;
  if (options.textAlign) input.textAlign = options.textAlign;
  
  // Line/arrow options
  if (options.points) input.points = JSON.parse(options.points);
  if (options.startArrow) input.startArrowhead = options.startArrow;
  if (options.endArrow) input.endArrowhead = options.endArrow;
  
  // Bindings
  if (options.startBinding) {
    input.startBinding = { elementId: options.startBinding, focus: 0, gap: 5 };
  }
  if (options.endBinding) {
    input.endBinding = { elementId: options.endBinding, focus: 0, gap: 5 };
  }
  
  return [input];
}

/**
 * Read from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    if (process.stdin.isTTY) {
      reject(new Error('No input provided on stdin'));
      return;
    }
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

export function addCommand(): Command {
  return new Command('add')
    .description('Add elements to an Excalidraw file')
    .argument('<file>', 'Path to the .excalidraw file')
    .option('--type <type>', 'Element type (rectangle, ellipse, diamond, text, line, arrow, freedraw)')
    .option('--x <n>', 'X position')
    .option('--y <n>', 'Y position')
    .option('--width <n>', 'Width')
    .option('--height <n>', 'Height')
    .option('--data <json>', 'Full element JSON')
    .option('--stdin', 'Read element(s) from stdin')
    .option('--id <id>', 'Custom element ID')
    .option('--stroke <color>', 'Stroke color')
    .option('--fill <color>', 'Fill/background color')
    .option('--stroke-width <n>', 'Stroke width')
    .option('--stroke-style <style>', 'Stroke style (solid, dashed, dotted)')
    .option('--fill-style <style>', 'Fill style (solid, hachure, cross-hatch)')
    .option('--roughness <n>', 'Roughness (0=architect, 1=artist, 2=cartoonist)')
    .option('--opacity <n>', 'Opacity (0-100)')
    .option('--text <string>', 'Text content (for text elements)')
    .option('--font-size <n>', 'Font size')
    .option('--font-family <n>', 'Font family (1=Virgil, 2=Helvetica, 3=Cascadia)')
    .option('--text-align <align>', 'Text alignment (left, center, right)')
    .option('--points <json>', 'Points array for line/arrow [[x,y],...]')
    .option('--start-binding <id>', 'Bind start to element ID')
    .option('--end-binding <id>', 'Bind end to element ID')
    .option('--start-arrow <type>', 'Start arrowhead (arrow, bar, dot, triangle)')
    .option('--end-arrow <type>', 'End arrowhead (arrow, bar, dot, triangle)')
    .option('--label <text>', 'Add centered label text within the shape')
    .option('--label-size <n>', 'Label font size (default: 16)')
    .option('--center-in <id>', 'Center this text element within another element')
    .action(async (filePath: string, options: AddOptions) => {
      try {
        verbose(`Adding elements to: ${filePath}`);
        
        // Read existing file
        const file = readFile(filePath);
        
        // Parse inputs
        const inputs = await parseElementInputs(options);
        
        // Create elements
        const newElements = inputs.map(input => {
          verbose(`Creating ${input.type} at (${input.x}, ${input.y})`);
          return createElement(input);
        });
        
        // Handle --center-in: center text element within another element
        if (options.centerIn && newElements.length === 1 && newElements[0].type === 'text') {
          const targetEl = file.elements.find(el => 
            el.id === options.centerIn || el.id.startsWith(options.centerIn!)
          );
          if (targetEl) {
            const textEl = newElements[0];
            // Center horizontally and vertically within target
            textEl.x = targetEl.x + (targetEl.width - textEl.width) / 2;
            textEl.y = targetEl.y + (targetEl.height - textEl.height) / 2;
            verbose(`Centered text in ${targetEl.id}`);
          }
        }
        
        // Handle --label: add centered text to shape elements
        if (options.label) {
          const labelFontSize = parseInt(options.labelSize ?? '16', 10);
          for (const el of newElements) {
            if (['rectangle', 'ellipse', 'diamond'].includes(el.type)) {
              // Estimate text dimensions
              const textWidth = options.label.length * labelFontSize * 0.6;
              const textHeight = labelFontSize * 1.25;
              
              const labelEl = createElement({
                type: 'text',
                x: el.x + (el.width - textWidth) / 2,
                y: el.y + (el.height - textHeight) / 2,
                text: options.label,
                fontSize: labelFontSize,
                textAlign: 'center'
              });
              newElements.push(labelEl);
              verbose(`Added centered label to ${el.type}`);
            }
          }
        }
        
        // Add to file
        file.elements.push(...newElements);
        
        // Save
        writeFile(filePath, file, { force: true });
        
        verbose(`Added ${newElements.length} element(s)`);
        
        outputJson({
          success: true,
          added: newElements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height
          }))
        });
      } catch (err) {
        if (err instanceof InvalidElementError) {
          console.error(`Error: ${err.message}`);
          process.exit(4);
        }
        throw err;
      }
    });
}
