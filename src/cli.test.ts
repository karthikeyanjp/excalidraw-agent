import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const CLI = 'node dist/cli.js';

function run(cmd: string, options: { cwd?: string; input?: string } = {}): { stdout: string; stderr: string } {
  try {
    const stdout = execSync(`${CLI} ${cmd}`, {
      cwd: options.cwd || process.cwd(),
      encoding: 'utf-8',
      input: options.input
    });
    return { stdout, stderr: '' };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

function parseOutput(stdout: string): any {
  return JSON.parse(stdout);
}

describe('CLI Integration Tests', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'excalidraw-cli-test-'));
  });
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('create command', () => {
    it('should create a new excalidraw file', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      const { stdout } = run(`create "${file}"`);
      const result = parseOutput(stdout);
      
      expect(result.success).toBe(true);
      expect(result.elementCount).toBe(0);
      expect(fs.existsSync(file)).toBe(true);
    });

    it('should set custom background color', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      const { stdout } = run(`create "${file}" --background "#000000"`);
      const result = parseOutput(stdout);
      
      expect(result.appState.viewBackgroundColor).toBe('#000000');
    });

    it('should set custom grid size', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      const { stdout } = run(`create "${file}" --grid 20`);
      const result = parseOutput(stdout);
      
      expect(result.appState.gridSize).toBe(20);
    });

    it('should fail without --force if file exists', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      const { stderr } = run(`create "${file}"`);
      
      expect(stderr).toContain('already exists');
    });

    it('should overwrite with --force', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}" --background "#ffffff"`);
      const { stdout } = run(`create "${file}" --background "#000000" --force`);
      const result = parseOutput(stdout);
      
      expect(result.appState.viewBackgroundColor).toBe('#000000');
    });
  });

  describe('add command', () => {
    it('should add a rectangle', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const { stdout } = run(`add "${file}" --type rectangle --x 100 --y 100 --width 200 --height 100`);
      const result = parseOutput(stdout);
      
      expect(result.success).toBe(true);
      expect(result.added).toHaveLength(1);
      expect(result.added[0].type).toBe('rectangle');
      expect(result.added[0].x).toBe(100);
      expect(result.added[0].y).toBe(100);
    });

    it('should add a text element', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const { stdout } = run(`add "${file}" --type text --x 0 --y 0 --text "Hello"`);
      const result = parseOutput(stdout);
      
      expect(result.added[0].type).toBe('text');
    });

    it('should add element with custom ID', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const { stdout } = run(`add "${file}" --type rectangle --x 0 --y 0 --id my-rect-1`);
      const result = parseOutput(stdout);
      
      expect(result.added[0].id).toBe('my-rect-1');
    });

    it('should add elements from --data JSON', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const data = JSON.stringify({ type: 'ellipse', x: 50, y: 50, width: 100, height: 100 });
      const { stdout } = run(`add "${file}" --data '${data}'`);
      const result = parseOutput(stdout);
      
      expect(result.added[0].type).toBe('ellipse');
    });

    it('should add arrow with custom points', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const { stdout } = run(`add "${file}" --type arrow --x 0 --y 0 --points '[[0,0],[100,50]]'`);
      const result = parseOutput(stdout);
      
      expect(result.added[0].type).toBe('arrow');
    });
  });

  describe('list command', () => {
    it('should list all elements', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi"`);
      
      const { stdout } = run(`list "${file}"`);
      const elements = parseOutput(stdout);
      
      expect(elements).toHaveLength(2);
    });

    it('should filter by type', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi"`);
      
      const { stdout } = run(`list "${file}" --type rectangle`);
      const elements = parseOutput(stdout);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe('rectangle');
    });

    it('should filter by ID pattern', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --id rect-1`);
      run(`add "${file}" --type rectangle --x 100 --y 0 --id rect-2`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi" --id text-1`);
      
      const { stdout } = run(`list "${file}" --id 'rect-*'`);
      const elements = parseOutput(stdout);
      
      expect(elements).toHaveLength(2);
    });

    it('should output brief format', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0`);
      
      const { stdout } = run(`list "${file}" --brief`);
      const elements = parseOutput(stdout);
      
      expect(elements[0]).toHaveProperty('id');
      expect(elements[0]).toHaveProperty('type');
      expect(elements[0]).not.toHaveProperty('strokeColor');
    });
  });

  describe('modify command', () => {
    it('should modify element properties', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --id rect-1`);
      
      const { stdout } = run(`modify "${file}" --id rect-1 --set x=100 --set y=200`);
      const result = parseOutput(stdout);
      
      expect(result.success).toBe(true);
      expect(result.modified[0].x).toBe(100);
      expect(result.modified[0].y).toBe(200);
    });

    it('should support glob patterns', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --id rect-1`);
      run(`add "${file}" --type rectangle --x 100 --y 0 --id rect-2`);
      
      const { stdout } = run(`modify "${file}" --id 'rect-*' --set strokeColor="#ff0000"`);
      const result = parseOutput(stdout);
      
      expect(result.modified).toHaveLength(2);
    });

    it('should support --moveto', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --id rect-1`);
      
      const { stdout } = run(`modify "${file}" --id rect-1 --moveto 50,75`);
      const result = parseOutput(stdout);
      
      expect(result.modified[0].x).toBe(50);
      expect(result.modified[0].y).toBe(75);
    });

    it('should support --resize', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --width 100 --height 100 --id rect-1`);
      
      const { stdout } = run(`modify "${file}" --id rect-1 --resize 200,150`);
      const result = parseOutput(stdout);
      
      expect(result.modified[0].width).toBe(200);
      expect(result.modified[0].height).toBe(150);
    });
  });

  describe('delete command', () => {
    it('should delete by ID', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --id rect-1`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi" --id text-1`);
      
      run(`delete "${file}" --id rect-1`);
      
      const { stdout } = run(`list "${file}"`);
      const elements = parseOutput(stdout);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe('text');
    });

    it('should delete by type', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0`);
      run(`add "${file}" --type rectangle --x 100 --y 0`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi"`);
      
      run(`delete "${file}" --type rectangle`);
      
      const { stdout } = run(`list "${file}"`);
      const elements = parseOutput(stdout);
      
      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe('text');
    });

    it('should support --dry-run', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --id rect-1`);
      
      const { stdout } = run(`delete "${file}" --id rect-1 --dry-run`);
      const result = parseOutput(stdout);
      
      expect(result.dryRun).toBe(true);
      expect(result.wouldDelete).toHaveLength(1);
      
      // Element should still exist
      const { stdout: listOut } = run(`list "${file}"`);
      expect(parseOutput(listOut)).toHaveLength(1);
    });

    it('should delete all with --all', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi"`);
      
      run(`delete "${file}" --all`);
      
      const { stdout } = run(`list "${file}"`);
      const elements = parseOutput(stdout);
      
      expect(elements).toHaveLength(0);
    });
  });

  describe('info command', () => {
    it('should show file info', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --width 100 --height 50`);
      run(`add "${file}" --type text --x 50 --y 50 --text "Hi"`);
      
      const { stdout } = run(`info "${file}"`);
      const info = parseOutput(stdout);
      
      expect(info.version).toBe(2);
      expect(info.source).toBe('excalidraw-agent');
      expect(info.elementCount).toBe(2);
      expect(info.elementTypes.rectangle).toBe(1);
      expect(info.elementTypes.text).toBe(1);
    });
  });

  describe('export command', () => {
    it('should export to SVG', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      const output = path.join(tempDir, 'output.svg');
      
      run(`create "${file}"`);
      run(`add "${file}" --type rectangle --x 0 --y 0 --width 100 --height 50`);
      
      const { stdout } = run(`export "${file}" --output "${output}"`);
      const result = parseOutput(stdout);
      
      expect(result.success).toBe(true);
      expect(result.format).toBe('svg');
      expect(fs.existsSync(output)).toBe(true);
      
      const svg = fs.readFileSync(output, 'utf-8');
      expect(svg).toContain('<svg');
      expect(svg).toContain('<rect');
    });
  });

  describe('batch command', () => {
    it('should execute multiple operations', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const ops = JSON.stringify([
        { op: 'add', type: 'rectangle', x: 0, y: 0, width: 100, height: 50, id: 'rect-1' },
        { op: 'add', type: 'text', x: 50, y: 25, text: 'Box 1', id: 'text-1' },
        { op: 'modify', id: 'rect-1', set: { strokeColor: '#ff0000' } }
      ]);
      
      const { stdout } = run(`batch "${file}" --ops '${ops}'`);
      const result = parseOutput(stdout);
      
      expect(result.success).toBe(true);
      expect(result.operations).toHaveLength(3);
      expect(result.elementCount).toBe(2);
    });

    it('should handle delete operations', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const ops = JSON.stringify([
        { op: 'add', type: 'rectangle', x: 0, y: 0, id: 'rect-1' },
        { op: 'add', type: 'rectangle', x: 100, y: 0, id: 'rect-2' },
        { op: 'delete', id: 'rect-1' }
      ]);
      
      const { stdout } = run(`batch "${file}" --ops '${ops}'`);
      const result = parseOutput(stdout);
      
      expect(result.elementCount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should fail gracefully for missing file', () => {
      const { stderr } = run(`list "/nonexistent/file.excalidraw"`);
      expect(stderr).toContain('not found');
    });

    it('should fail gracefully for invalid JSON', () => {
      const file = path.join(tempDir, 'bad.excalidraw');
      fs.writeFileSync(file, 'not json');
      
      const { stderr } = run(`list "${file}"`);
      expect(stderr).toContain('Invalid JSON');
    });

    it('should fail gracefully for invalid element type', () => {
      const file = path.join(tempDir, 'test.excalidraw');
      run(`create "${file}"`);
      
      const { stderr } = run(`add "${file}" --type invalid --x 0 --y 0`);
      expect(stderr).toContain('Unknown element type');
    });
  });
});
