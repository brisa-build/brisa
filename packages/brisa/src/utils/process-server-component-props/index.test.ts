import { describe, it, expect, beforeEach, setSystemTime } from "bun:test";
import processServerComponentProps from ".";
import extendStreamController, {
  type Controller,
} from "@/utils/extend-stream-controller";
import extendRequestContext from "@/utils/extend-request-context";

let controller: Controller;

describe("utils", () => {
  beforeEach(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    controller = extendStreamController({
      controller: { enqueue: () => {} } as any,
      request: extendRequestContext({
        originalRequest: new Request("http://localhost"),
      }),
    });

    // Parent component
    controller.generateComponentId();
    // Child component with action dependencies
    controller.generateComponentId();
  });
  describe("processServerComponentProps", () => {
    it("should process nested action props", () => {
      const onClick = () => {};
      const props = {
        onClick,
        "data-action-onclick": "1",
      };
      const result = processServerComponentProps(props);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "1");
      expect(result.onClick).toHaveProperty("actions", []);
    });
    it("should keep the actionId if already has", () => {
      const onClick = () => {};
      onClick.actionId = "1";
      const props = {
        onClick,
        "data-action-onclick": "2",
      };
      const result = processServerComponentProps(props);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "1");
      expect(result.onClick).not.toHaveProperty("actions");
    });
    it("should not add action dependencies if is the same", () => {
      const onClick = () => {};
      onClick.actionId = "1";

      const props = {
        onClick,
        "data-action-onclick": "2",
      };
      const parentProps = {
        onClick,
        "data-action-onclick": "1",
      };

      const result = processServerComponentProps(props, parentProps);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "1");
      expect(result.onClick).not.toHaveProperty("actions");
    });

    it("should add action dependencies if the actions from parent are different", () => {
      const onClick = () => {};
      const onAction = () => {};

      onAction.actionId = "1";

      const props = {
        onClick,
        "data-action-onclick": "2",
      };
      const parentProps = {
        onAction,
        "data-action-onclick": "1",
      };

      const result = processServerComponentProps(
        props,
        parentProps,
        controller,
      );
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "2");
      expect(result.onClick).toHaveProperty("actions", [
        [["onAction", "1", "0"]],
      ]);
    });
    it("should add multiple action dependencies if the actions from parent are different", () => {
      const onClick = () => {};
      const onAction = () => {};
      const onAction2 = () => {};

      onAction.actionId = "2";
      onAction2.actionId = "1";

      const props = {
        onClick,
        "data-action-onclick": "3",
      };
      const parentProps = {
        onAction,
        onAction2,
        "data-action-onaction": "2",
        "data-action-onaction2": "1",
      };

      const result = processServerComponentProps(
        props,
        parentProps,
        controller,
      );
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "3");
      expect(result.onClick).toHaveProperty("actions", [
        [
          ["onAction", "2", "0"],
          ["onAction2", "1", "0"],
        ],
      ]);
    });

    it("should add grantparents action dependencies", () => {
      const onClick = () => {};
      const onAction = () => {};
      const onAction2 = () => {};
      const grantparentDeps = [
        [["onFoo", "bar", "1"]],
        [["onBar", "foo", "1"]],
      ];

      onAction.actionId = "2";
      onAction2.actionId = "1";
      onAction.actions = grantparentDeps;
      onAction2.actions = grantparentDeps;

      const props = {
        onClick,
        "data-action-onclick": "3",
      };
      const parentProps = {
        onAction,
        onAction2,
        "data-action-onaction": "2",
        "data-action-onaction2": "1",
      };

      const result = processServerComponentProps(
        props,
        parentProps,
        controller,
      );
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "3");
      expect(result.onClick).toHaveProperty("actions", [
        [
          ["onAction", "2", "0"],
          ["onAction2", "1", "0"],
        ],
        [["onFoo", "bar", "1"]],
        [["onBar", "foo", "1"]],
      ]);
    });

    it("should increase the component id (cid)", () => {
      const p1 = { onClick: () => {}, "data-action-onclick": "a1_1" };
      const p2 = { onClick: () => {}, "data-action-onclick": "a1_2" };
      const p3 = { onClick: () => {}, "data-action-onclick": "a1_3" };
      const r1 = processServerComponentProps(p1, undefined, controller);

      controller.generateComponentId();
      const r2 = processServerComponentProps(p2, undefined, controller);

      controller.generateComponentId();
      const r3 = processServerComponentProps(p3, undefined, controller);

      expect(r1.onClick).toHaveProperty("cid", "1");
      expect(r2.onClick).toHaveProperty("cid", "2");
      expect(r3.onClick).toHaveProperty("cid", "3");
    });
  });
});
