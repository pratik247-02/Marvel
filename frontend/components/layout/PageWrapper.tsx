"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      // Just the header offset. No minimum height and no flex sizing: the
      // footer follows the content in normal flow, so forcing main to a
      // particular height only ever adds empty space.
      className={cn("pt-16", className)}
    >
      {children}
    </motion.main>
  );
}
