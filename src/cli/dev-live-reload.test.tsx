import { describe, it, expect } from "bun:test";
import { LiveReloadScript } from "./dev-live-reload";
import { normalizeQuotes } from "@/helpers";

describe("dev-live-reload", () => {
  it("should return live reload script for port 3000", () => {
    const output = LiveReloadScript({ port: 3000, children: null });

    expect(
      normalizeQuotes(output.props.children[0].props.children.props.html),
    ).toBe(
      normalizeQuotes(`
      function wsc() {
        let s = new WebSocket("ws://0.0.0.0:3000/__brisa_live_reload__");
        s.onclose = wsc;
        s.onmessage = e => e.data === "reload" && location.reload();
      }
      wsc();
    `),
    );
  });

  it("should return live reload script for port 4000", () => {
    const output = LiveReloadScript({ port: 4000, children: null });

    expect(
      normalizeQuotes(output.props.children[0].props.children.props.html),
    ).toBe(
      normalizeQuotes(`
      function wsc() {
        let s = new WebSocket("ws://0.0.0.0:4000/__brisa_live_reload__");
        s.onclose = wsc;
        s.onmessage = e => e.data === "reload" && location.reload();
      }
      wsc();
    `),
    );
  });
});
