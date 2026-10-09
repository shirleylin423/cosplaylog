/**
 * 這個檔案原本負責啟動 Enter（Converge）的網站分析 SDK。
 *
 * 為了讓 App 完全獨立、不再對 Converge 送出任何請求，這裡已停用：
 * 不再載入 @enter-pro/analytics-sdk，也不發出任何網路請求。
 *
 * main.tsx（平台產生、不可修改）會呼叫 bootstrapGeneratedSiteAnalytics()，
 * 所以保留同名匯出，讓它成為空操作。
 *
 * 若之後想要網站流量分析，建議接自己的服務，例如 Cloudflare Web Analytics
 * 或 Plausible，再在這裡實作。
 */

export function bootstrapGeneratedSiteAnalytics(): void {
  // 已停用：不載入 Enter 分析 SDK，因此不會有任何 Converge 相關的網路請求。
}
