import { describe, it, expect } from 'bun:test';
import { LiveReloadScript } from './dev-live-reload';

describe('dev-live-reload', () => {
  it('should return live reload script for port 3000', () => {
    const output = LiveReloadScript({ port: 3000, children: null }) as any;

    expect(output.props.children[0].props.children.props.html).toContain(
      'ws://localhost:3000/__brisa_live_reload__',
    );
  });

  it('should return live reload script for port 4000', () => {
    const output = LiveReloadScript({ port: 4000, children: null }) as any;

    expect(output.props.children[0].props.children.props.html).toContain(
      'ws://localhost:4000/__brisa_live_reload__',
    );
  });

  it('should use native navigation when the websocket message is "hot-reload"', () => {
    const output = LiveReloadScript({ port: 4000, children: null }) as any;

    expect(output.props.children[0].props.children.props.html).toContain(
      'window._xm = "native";',
    );
  });
});
