import { describe, it, expect } from 'vitest';
import { validateElement, validateFile, VALID_ELEMENT_TYPES, VALID_FILL_STYLES } from './schema.js';

describe('Schema Validation', () => {
  describe('validateElement', () => {
    it('should validate a valid rectangle element', () => {
      const element = {
        id: 'test-id-12345678901',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        angle: 0,
        strokeColor: '#1e1e1e',
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        seed: 12345,
        version: 1,
        versionNonce: 67890,
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false
      };

      const result = validateElement(element, 0);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject element with missing required properties', () => {
      const element = { type: 'rectangle' };
      const result = validateElement(element, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required property'))).toBe(true);
    });

    it('should reject element with invalid type', () => {
      const element = {
        id: 'test',
        type: 'invalid-type',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        seed: 1,
        version: 1
      };
      const result = validateElement(element, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('type'))).toBe(true);
    });

    it('should validate all official element types', () => {
      for (const type of VALID_ELEMENT_TYPES) {
        if (type === 'selection') continue; // Internal type
        
        const element: any = {
          id: `test-${type}`,
          type,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          seed: 1,
          version: 1,
          angle: 0,
          strokeColor: '#000',
          backgroundColor: 'transparent',
          fillStyle: 'solid',
          strokeWidth: 1,
          strokeStyle: 'solid',
          roughness: 1,
          opacity: 100,
          groupIds: [],
          isDeleted: false
        };

        // Add type-specific properties
        if (type === 'text') {
          element.text = 'Hello';
          element.fontSize = 20;
          element.fontFamily = 1;
          element.textAlign = 'left';
          element.verticalAlign = 'top';
          element.originalText = 'Hello';
          element.lineHeight = 1.25;
        }
        if (type === 'line' || type === 'arrow') {
          element.points = [[0, 0], [100, 100]];
          element.startBinding = null;
          element.endBinding = null;
          element.startArrowhead = null;
          element.endArrowhead = type === 'arrow' ? 'arrow' : null;
        }
        if (type === 'freedraw') {
          element.points = [[0, 0], [10, 5], [20, 10]];
          element.pressures = [0.5, 0.5, 0.5];
          element.simulatePressure = true;
        }

        const result = validateElement(element, 0);
        expect(result.valid).toBe(true);
      }
    });

    it('should validate all fill styles', () => {
      for (const fillStyle of VALID_FILL_STYLES) {
        const element = {
          id: 'test',
          type: 'rectangle',
          x: 0, y: 0, width: 100, height: 100,
          seed: 1, version: 1,
          fillStyle
        };
        const result = validateElement(element, 0);
        expect(result.errors.filter(e => e.path.includes('fillStyle'))).toHaveLength(0);
      }
    });

    it('should reject invalid fill style', () => {
      const element = {
        id: 'test',
        type: 'rectangle',
        x: 0, y: 0, width: 100, height: 100,
        seed: 1, version: 1,
        fillStyle: 'invalid-fill'
      };
      const result = validateElement(element, 0);
      expect(result.errors.some(e => e.path.includes('fillStyle'))).toBe(true);
    });

    it('should validate text element properties', () => {
      const element = {
        id: 'test',
        type: 'text',
        x: 0, y: 0, width: 100, height: 20,
        seed: 1, version: 1,
        text: 'Hello World',
        fontSize: 20,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        originalText: 'Hello World',
        lineHeight: 1.25
      };
      const result = validateElement(element, 0);
      expect(result.valid).toBe(true);
    });

    it('should reject text element without text', () => {
      const element = {
        id: 'test',
        type: 'text',
        x: 0, y: 0, width: 100, height: 20,
        seed: 1, version: 1
      };
      const result = validateElement(element, 0);
      expect(result.errors.some(e => e.message.includes('text'))).toBe(true);
    });

    it('should validate arrow with all arrowhead types', () => {
      const arrowheads = [null, 'arrow', 'bar', 'dot', 'triangle', 'diamond'];
      for (const head of arrowheads) {
        const element = {
          id: 'test',
          type: 'arrow',
          x: 0, y: 0, width: 100, height: 100,
          seed: 1, version: 1,
          points: [[0, 0], [100, 100]],
          startArrowhead: null,
          endArrowhead: head
        };
        const result = validateElement(element, 0);
        expect(result.errors.filter(e => e.path.includes('Arrowhead'))).toHaveLength(0);
      }
    });

    it('should reject arrow with invalid points', () => {
      const element = {
        id: 'test',
        type: 'arrow',
        x: 0, y: 0, width: 100, height: 100,
        seed: 1, version: 1,
        points: 'not-an-array'
      };
      const result = validateElement(element, 0);
      expect(result.errors.some(e => e.path.includes('points'))).toBe(true);
    });

    it('should warn about opacity out of range', () => {
      const element = {
        id: 'test',
        type: 'rectangle',
        x: 0, y: 0, width: 100, height: 100,
        seed: 1, version: 1,
        opacity: 150
      };
      const result = validateElement(element, 0);
      expect(result.warnings.some(w => w.path.includes('opacity'))).toBe(true);
    });
  });

  describe('validateFile', () => {
    it('should validate a valid excalidraw file', () => {
      const file = {
        type: 'excalidraw',
        version: 2,
        source: 'excalidraw-agent',
        elements: [
          {
            id: 'rect1',
            type: 'rectangle',
            x: 100, y: 100,
            width: 200, height: 100,
            seed: 1, version: 1,
            angle: 0,
            strokeColor: '#1e1e1e',
            backgroundColor: 'transparent',
            fillStyle: 'hachure',
            strokeWidth: 1,
            strokeStyle: 'solid',
            roughness: 1,
            opacity: 100,
            groupIds: [],
            isDeleted: false
          }
        ],
        appState: {
          gridSize: null,
          viewBackgroundColor: '#ffffff'
        },
        files: {}
      };

      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject file with wrong type', () => {
      const file = {
        type: 'not-excalidraw',
        version: 2,
        elements: [],
        appState: {},
        files: {}
      };
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'type')).toBe(true);
    });

    it('should reject file without elements array', () => {
      const file = {
        type: 'excalidraw',
        version: 2,
        elements: 'not-array',
        appState: {},
        files: {}
      };
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'elements')).toBe(true);
    });

    it('should propagate element errors', () => {
      const file = {
        type: 'excalidraw',
        version: 2,
        elements: [
          { type: 'invalid-type' }
        ],
        appState: {},
        files: {}
      };
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.startsWith('elements['))).toBe(true);
    });

    it('should validate empty file', () => {
      const file = {
        type: 'excalidraw',
        version: 2,
        elements: [],
        appState: {
          gridSize: null,
          viewBackgroundColor: '#ffffff'
        },
        files: {}
      };
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });
  });
});
