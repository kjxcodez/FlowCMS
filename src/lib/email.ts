import { Resend } from "resend";
import { logger } from "./logger";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  from = process.env.RESEND_FROM_EMAIL || "FlowCMS <no-reply@flowcms.dev>",
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      logger.error("Failed to send email", { error, to, subject });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    logger.error("Email service exception", { error: String(err), to, subject });
    return { success: false, error: err };
  }
}
