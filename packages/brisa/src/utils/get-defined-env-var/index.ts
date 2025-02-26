const ENV_VAR_PREFIX = 'BRISA_PUBLIC_';

export default function getDefinedEnvVar() {
  const envVar: Record<string, string> = {};

  for (const envKey in Bun.env) {
    if (envKey.startsWith(ENV_VAR_PREFIX)) {
      envVar[`process.env.${envKey}`] = Bun.env[envKey] ?? '';
    }
  }

  return envVar;
}
