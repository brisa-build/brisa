import { RenderInitiator } from '@/public-constants';
import extendRequestContext from '@/utils/extend-request-context';
import get404ClientScript from '@/utils/not-found/client-script';
import { expect, it, describe } from 'bun:test';

describe('utils', () => {
  describe('not-found', () => {
    describe('client-script', () => {
      it('should return a script that assigns the current URL if the render initiator is a server action', () => {
        const request = extendRequestContext({
          originalRequest: new Request('http://localhost:3000'),
        });
        request.renderInitiator = RenderInitiator.SERVER_ACTION;
        const script = get404ClientScript(request);
        expect(script).toEqual(
          `<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.assign(u.toString())})()</script>`,
        );
      });

      it('should return a script that replaces the current URL if the render initiator is not a server action', () => {
        const request = extendRequestContext({
          originalRequest: new Request('http://localhost:3000'),
        });
        request.renderInitiator = RenderInitiator.INITIAL_REQUEST;
        const script = get404ClientScript(request);
        expect(script).toEqual(
          `<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()</script>`,
        );
      });

      it('should return a script that replaces the current URL if the render initiator is not a server action', () => {
        const request = extendRequestContext({
          originalRequest: new Request('http://localhost:3000'),
        });
        request.renderInitiator = RenderInitiator.INITIAL_REQUEST;
        const script = get404ClientScript(request);
        expect(script).toEqual(
          `<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()</script>`,
        );
      });
    });
  });
});
