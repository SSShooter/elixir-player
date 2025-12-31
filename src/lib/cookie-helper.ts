export type MusicProvider = "netease" | "tencent" | "kugou" | "baidu" | "kuwo";

/**
 * Get the cookie for meting API based on provider
 * Priority: user configured cookie > provider-specific env var > generic env var
 * @param provider - Music provider (netease, tencent, kugou, baidu, kuwo)
 * @param userCookie - Optional user-configured cookie from localStorage
 */
export function getMetingCookie(
  provider: MusicProvider,
  userCookie?: string
): string | undefined {
  // Priority 1: User configured cookie
  if (userCookie) {
    return userCookie;
  }

  // Priority 2: Environment variable (provider-specific)
  const envKey = `METING_COOKIE_${provider.toUpperCase()}`;
  const providerCookie = process.env[envKey];
  if (providerCookie) {
    return providerCookie;
  }

  // Priority 3: Fallback to generic METING_COOKIE for backward compatibility
  return process.env.METING_COOKIE;
}
