"use client";
import { Button } from "@/components/ui/button";
import { JSX } from "react";

export const TermsAndPrivacy = (): JSX.Element => {
  return (
    <div className="text-xs text-white/70 text-center">
      By continuing, you agree to our{" "}
      <Button
        variant="link"
        className="px-1 h-auto text-xs text-white/90 hover:text-white transition-colors duration-200"
      >
        Terms of Service
      </Button>{" "}
      and{" "}
      <Button
        variant="link"
        className="px-1 h-auto text-xs text-white/90 hover:text-white transition-colors duration-200"
      >
        Privacy Policy
      </Button>
    </div>
  );
};
