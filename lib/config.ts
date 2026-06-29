export const restoreFlowModes = ["free", "payment_required"] as const;

export type RestoreFlowMode = (typeof restoreFlowModes)[number];

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  reviewsUrl: process.env.NEXT_PUBLIC_REVIEWS_URL || "",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || ""
};

export function getRestoreFlowMode(): RestoreFlowMode {
  const value = process.env.RESTORE_FLOW_MODE;

  if (value === "payment_required") {
    return "payment_required";
  }

  return "free";
}
