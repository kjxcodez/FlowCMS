import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan IDs from Razorpay Dashboard
export const RAZORPAY_PLANS = {
  PRO_MONTHLY: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID!,
  PRO_ANNUAL: process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID!,
  AGENCY_MONTHLY: process.env.RAZORPAY_AGENCY_MONTHLY_PLAN_ID!,
  AGENCY_ANNUAL: process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID!,
} as const;

export type PlanKey = keyof typeof RAZORPAY_PLANS;
