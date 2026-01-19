import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readFile, calculateBounds } from '../utils/file.js';
import { outputJson, verbose, info } from '../utils/output.js';
import type { ExcalidrawFile } from '../types/excalidraw.js';

export interface ExportOptions {
  output: string;
  format?: 'png' | 'svg';
  scale?: string;
  background?: string;
  dark?: boolean;
  padding?: string;
  embedScene?: boolean;
}

/**
 * Generate SVG from Excalidraw elements (basic implementation)
 * For full fidelity, use Playwright with the actual Excalidraw renderer
 */
function generateBasicSvg(file: ExcalidrawFile, options: {
  padding: number;
  backgroundColor: string;
  dark: boolean;
}): string {
  const elements = file.elements.filter(el => !el.isDeleted);
  const bounds = calculateBounds(elements);
  
  const width = bounds.width + options.padding * 2;
  const height = bounds.height + options.padding * 2;
  const offsetX = -bounds.x + options.padding;
  const offsetY = -bounds.y + options.padding;
  
  const bg = options.dark ? '#121212' : options.backgroundColor;
  const defaultStroke = options.dark ? '#ffffff' : '#1e1e1e';
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  svg += `  <rect width="100%" height="100%" fill="${bg}"/>\n`;
  svg += `  <g transform="translate(${offsetX}, ${offsetY})">\n`;
  
  for (const el of elements) {
    const stroke = el.strokeColor === '#1e1e1e' && options.dark ? '#ffffff' : el.strokeColor;
    const fill = el.backgroundColor === 'transparent' ? 'none' : el.backgroundColor;
    const strokeWidth = el.strokeWidth;
    const strokeDash = el.strokeStyle === 'dashed' ? 'stroke-dasharray="8 4"' : 
                       el.strokeStyle === 'dotted' ? 'stroke-dasharray="2 4"' : '';
    const opacity = el.opacity / 100;
    
    switch (el.type) {
      case 'rectangle':
        svg += `    <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" `;
        svg += `stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" ${strokeDash} `;
        svg += `opacity="${opacity}" rx="3"/>\n`;
        break;
        
      case 'ellipse':
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        svg += `    <ellipse cx="${cx}" cy="${cy}" rx="${el.width / 2}" ry="${el.height / 2}" `;
        svg += `stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" ${strokeDash} `;
        svg += `opacity="${opacity}"/>\n`;
        break;
        
      case 'diamond':
        const dx = el.x + el.width / 2;
        const dy1 = el.y;
        const dy2 = el.y + el.height / 2;
        const dy3 = el.y + el.height;
        const points = `${dx},${dy1} ${el.x + el.width},${dy2} ${dx},${dy3} ${el.x},${dy2}`;
        svg += `    <polygon points="${points}" `;
        svg += `stroke="${stroke}" fill="${fill}" stroke-width="${strokeWidth}" ${strokeDash} `;
        svg += `opacity="${opacity}"/>\n`;
        break;
        
      case 'text':
        if ('text' in el) {
          const fontSize = el.fontSize ?? 20;
          const textLines = el.text.split('\n');
          const textFill = stroke;
          svg += `    <text x="${el.x}" y="${el.y + fontSize}" fill="${textFill}" `;
          svg += `font-size="${fontSize}" font-family="Virgil, sans-serif" opacity="${opacity}">\n`;
          for (let i = 0; i < textLines.length; i++) {
            svg += `      <tspan x="${el.x}" dy="${i === 0 ? 0 : fontSize * 1.2}">${escapeXml(textLines[i])}</tspan>\n`;
          }
          svg += `    </text>\n`;
        }
        break;
        
      case 'line':
      case 'arrow':
        if ('points' in el && el.points.length >= 2) {
          const pathPoints = el.points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${el.x + p[0]} ${el.y + p[1]}`
          ).join(' ');
          
          const markerId = el.type === 'arrow' ? `url(#arrow-${el.id.slice(0, 8)})` : '';
          
          if (el.type === 'arrow') {
            svg += `    <defs>\n`;
            svg += `      <marker id="arrow-${el.id.slice(0, 8)}" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">\n`;
            svg += `        <polygon points="0 0, 10 3.5, 0 7" fill="${stroke}"/>\n`;
            svg += `      </marker>\n`;
            svg += `    </defs>\n`;
          }
          
          svg += `    <path d="${pathPoints}" stroke="${stroke}" fill="none" `;
          svg += `stroke-width="${strokeWidth}" ${strokeDash} opacity="${opacity}"`;
          if (markerId) svg += ` marker-end="${markerId}"`;
          svg += `/>\n`;
        }
        break;
        
      case 'freedraw':
        if ('points' in el && el.points.length >= 2) {
          const pathPoints = el.points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${el.x + p[0]} ${el.y + p[1]}`
          ).join(' ');
          svg += `    <path d="${pathPoints}" stroke="${stroke}" fill="none" `;
          svg += `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" `;
          svg += `opacity="${opacity}"/>\n`;
        }
        break;
    }
  }
  
  svg += `  </g>\n`;
  svg += `</svg>`;
  
  return svg;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportCommand(): Command {
  return new Command('export')
    .description('Export to PNG or SVG')
    .argument('<file>', 'Path to the .excalidraw file')
    .requiredOption('--output <file>', 'Output file path')
    .option('--format <fmt>', 'Output format (png, svg) - auto-detected from extension')
    .option('--scale <n>', 'Scale factor', '1')
    .option('--background <color>', 'Override background color')
    .option('--dark', 'Dark mode')
    .option('--padding <n>', 'Padding in pixels', '10')
    .option('--embed-scene', 'Embed scene data in PNG')
    .action(async (filePath: string, options: ExportOptions) => {
      verbose(`Exporting: ${filePath} -> ${options.output}`);
      
      const file = readFile(filePath);
      
      // Determine format from extension if not specified
      const ext = path.extname(options.output).toLowerCase();
      const format = options.format ?? (ext === '.png' ? 'png' : 'svg');
      
      const padding = parseInt(options.padding ?? '10', 10);
      const backgroundColor = options.background ?? file.appState.viewBackgroundColor;
      
      if (format === 'svg') {
        const svg = generateBasicSvg(file, {
          padding,
          backgroundColor,
          dark: options.dark ?? false
        });
        
        fs.writeFileSync(options.output, svg, 'utf-8');
        
        const bounds = calculateBounds(file.elements.filter(el => !el.isDeleted));
        
        outputJson({
          success: true,
          format: 'svg',
          output: options.output,
          width: bounds.width + padding * 2,
          height: bounds.height + padding * 2
        });
      } else if (format === 'png') {
        const scale = parseFloat(options.scale ?? '1');
        
        // Generate SVG first
        const svg = generateBasicSvg(file, {
          padding,
          backgroundColor,
          dark: options.dark ?? false
        });
        
        const bounds = calculateBounds(file.elements.filter(el => !el.isDeleted));
        const width = Math.ceil((bounds.width + padding * 2) * scale);
        const height = Math.ceil((bounds.height + padding * 2) * scale);
        
        try {
          // Use Playwright for PNG export
          const { chromium } = await import('playwright');
          
          verbose('Launching headless browser for PNG export...');
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage();
          
          // Create HTML page with embedded SVG
          const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; }
    body { background: ${backgroundColor}; }
    svg { display: block; }
  </style>
</head>
<body>${svg}</body>
</html>`;
          
          await page.setContent(html);
          await page.setViewportSize({ width, height });
          
          // Take screenshot
          await page.screenshot({
            path: options.output,
            type: 'png',
            clip: { x: 0, y: 0, width, height }
          });
          
          await browser.close();
          verbose('Browser closed');
          
          outputJson({
            success: true,
            format: 'png',
            output: options.output,
            width,
            height,
            scale
          });
        } catch (err: any) {
          // Fallback if Playwright fails
          if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('playwright')) {
            info('PNG export requires Playwright. Install with: npm install playwright');
            info('Then run: npx playwright install chromium');
            
            const svgPath = options.output.replace(/\.png$/, '.svg');
            fs.writeFileSync(svgPath, svg, 'utf-8');
            
            outputJson({
              success: false,
              error: 'Playwright not available - SVG exported instead',
              svgOutput: svgPath,
              hint: 'Install Playwright: npm install playwright && npx playwright install chromium'
            });
            process.exit(5);
          } else {
            throw err;
          }
        }
      }
    });
}
