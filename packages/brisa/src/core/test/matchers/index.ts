import type { InputType } from "@/types";
import { greenLog, redLog } from "@/utils/log/log-color";

function toBeChecked(received: unknown) {
  if (received instanceof HTMLInputElement === false) {
    throw new Error(
      "Invalid usage of toBeChecked(received). The argument received should be an HTMLInputElement",
    );
  }

  return {
    pass: received.checked,
    message: () => "expected input element to be checked",
  };
}

function toHaveAttribute(received: unknown, attribute: string, value?: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveAttribute(received, attribute). The argument received should be an HTMLElement",
    );
  }

  if (value !== undefined) {
    const attr = received.getAttribute(attribute);
    return {
      pass: attr === value,
      message: () =>
        `Expected: ${greenLog(`"${value}"`)}\nReceived: ${redLog(
          attr ? `"${attr}"` : "null",
        )}`,
    };
  }

  return {
    pass: received.hasAttribute(attribute),
    message: () => `expected element to have attribute ${attribute}`,
  };
}

function toHaveTagName(received: unknown, tagName: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveTagName(received, tagName). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received.tagName.toLowerCase() === tagName.toLowerCase(),
    message: () =>
      `Expected: ${greenLog(tagName)}\nReceived: ${redLog(
        received.tagName.toLowerCase(),
      )}`,
  };
}

function isValidHTMLElement(element: unknown): element is HTMLElement {
  return typeof (element as any)?.textContent === "string";
}

function toHaveTextContent(received: unknown, text: string) {
  if (!isValidHTMLElement(received)) {
    throw new Error(
      "Invalid usage of toHaveTextContent(received, text). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received.textContent === text,
    message: () =>
      `Expected: ${greenLog(`"${text}"`)}\nReceived: ${redLog(
        `"${received.textContent}"`,
      )}`,
  };
}

function toContainTextContent(received: unknown, text: string) {
  if (!isValidHTMLElement(received)) {
    throw new Error(
      "Invalid usage of toContainTextContent(received, text). The argument received should be an HTMLElement",
    );
  }

  return {
    pass:
      typeof received.textContent === "string" &&
      received.textContent.includes(text),
    message: () =>
      `Expected to contain: ${greenLog(`"${text}"`)}\nReceived: ${redLog(
        `"${received.textContent}"`,
      )}`,
  };
}

function toHaveStyle(received: unknown, style: string, value: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveStyle(received, style). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received.style[style as any] === value,
    message: () =>
      `Expected: ${greenLog(`"${value}"`)}\nReceived: ${redLog(
        `"${received.style[style as any]}"`,
      )}`,
  };
}

function toHaveClass(received: unknown, className: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveClass(received, className). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received.classList.contains(className),
    message: () =>
      `Expected: ${greenLog(`"${className}"`)}\nReceived: ${redLog(
        `"${received.className}"`,
      )}`,
  };
}

function toHaveValue(received: unknown, value: string) {
  if (received instanceof HTMLInputElement === false) {
    throw new Error(
      "Invalid usage of toHaveValue(received, value). The argument received should be an HTMLInputElement",
    );
  }

  return {
    pass: received.value === value,
    message: () =>
      `Expected: ${greenLog(`"${value}"`)}\nReceived: ${redLog(
        `"${received.value}"`,
      )}`,
  };
}

function toHaveFocus(received: unknown) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveFocus(received). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received === document.activeElement,
    message: () => "expected element to have focus",
  };
}

function toBeVisible(received: unknown) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toBeVisible(received). The argument received should be an HTMLElement",
    );
  }

  return {
    pass:
      received.offsetParent !== null &&
      received.style.display !== "none" &&
      received.style.visibility !== "hidden",
    message: () => "expected element to be visible",
  };
}

function toBeEnabled(received: unknown) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toBeEnabled(received). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: !received.hasAttribute("disabled"),
    message: () => "expected element to be enabled",
  };
}

function toBeDisabled(received: unknown) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toBeDisabled(received). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received.hasAttribute("disabled"),
    message: () => "expected element to be disabled",
  };
}

function toBeSelected(received: unknown) {
  if (received instanceof HTMLOptionElement === false) {
    throw new Error(
      "Invalid usage of toBeSelected(received). The argument received should be an HTMLOptionElement",
    );
  }

  return {
    pass: received.selected,
    message: () => "expected element to be selected",
  };
}

function toBeRequired(received: unknown) {
  if (received instanceof HTMLInputElement === false) {
    throw new Error(
      "Invalid usage of toBeRequired(received). The argument received should be an HTMLInputElement",
    );
  }

  return {
    pass: received.required,
    message: () => "expected input element to be required",
  };
}

function toBeValid(received: unknown) {
  if (received instanceof HTMLInputElement === false) {
    throw new Error(
      "Invalid usage of toBeValid(received). The argument received should be an HTMLInputElement",
    );
  }

  return {
    pass: received.validity.valid,
    message: () => "expected input element to be valid",
  };
}

function toBeInvalid(received: unknown) {
  if (received instanceof HTMLInputElement === false) {
    throw new Error(
      "Invalid usage of toBeInvalid(received). The argument received should be an HTMLInputElement",
    );
  }

  return {
    pass: !received.validity.valid,
    message: () => "expected input element to be invalid",
  };
}

function toBeInputTypeOf(received: unknown, type: InputType) {
  if (received instanceof HTMLInputElement === false) {
    throw new Error(
      "Invalid usage of toBeInputType(received, type). The argument received should be an HTMLInputElement",
    );
  }

  return {
    pass: received.type === type,
    message: () =>
      `Expected: ${greenLog(`"${type}"`)}\nReceived: ${redLog(
        `"${received.type}"`,
      )}`,
  };
}

function toBeInTheDocument(received: unknown) {
  if (received instanceof HTMLElement === false && received != null) {
    throw new Error(
      "Invalid usage of toBeInTheDocument(received). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received && document.documentElement.contains(received),
    message: () => "expected element to be in the document",
  };
}

function toHaveElementByNodeName(
  received: HTMLElement | DocumentFragment | ShadowRoot,
  elementName: string,
) {
  return {
    pass: received.querySelector(elementName) !== null,
    message: () => `expected element to have ${elementName}`,
  };
}

export default {
  toBeChecked,
  toHaveAttribute,
  toHaveTagName,
  toHaveTextContent,
  toContainTextContent,
  toHaveStyle,
  toHaveClass,
  toHaveValue,
  toHaveFocus,
  toBeVisible,
  toBeEnabled,
  toBeDisabled,
  toBeSelected,
  toBeRequired,
  toBeValid,
  toBeInvalid,
  toBeInputTypeOf,
  toBeInTheDocument,
  toHaveElementByNodeName,
};
