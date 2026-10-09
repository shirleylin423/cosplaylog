/** 把帳號系統的錯誤訊息轉成 i18n key，讓畫面顯示一致的繁中說明 */

export function authErrorKey(message?: string): string {
  const text = (message || "").toLowerCase();

  // 順序有意義：越具體的放在越前面
  if (text.includes("email not confirmed")) {
    return "auth.error.emailNotConfirmed";
  }
  if (text.includes("invalid login credentials") || text.includes("invalid credentials")) {
    return "auth.error.invalidCredentials";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "auth.error.emailTaken";
  }
  if (text.includes("signups not allowed") || text.includes("signup is disabled") || text.includes("signups are disabled")) {
    return "auth.error.signupDisabled";
  }
  if (text.includes("rate limit") || text.includes("too many requests")) {
    return "auth.error.rateLimited";
  }
  if (text.includes("invalid api key") || text.includes("no api key") || text.includes("api key")) {
    return "auth.error.apiKey";
  }
  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network error") ||
    text.includes("load failed")
  ) {
    return "auth.error.network";
  }
  if (text.includes("at least") || text.includes("password should be")) {
    return "auth.error.passwordTooShort";
  }
  if (text.includes("unable to validate email") || text.includes("invalid email")) {
    return "auth.error.emailInvalid";
  }

  return "auth.error.generic";
}
