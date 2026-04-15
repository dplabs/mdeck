import { describe, it, expect } from 'vitest';
import { Slide } from '../mdeck/models/slide.js';
import type { ParsedSlide } from '../mdeck/parser.js';

function makeSlide(overrides: Partial<ParsedSlide> = {}): Slide {
  return new Slide(0, 1, {
    content: [],
    properties: { continued: 'false' },
    links: {},
    ...overrides,
  });
}

describe('Slide', () => {
  describe('properties', () => {
    it('exposes parsed properties', () => {
      const slide = makeSlide({ properties: { continued: 'false', name: 'a', class: 'center' } });
      expect(slide.properties.name).toBe('a');
      expect(slide.properties.class).toBe('center');
    });

    it('exposes content array', () => {
      const slide = makeSlide({ content: ['Hello'] });
      expect(slide.content).toEqual(['Hello']);
    });
  });

  describe('inheritance from template', () => {
    it('inherits properties from template', () => {
      const template = makeSlide({ properties: { continued: 'false', prop1: 'val1' } });
      const slide = new Slide(1, 2, {
        content: ['More.'],
        properties: { continued: 'false', prop2: 'val2' },
        links: {},
      }, template);
      expect(slide.properties.prop1).toBe('val1');
      expect(slide.properties.prop2).toBe('val2');
    });

    it('inherits content from template', () => {
      const template = makeSlide({ content: ['Template content.'] });
      const slide = new Slide(1, 2, {
        content: ['Slide content.'],
        properties: { continued: 'false' },
        links: {},
      }, template);
      expect(slide.content.join('')).toContain('Template content.');
      expect(slide.content.join('')).toContain('Slide content.');
    });

    it('does not inherit the name property', () => {
      const template = makeSlide({ properties: { continued: 'false', name: 'base' } });
      const slide = new Slide(1, 2, {
        content: [],
        properties: { continued: 'false' },
        links: {},
      }, template);
      expect(slide.properties.name).toBeUndefined();
    });

    it('does not inherit the layout property', () => {
      const template = makeSlide({ properties: { continued: 'false', layout: 'true' } });
      const slide = new Slide(1, 2, {
        content: [],
        properties: { continued: 'false' },
        links: {},
      }, template);
      expect(slide.properties.layout).toBeUndefined();
    });

    it('aggregates class property from template and slide', () => {
      const template = makeSlide({ properties: { continued: 'false', class: 'a' } });
      const slide = new Slide(1, 2, {
        content: ['x'],
        properties: { continued: 'false', class: 'b' },
        links: {},
      }, template);
      expect(slide.properties.class).toBe('a, b');
    });

    it('inherits notes when inheritPresenterNotes is true', () => {
      const template = makeSlide({ content: ['t'], notes: ['template notes'] });
      const slide = new Slide(1, 2, {
        content: ['s'],
        properties: { continued: 'false' },
        links: {},
        notes: ['slide notes'],
      }, template, { inheritPresenterNotes: true });
      const combined = slide.notes.join('');
      expect(combined).toContain('template notes');
      expect(combined).toContain('slide notes');
    });

    it('does not inherit notes when inheritPresenterNotes is not set', () => {
      const template = makeSlide({ content: ['t'], notes: ['template notes'] });
      const slide = new Slide(1, 2, {
        content: ['s'],
        properties: { continued: 'false' },
        links: {},
        notes: ['slide notes'],
      }, template, {});
      expect(slide.notes).toEqual(['slide notes']);
    });
  });

  describe('expandVariables', () => {
    it('expands {{ property }} to its value', () => {
      const slide = makeSlide({
        content: ['prop = {{ prop1 }}'],
        properties: { continued: 'false', prop1: 'val1' },
      });
      slide.expandVariables();
      expect(slide.content[0]).toBe('prop = val1');
    });

    it('leaves escaped \\{{ }} unexpanded', () => {
      const slide = makeSlide({
        content: ['prop = \\{{ prop1 }}'],
        properties: { continued: 'false', prop1: 'val1' },
      });
      slide.expandVariables();
      expect(slide.content[0]).toBe('prop = {{ prop1 }}');
    });

    it('leaves undefined variables unexpanded', () => {
      const slide = makeSlide({ content: ['{{ missing }}'] });
      slide.expandVariables();
      expect(slide.content[0]).toBe('{{ missing }}');
    });

    it('expands variables inside nested content classes', () => {
      const slide = new Slide(0, 1, {
        content: [{ block: false, class: 'x', content: ['{{ name }}'] }],
        properties: { continued: 'false', name: 'world' },
        links: {},
      });
      slide.expandVariables();
      const inner = slide.content[0] as { content: string[] };
      expect(inner.content[0]).toBe('world');
    });
  });

  describe('index and number', () => {
    it('returns slide index', () => {
      const slide = new Slide(3, 4, { content: [], properties: { continued: 'false' }, links: {} });
      expect(slide.getSlideIndex()).toBe(3);
    });

    it('returns slide number', () => {
      const slide = new Slide(3, 4, { content: [], properties: { continued: 'false' }, links: {} });
      expect(slide.getSlideNumber()).toBe(4);
    });
  });
});
