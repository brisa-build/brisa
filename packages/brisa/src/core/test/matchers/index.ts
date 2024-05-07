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

/**
 * 
 * TODO:
- `toHaveAttribute`: Verifies whether a specified attribute exists within the target element.
- `toHaveTagName`: Checks if the target element has a specific HTML tag.
- `toHaveRenderedText`: Ensures that the target element renders the expected text content.
- `toHaveBeenRenderedTimes`: Checks the number of times the target element has been rendered.
- `toContainRenderedText`: Verifies if the rendered text content contains a specific string.
- `toHaveStyle`: Validates the styling properties of the target element.
- `toHaveClass`: Checks for the presence of a specified CSS class within the target element.
- `toHaveValue`: Verifies the current value of form elements such as input fields.
- `toHaveFocus`: Indicates whether the target element currently has focus.
- `toBeSuspenseMode`: Checks if the target component is in suspense mode.
- `toBeErrorMode`: Indicates whether the target component is in error mode.
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
};
