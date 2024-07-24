export default function overrideClientTranslations(
  clientMessages: Record<string, any>,
  overrideMessages: Record<string, any>,
) {
  for (const key in overrideMessages) {
    if (!clientMessages.hasOwnProperty(key)) continue;

    clientMessages[key] =
      typeof clientMessages[key] === 'object'
        ? overrideClientTranslations(clientMessages[key], overrideMessages[key])
        : overrideMessages[key];
  }

  return clientMessages;
}
