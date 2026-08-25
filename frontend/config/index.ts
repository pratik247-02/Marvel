// Export all configs here
// Example: export * from "./featureOne";

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Marvel",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  env: process.env.NEXT_PUBLIC_APP_ENV || "development",
  /**
   * Web3Forms access key for the contact form.
   *
   * Public by design - it identifies the form, not the account, and ships in
   * the client bundle like any other `NEXT_PUBLIC_` value. The protection
   * against abuse is the honeypot field plus Web3Forms' own rate limiting,
   * not secrecy.
   *
   * Empty when unset, which the contact form treats as "not configured" and
   * says so, rather than reporting a success it did not achieve.
   */
  web3formsKey: process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "",
} as const;
