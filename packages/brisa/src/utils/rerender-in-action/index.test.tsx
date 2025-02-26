import { describe, it, expect } from 'bun:test';
import { PREFIX_MESSAGE, SUFFIX_MESSAGE, renderPage, renderComponent } from '.';

const ELEMENT_SYMBOL = Symbol.for('element');

describe('utils', () => {
  describe('renderComponent', () => {
    it('should throw the correct throwable', () => {
      try {
        renderComponent();
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: 'component',
            renderMode: 'reactivity',
            placement: 'replace',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it('should throw the correct throwable in a different target', () => {
      try {
        renderComponent({ target: '#foo' });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: '#foo',
            renderMode: 'reactivity',
            placement: 'replace',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it('should throw the correct throwable withTransition: false', () => {
      try {
        renderComponent({ withTransition: false });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: 'component',
            renderMode: 'reactivity',
            placement: 'replace',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toBeEmpty();
      }
    });

    it('should throw the correct throwable withTransition=true', () => {
      try {
        renderComponent({ withTransition: true });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: 'component',
            renderMode: 'transition',
            placement: 'replace',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toBeEmpty();
      }
    });

    it('should throw the correct throwable with element', () => {
      try {
        renderComponent({ element: <>foo</> });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: 'component',
            renderMode: 'reactivity',
            placement: 'replace',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toEqual(<>foo</>);
      }
    });

    it('should throw the correct throwable with element and mode replace', () => {
      try {
        renderComponent({ element: <>foo</>, placement: 'replace' });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: 'component',
            renderMode: 'reactivity',
            placement: 'replace',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toEqual(<>foo</>);
      }
    });

    it('should throw the correct throwable with element and mode append', () => {
      try {
        renderComponent({ element: <>foo</>, placement: 'append' });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: 'component',
            target: 'component',
            renderMode: 'reactivity',
            placement: 'append',
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toEqual(<>foo</>);
      }
    });
  });

  describe('renderPage', () => {
    it('should throw the correct throwable without params', () => {
      try {
        renderPage();
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: 'page', renderMode: 'reactivity' }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toBeUndefined();
      }
    });

    it("should throw the correct throwable with withTransition: true'", () => {
      try {
        renderPage({ withTransition: true });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: 'page', renderMode: 'transition' }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toBeUndefined();
      }
    });

    it("should throw the correct throwable with withTransition: false'", () => {
      try {
        renderPage({ withTransition: false });
      } catch (error: any) {
        expect(error.name).toBe('rerender');
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: 'page', renderMode: 'reactivity' }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[ELEMENT_SYMBOL]).toBeUndefined();
      }
    });
  });
});
