import { describe, it, expect } from 'vitest';
import {
  createElement,
  createRectangle,
  createEllipse,
  createDiamond,
  createText,
  createLine,
  createArrow,
  createFreedraw,
  validateElementInput,
  mergeElement,
  InvalidElementError
} from './element.js';
import type { ElementInput, RectangleElement } from '../types/excalidraw.js';

describe('element utilities', () => {
  describe('createRectangle', () => {
    it('should create a rectangle with required properties', () => {
      const rect = createRectangle({ type: 'rectangle', x: 100, y: 200 });
      
      expect(rect.type).toBe('rectangle');
      expect(rect.x).toBe(100);
      expect(rect.y).toBe(200);
      expect(rect.width).toBe(100); // default
      expect(rect.height).toBe(100); // default
      expect(rect.id).toBeDefined();
      expect(rect.id.length).toBe(21);
    });

    it('should apply custom dimensions', () => {
      const rect = createRectangle({
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 200,
        height: 150
      });
      
      expect(rect.width).toBe(200);
      expect(rect.height).toBe(150);
    });

    it('should apply custom styling', () => {
      const rect = createRectangle({
        type: 'rectangle',
        x: 0,
        y: 0,
        strokeColor: '#ff0000',
        backgroundColor: '#00ff00',
        strokeWidth: 4,
        opacity: 50
      });
      
      expect(rect.strokeColor).toBe('#ff0000');
      expect(rect.backgroundColor).toBe('#00ff00');
      expect(rect.strokeWidth).toBe(4);
      expect(rect.opacity).toBe(50);
    });

    it('should use custom ID if provided', () => {
      const rect = createRectangle({
        type: 'rectangle',
        x: 0,
        y: 0,
        id: 'custom-id-123'
      });
      
      expect(rect.id).toBe('custom-id-123');
    });

    it('should have roundness for rectangle', () => {
      const rect = createRectangle({ type: 'rectangle', x: 0, y: 0 });
      expect(rect.roundness).toEqual({ type: 3 });
    });
  });

  describe('createEllipse', () => {
    it('should create an ellipse', () => {
      const ellipse = createEllipse({ type: 'ellipse', x: 50, y: 50 });
      
      expect(ellipse.type).toBe('ellipse');
      expect(ellipse.x).toBe(50);
      expect(ellipse.y).toBe(50);
    });
  });

  describe('createDiamond', () => {
    it('should create a diamond', () => {
      const diamond = createDiamond({ type: 'diamond', x: 0, y: 0 });
      
      expect(diamond.type).toBe('diamond');
    });
  });

  describe('createText', () => {
    it('should create a text element', () => {
      const text = createText({
        type: 'text',
        x: 100,
        y: 100,
        text: 'Hello World'
      });
      
      expect(text.type).toBe('text');
      expect(text.text).toBe('Hello World');
      expect(text.originalText).toBe('Hello World');
      expect(text.fontSize).toBe(20); // default
      expect(text.fontFamily).toBe(1); // Virgil
    });

    it('should apply custom font settings', () => {
      const text = createText({
        type: 'text',
        x: 0,
        y: 0,
        text: 'Code',
        fontSize: 16,
        fontFamily: 3, // Cascadia
        textAlign: 'center'
      });
      
      expect(text.fontSize).toBe(16);
      expect(text.fontFamily).toBe(3);
      expect(text.textAlign).toBe('center');
    });

    it('should estimate dimensions based on text', () => {
      const text = createText({
        type: 'text',
        x: 0,
        y: 0,
        text: 'Hello'
      });
      
      expect(text.width).toBeGreaterThan(0);
      expect(text.height).toBeGreaterThan(0);
    });
  });

  describe('createLine', () => {
    it('should create a line with default points', () => {
      const line = createLine({ type: 'line', x: 0, y: 0 });
      
      expect(line.type).toBe('line');
      expect(line.points).toEqual([[0, 0], [100, 100]]);
    });

    it('should create a line with custom points', () => {
      const line = createLine({
        type: 'line',
        x: 10,
        y: 10,
        points: [[0, 0], [50, 25], [100, 0]]
      });
      
      expect(line.points).toEqual([[0, 0], [50, 25], [100, 0]]);
      expect(line.width).toBe(100);
      expect(line.height).toBe(25);
    });
  });

  describe('createArrow', () => {
    it('should create an arrow with end arrowhead', () => {
      const arrow = createArrow({ type: 'arrow', x: 0, y: 0 });
      
      expect(arrow.type).toBe('arrow');
      expect(arrow.endArrowhead).toBe('arrow');
      expect(arrow.startArrowhead).toBeNull();
    });

    it('should support custom arrowheads', () => {
      const arrow = createArrow({
        type: 'arrow',
        x: 0,
        y: 0,
        startArrowhead: 'dot',
        endArrowhead: 'triangle'
      });
      
      expect(arrow.startArrowhead).toBe('dot');
      expect(arrow.endArrowhead).toBe('triangle');
    });
  });

  describe('createFreedraw', () => {
    it('should create a freedraw element', () => {
      const freedraw = createFreedraw({
        type: 'freedraw',
        x: 0,
        y: 0,
        points: [[0, 0], [5, 2], [10, 5]]
      });
      
      expect(freedraw.type).toBe('freedraw');
      expect(freedraw.points).toHaveLength(3);
      expect(freedraw.pressures).toHaveLength(3);
    });
  });

  describe('createElement', () => {
    it('should create element by type', () => {
      const rect = createElement({ type: 'rectangle', x: 0, y: 0 });
      expect(rect.type).toBe('rectangle');
      
      const text = createElement({ type: 'text', x: 0, y: 0, text: 'Hi' });
      expect(text.type).toBe('text');
    });

    it('should throw for unknown type', () => {
      expect(() => createElement({
        type: 'unknown' as any,
        x: 0,
        y: 0
      })).toThrow(InvalidElementError);
    });
  });

  describe('validateElementInput', () => {
    it('should accept valid input', () => {
      expect(() => validateElementInput({
        type: 'rectangle',
        x: 0,
        y: 0
      })).not.toThrow();
    });

    it('should reject non-object', () => {
      expect(() => validateElementInput('string')).toThrow(InvalidElementError);
      expect(() => validateElementInput(null)).toThrow(InvalidElementError);
    });

    it('should reject missing type', () => {
      expect(() => validateElementInput({ x: 0, y: 0 })).toThrow(InvalidElementError);
    });

    it('should reject invalid type', () => {
      expect(() => validateElementInput({
        type: 'invalid',
        x: 0,
        y: 0
      })).toThrow(InvalidElementError);
    });

    it('should reject missing x or y', () => {
      expect(() => validateElementInput({
        type: 'rectangle',
        y: 0
      })).toThrow(InvalidElementError);
      
      expect(() => validateElementInput({
        type: 'rectangle',
        x: 0
      })).toThrow(InvalidElementError);
    });
  });

  describe('mergeElement', () => {
    it('should merge updates into element', () => {
      const original = createRectangle({ type: 'rectangle', x: 0, y: 0 });
      const merged = mergeElement(original, { x: 100, y: 200 });
      
      expect(merged.x).toBe(100);
      expect(merged.y).toBe(200);
      expect(merged.id).toBe(original.id); // ID preserved
    });

    it('should increment version', () => {
      const original = createRectangle({ type: 'rectangle', x: 0, y: 0 });
      const merged = mergeElement(original, { x: 100 });
      
      expect(merged.version).toBe(original.version + 1);
    });

    it('should update versionNonce', () => {
      const original = createRectangle({ type: 'rectangle', x: 0, y: 0 });
      const merged = mergeElement(original, { x: 100 });
      
      expect(merged.versionNonce).not.toBe(original.versionNonce);
    });

    it('should ignore undefined values', () => {
      const original = createRectangle({ type: 'rectangle', x: 0, y: 0, width: 100 });
      const merged = mergeElement(original, { x: 50, width: undefined } as any);
      
      expect(merged.x).toBe(50);
      expect(merged.width).toBe(100); // unchanged
    });
  });
});
