/** 把帳號系統的錯誤訊息轉成 i18n key，讓畫面顯示一致的繁中說明 */

export function authErrorKey(message?: string): string {
  const text = (message || "").toLowerCase();

  if (text.includes("invalid login credentials") || text.includes("invalid credentials")) {
    return "auth.error.invalidCredentials";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "auth.error.emailTaken";
  }
  if (text.includes("at least") || text.includes("password should be")) {
    return "auth.error.passwordTooShort";
  }
  if (text.includes("unable to validate email") || text.includes("invalid email")) {
    return "auth.error.emailInvalid";
  }

  return "auth.error.generic";
}
