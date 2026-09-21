"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Adaptado para NexOS — mantém tema/cores atuais (canvas + #ff5c8a), não slate/cyan do demo original
export function LampDemo() {
  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        className="mt-8 bg-gradient-to-br from-ink to-ink/60 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Build lamps <br /> the right way
      </motion.h1>
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas w-full rounded-md z-0",
        className
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-[1.85] items-center justify-center isolate z-0 -translate-y-20">
        <motion.div
          initial={{ opacity: 0.5, width: "18rem" }}
          whileInView={{ opacity: 1, width: "44rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          } as React.CSSProperties}
          className="absolute inset-auto right-1/2 h-72 overflow-visible w-[44rem] bg-gradient-conic from-[#ff5c8a] via-[#ff5c8a] to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-canvas h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-canvas bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "18rem" }}
          whileInView={{ opacity: 1, width: "44rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          } as React.CSSProperties}
          className="absolute inset-auto left-1/2 h-72 w-[44rem] bg-gradient-conic from-transparent via-[#ff5c8a] to-[#ff5c8a] text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-canvas bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-canvas h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-canvas blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-44 w-[42rem] -translate-y-1/2 rounded-full bg-[#ff5c8a] opacity-25 blur-3xl"></div>
        <motion.div
          initial={{ width: "10rem" }}
          whileInView={{ width: "24rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-30 h-44 w-80 -translate-y-[7rem] rounded-full bg-[#ff7aa2] blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: "18rem" }}
          whileInView={{ width: "44rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-50 h-0.5 w-[44rem] -translate-y-[7rem] bg-gradient-to-r from-[#ff5c8a] via-[#ff5c8a] to-[#ff7aa2]"
        ></motion.div>
        <div className="absolute inset-auto z-20 h-px w-[36rem] -translate-y-[7rem] bg-[#ff5c8a]/20 blur-[1px]" aria-hidden="true" />
        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-canvas"></div>
      </div>
      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">{children}</div>
    </div>
  );
};
