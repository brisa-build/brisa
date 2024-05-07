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

function toHaveAttribute(received: unknown, attribute: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveAttribute(received, attribute). The argument received should be an HTMLElement",
    );
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
    message: () => `expected element to have tag name ${tagName}`,
  };
}

function toHaveRenderedText(received: unknown, text: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toHaveRenderedText(received, text). The argument received should be an HTMLElement",
    );
  }

  return {
    pass: received.textContent === text,
    message: () => `expected element to have rendered text ${text}`,
  };
}

function toContainRenderedText(received: unknown, text: string) {
  if (received instanceof HTMLElement === false) {
    throw new Error(
      "Invalid usage of toContainRenderedText(received, text). The argument received should be an HTMLElement",
    );
  }

  return {
    pass:
      typeof received.textContent === "string" &&
      received.textContent.includes(text),
    message: () => `expected element to contain rendered text ${text}`,
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
    message: () => `expected element to have style ${style} with value ${value}`,
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
    message: () => `expected element to have class ${className}`,
  };
}

/**
 * 
 * TODO:
- `toHaveValue`: Verifies the current value of form elements such as input fields.
- `toHaveFocus`: Indicates whether the target element currently has focus.
- `toBeVisible`: Checks if the target element is visible within the DOM.
- `toBeEnabled`: Verifies that the target element is enabled and interactive.
- `toBeDisabled`: Indicates whether the target element is disabled and non-interactive.
- `toBeSelected`: Indicates whether the target element is selected.
- `toBeRequired`: Indicates whether the target element is required.
- `toBeInvalid`: Indicates whether the target element is invalid.
- `toBeValid`: Checks if the target element is valid.
- `toBeHidden`: Verifies if the target element is hidden.
 */

export default {
  toBeChecked,
  toHaveAttribute,
  toHaveTagName,
  toHaveRenderedText,
  toContainRenderedText,
  toHaveStyle,
  toHaveClass,
};
