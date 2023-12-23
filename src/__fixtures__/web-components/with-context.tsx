import { createContext } from "../../../out/core";

const context = createContext("foo");

export default function WithContext() {
  return (
    <context-provider context={context} value="bar">
      <h1>With Context</h1>
    </context-provider>
  );
}
