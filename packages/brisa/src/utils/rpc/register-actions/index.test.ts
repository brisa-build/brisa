import { registerActions } from '@/utils/rpc/register-actions';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { it, describe, expect, mock, beforeEach, afterEach, jest } from 'bun:test';

describe('utils', () => {
  beforeEach(() => {
    globalThis.REGISTERED_ACTIONS = [];
    GlobalRegistrator.register();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    GlobalRegistrator.unregister();
  });
  describe('rpc -> registerActions', () => {
    it('should register actions and execute it with the correct params', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-action', 'actionId');
      mockElement.setAttribute('data-action-onclick', 'actionId');
      mockElement.setAttribute('indicateclick', 'indicator');
      document.body.appendChild(mockElement);

      const mockRPC = mock(() => {});
      registerActions(mockRPC);

      mockElement.click();

      expect(mockRPC).toBeCalledTimes(1);
      const calls = mockRPC.mock.calls[0] as unknown as unknown[];
      expect(calls[0]).toBe('actionId');
      expect(calls[1]).toBe(false);
      expect(calls[2]).toBe('indicator');
      expect(calls[3]).toEqual({ actionOnclick: 'actionId' });
      expect(calls[4]).toBeInstanceOf(Event);
    });
  });
});
