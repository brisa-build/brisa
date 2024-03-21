import { createContext } from "brisa";

const context = createContext("foo");

export default async function SomePage() {
  return (
    <context-provider context={context} value="bar">
      <h1>Some page</h1>
    </context-provider>
  );
}
