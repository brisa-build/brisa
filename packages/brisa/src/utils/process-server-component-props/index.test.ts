import { describe, it, expect } from "bun:test";
import processServerComponentProps from ".";

describe("utils", () => {
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

      const result = processServerComponentProps(props, parentProps);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "2");
      expect(result.onClick).toHaveProperty("actions", [[["onAction", "1"]]]);
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

      const result = processServerComponentProps(props, parentProps);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "3");
      expect(result.onClick).toHaveProperty("actions", [
        [
          ["onAction", "2"],
          ["onAction2", "1"],
        ],
      ]);
    });

    it("should add grantparents action dependencies", () => {
      const onClick = () => {};
      const onAction = () => {};
      const onAction2 = () => {};
      const grantparentDeps = [[["onFoo", "bar"]], [["onBar", "foo"]]];

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

      const result = processServerComponentProps(props, parentProps);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "3");
      expect(result.onClick).toHaveProperty("actions", [
        [
          ["onAction", "2"],
          ["onAction2", "1"],
        ],
        [["onFoo", "bar"]],
        [["onBar", "foo"]],
      ]);
    });
  });
});
