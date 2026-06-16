"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface NavCTAProps {
  /** Mocked session. Replace with your real auth hook. */
  session?: object | null;
  /** Full-width variant for the mobile menu */
  fullWidth?: boolean;
  onAction?: () => void;
}

export const NavCTA = ({ session = null, fullWidth = false, onAction }: NavCTAProps) => {
  const btnClass = fullWidth
    ? "w-full h-16 text-sm font-bold uppercase tracking-widest rounded-sm"
    : "rounded-sm px-6 h-10 text-[11px] font-bold uppercase tracking-[0.15em]";

  if (session) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Button asChild className={btnClass} onClick={onAction}>
          <Link href="/dashboard">
            Go to Dashboard <ArrowRightIcon className="ml-2 size-3.5" />
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
      <Button asChild className={btnClass} onClick={onAction}>
        <Link href="/auth/register">
          Get Started <ArrowRightIcon className="ml-2 size-3.5" />
        </Link>
      </Button>
    </motion.div>
  );
};