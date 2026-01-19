import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  createEmptyFile,
  readFile,
  writeFile,
  validateExcalidrawFile,
  calculateBounds,
  countElementsByType,
  FileNotFoundError,
  FileExistsError,
  InvalidJsonError,
  InvalidFileError
} from './file.js';
import type { ExcalidrawFile, ExcalidrawElement } from '../types/excalidraw.js';

describe('file utilities', () => {
  let tempDir: string;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'excalidraw-test-'));
  });
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('createEmptyFile', () => {
    it('should create a valid empty file structure', () => {
      const file = createEmptyFile();
      
      expect(file.type).toBe('excalidraw');
      expect(file.version).toBe(2);
      expect(file.source).toBe('excalidraw-agent');
      expect(file.elements).toEqual([]);
      expect(file.appState.viewBackgroundColor).toBe('#ffffff');
      expect(file.appState.gridSize).toBeNull();
    });

    it('should apply custom background color', () => {
      const file = createEmptyFile({ backgroundColor: '#000000' });
      expect(file.appState.viewBackgroundColor).toBe('#000000');
    });

    it('should apply custom grid size', () => {
      const file = createEmptyFile({ gridSize: 20 });
      expect(file.appState.gridSize).toBe(20);
    });
  });

  describe('writeFile and readFile', () => {
    it('should write and read a file correctly', () => {
      const filePath = path.join(tempDir, 'test.excalidraw');
      const file = createEmptyFile();
      
      writeFile(filePath, file);
      const read = readFile(filePath);
      
      expect(read.type).toBe('excalidraw');
      expect(read.elements).toEqual([]);
    });

    it('should throw FileExistsError when file exists without force', () => {
      const filePath = path.join(tempDir, 'test.excalidraw');
      const file = createEmptyFile();
      
      writeFile(filePath, file);
      
      expect(() => writeFile(filePath, file)).toThrow(FileExistsError);
    });

    it('should overwrite file with force option', () => {
      const filePath = path.join(tempDir, 'test.excalidraw');
      const file1 = createEmptyFile({ backgroundColor: '#ffffff' });
      const file2 = createEmptyFile({ backgroundColor: '#000000' });
      
      writeFile(filePath, file1);
      writeFile(filePath, file2, { force: true });
      
      const read = readFile(filePath);
      expect(read.appState.viewBackgroundColor).toBe('#000000');
    });

    it('should throw FileNotFoundError for missing file', () => {
      expect(() => readFile('/nonexistent/path.excalidraw')).toThrow(FileNotFoundError);
    });

    it('should throw InvalidJsonError for malformed JSON', () => {
      const filePath = path.join(tempDir, 'bad.excalidraw');
      fs.writeFileSync(filePath, '{not valid json}');
      
      expect(() => readFile(filePath)).toThrow(InvalidJsonError);
    });

    it('should throw InvalidFileError for wrong file type', () => {
      const filePath = path.join(tempDir, 'wrong.excalidraw');
      fs.writeFileSync(filePath, JSON.stringify({ type: 'not-excalidraw' }));
      
      expect(() => readFile(filePath)).toThrow(InvalidFileError);
    });

    it('should create parent directories if needed', () => {
      const filePath = path.join(tempDir, 'nested', 'dir', 'test.excalidraw');
      const file = createEmptyFile();
      
      writeFile(filePath, file);
      
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('validateExcalidrawFile', () => {
    it('should accept valid file', () => {
      const data = {
        type: 'excalidraw',
        version: 2,
        elements: [],
        appState: { gridSize: null, viewBackgroundColor: '#ffffff' },
        files: {}
      };
      
      expect(() => validateExcalidrawFile(data)).not.toThrow();
    });

    it('should reject non-object', () => {
      expect(() => validateExcalidrawFile('string')).toThrow(InvalidFileError);
      expect(() => validateExcalidrawFile(null)).toThrow(InvalidFileError);
    });

    it('should reject wrong type', () => {
      expect(() => validateExcalidrawFile({ type: 'other' })).toThrow(InvalidFileError);
    });

    it('should reject missing elements array', () => {
      expect(() => validateExcalidrawFile({ type: 'excalidraw' })).toThrow(InvalidFileError);
    });
  });

  describe('calculateBounds', () => {
    it('should return zero bounds for empty array', () => {
      const bounds = calculateBounds([]);
      expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('should calculate correct bounds for single element', () => {
      const elements = [
        { x: 100, y: 200, width: 50, height: 30 } as ExcalidrawElement
      ];
      
      const bounds = calculateBounds(elements);
      expect(bounds).toEqual({ x: 100, y: 200, width: 50, height: 30 });
    });

    it('should calculate correct bounds for multiple elements', () => {
      const elements = [
        { x: 0, y: 0, width: 100, height: 50 } as ExcalidrawElement,
        { x: 200, y: 100, width: 50, height: 50 } as ExcalidrawElement
      ];
      
      const bounds = calculateBounds(elements);
      expect(bounds).toEqual({ x: 0, y: 0, width: 250, height: 150 });
    });
  });

  describe('countElementsByType', () => {
    it('should return empty object for empty array', () => {
      expect(countElementsByType([])).toEqual({});
    });

    it('should count elements by type', () => {
      const elements = [
        { type: 'rectangle' },
        { type: 'rectangle' },
        { type: 'text' },
        { type: 'arrow' }
      ] as ExcalidrawElement[];
      
      expect(countElementsByType(elements)).toEqual({
        rectangle: 2,
        text: 1,
        arrow: 1
      });
    });
  });
});
