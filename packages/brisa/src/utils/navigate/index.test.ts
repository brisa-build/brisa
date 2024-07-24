import { describe, expect, it, spyOn, beforeEach, afterEach } from 'bun:test';
import navigate from '.';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

const BASE_PATHS = ['', '/some', '/some/other'];

describe('utils', () => {
  describe.each(BASE_PATHS)('navigate %s', (basePath) => {
    describe('server side', () => {
      beforeEach(() => {
        globalThis.__BASE_PATH__ = basePath;
      });
      afterEach(() => {
        globalThis.__BASE_PATH__ = '';
      });

      it('should throw a navigation', () => {
        expect(() => navigate('/some')).toThrow(`${basePath}/some`);
      });

      it('should error name should be "navigate:reactivity" by default', () => {
        try {
          navigate('/some');
        } catch (e: any) {
          expect(e.name).toBe('navigate:reactivity');
        }
      });

      it('should error name should be "navigate:reactivity" when options.renderMode is "reactivity"', () => {
        try {
          navigate('/some', { renderMode: 'reactivity' });
        } catch (e: any) {
          expect(e.name).toBe('navigate:reactivity');
        }
      });

      it('should error name should be "navigate:transition" when options.renderMode is "transition"', () => {
        try {
          navigate('/some', { renderMode: 'transition' });
        } catch (e: any) {
          expect(e.name).toBe('navigate:transition');
        }
      });

      it('should error name should be "navigate:native" when options.renderMode is "native"', () => {
        try {
          navigate('/some', { renderMode: 'native' });
        } catch (e: any) {
          expect(e.name).toBe('navigate:native');
        }
      });

      it('should throw a navigation without adding the basePath to the external URL', () => {
        expect(() => navigate('https://test.com/some')).toThrow(`https://test.com/some`);
      });
    });

    describe('client side', () => {
      beforeEach(() => {
        GlobalRegistrator.register();
        window.__BASE_PATH__ = basePath;
      });
      afterEach(() => {
        window.__BASE_PATH__ = '';
        GlobalRegistrator.unregister();
      });

      it('should throw a navigation in client-side and change the location.assign', () => {
        const mockEventListener = spyOn(window, 'addEventListener');
        const mockLocationAssign = spyOn(location, 'assign');
        expect(() => navigate('/some')).toThrow(`${basePath}/some`);
        expect(mockLocationAssign).toHaveBeenCalledWith(`${basePath}/some`);
        expect(mockEventListener).toHaveBeenCalled();
      });

      it('should throw a navigation in client-side and change the location.assign without adding basePath to the external URL', () => {
        const mockEventListener = spyOn(window, 'addEventListener');
        const mockLocationAssign = spyOn(location, 'assign');
        expect(() => navigate('https://test.com/some')).toThrow('https://test.com/some');
        expect(mockLocationAssign).toHaveBeenCalledWith('https://test.com/some');
        expect(mockEventListener).toHaveBeenCalled();
      });
    });
  });
});
