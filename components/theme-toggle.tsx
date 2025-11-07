"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative flex items-center
        w-[64px] h-[32px] rounded-full
        cursor-pointer select-none
        px-1 transition-all duration-500
        ${isDark ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-slate-200"}
      `}
    >
      {/* Sliding background */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          absolute top-0 left-0 h-full w-full rounded-full
          ${isDark ? "bg-gradient-to-r from-indigo-600/80 to-purple-600/80" : ""}
        `}
      />

      {/* Moving circle */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative z-10 flex items-center justify-center
          w-[26px] h-[26px] rounded-full
          ${isDark ? "translate-x-[32px] bg-slate-900 text-yellow-300" : "translate-x-0 bg-white text-slate-700"}
          shadow-md
        `}
      >
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </motion.div>
    </div>
  );
}
