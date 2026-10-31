"use client"
import { AnimatePresence, motion } from "motion/react"
import type React from "react"
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion"

export interface BlurRevealProps {
  children: string
  id?: string
  className?: string
  delay?: number
  speedReveal?: number
  speedSegment?: number
  trigger?: boolean
  onAnimationComplete?: () => void
  onAnimationStart?: () => void
  as?: keyof React.JSX.IntrinsicElements
  style?: React.CSSProperties
  inView?: boolean
  once?: boolean
  letterSpacing?: string | number
}

export function BlurReveal({
  children,
  id,
  className,
  delay = 0,
  speedReveal = 1.5,
  speedSegment = 0.5,
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  as = "p",
  style,
  inView = false,
  once = true,
  letterSpacing,
}: BlurRevealProps) {
  const reduce = usePrefersReducedMotion()
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div

  const stagger = 0.03 / speedReveal
  const baseDuration = 0.3 / speedSegment

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
    exit: {
      transition: {
        staggerChildren: stagger,
        staggerDirection: -1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, filter: "blur(12px)", y: 10 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: baseDuration,
      },
    },
    exit: { opacity: 0, filter: "blur(12px)", y: 10 },
  }

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          id={id}
          data-blur-reveal
          initial={reduce ? false : "hidden"}
          whileInView={inView ? "visible" : undefined}
          animate={inView ? undefined : "visible"}
          exit="exit"
          variants={reduce ? undefined : containerVariants}
          viewport={{ once }}
          className={className}
          onAnimationComplete={onAnimationComplete}
          onAnimationStart={onAnimationStart}
          style={style}
        >
          <span className="sr-only">{children}</span>
          {children &&
            children.split(" ").map((word, wordIndex, wordsArray) => (
              <span key={`word-${wordIndex}`} data-reveal-word={word} className="inline-block whitespace-nowrap" aria-hidden="true">
                {word.split("").map((char, charIndex) => (
                  <motion.span
                    key={`char-${wordIndex}-${charIndex}`}
                    variants={reduce ? undefined : itemVariants}
                    data-blur-letter
                    className="inline-block"
                    style={{
                      ...(letterSpacing ? { marginRight: letterSpacing } : {}),
                      '--word-gradient-width': `${word.length * 100}%`,
                      '--word-gradient-position': `${charIndex / Math.max(word.length - 1, 1) * 100}%`,
                    } as React.CSSProperties}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordIndex < wordsArray.length - 1 && (
                  <motion.span
                    key={`space-${wordIndex}`}
                    variants={reduce ? undefined : itemVariants}
                    className="inline-block"
                  >
                    &nbsp;
                  </motion.span>
                )}
              </span>
            ))}
        </MotionTag>
      )}
    </AnimatePresence>
  )
}
