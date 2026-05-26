import EmailVerificationPage from "@/components/auth/email-verification";
import React from "react";

export default function page() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      <EmailVerificationPage />
    </div>
  );
}
