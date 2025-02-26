const { stringify, parse } = JSON;

/**
 * Serialize function used to convert events to JSON.
 */
export function stringifyAndCleanEvent(dataToSerialize: any) {
  const event = dataToSerialize?.args?.[0] as Event;

  // Replace the original event object with a serialized version of it.
  if (event instanceof Event) {
    dataToSerialize.args[0] = parse(
      stringify(event, (k, v) => {
        const isInstanceOf = (Instance: any) => v instanceof Instance;
        const isNode = isInstanceOf(Node);

        if (isInstanceOf(Event) || (isNode && k.match(/target/i))) {
          const ev: Record<string, any> = {};
          for (const field in v as any) ev[field] = (v as any)[field];
          if (isInstanceOf(CustomEvent)) ev._wc = true;
          return ev;
        }

        if (v != null && v !== '' && !isNode && !isInstanceOf(Window)) return v;
      }),
    );
  }

  return stringify(dataToSerialize);
}
