"use client";

// Adapted from React Bits Bell Toggle. Copyright (c) 2026 David Haz.
// See react-bits-LICENSE.md for the component license.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import "./bell-toggle.css";

interface BellToggleProps {
  offLabel?: string;
  onLabel?: string;
  icon?: ReactNode;
  label?: string;
  color?: string;
  background?: string;
  onColor?: string;
  onBackground?: string;
  size?: "sm" | "md" | "lg";
  radius?: number;
  ringAmplitude?: number;
  ringPasses?: number;
  ringDecay?: number;
  ringDuration?: number;
  ringPivot?: number;
  crossfadeMs?: number;
  revealBounce?: number;
  count?: number;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
  waves?: boolean;
  clapper?: boolean;
  pressed?: boolean;
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const SPRING_UI = { type: "spring", duration: 0.3, bounce: 0 } as const;
const SEG_EASE = "cubic-bezier(0.77, 0, 0.175, 1)";
const SIZES = { sm: [40, 14, 16, 15, 8], md: [48, 16, 18, 19, 9], lg: [56, 18, 20, 23, 10] } as const;
const WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 };
const BELL_BODY = "M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z";
const passOffset = (index: number, passes: number) => 1 - Math.pow(1 - (index + 2 / 3) / (passes + 1), 0.6);

function ringKeyframes(from: number, amplitude: number, passes: number, decay: number): Keyframe[] {
  const frames: Keyframe[] = [{ transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE }];
  for (let index = 0; index < passes; index++) {
    const angle = amplitude * Math.pow(1 - index / passes, decay) * (index % 2 ? 1 : -1);
    frames.push({ transform: `rotate(${angle.toFixed(2)}deg)`, offset: passOffset(index, passes), easing: SEG_EASE });
  }
  frames.push({ transform: "rotate(0deg)", offset: 1 });
  return frames;
}

function liveAngle(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === "none") return 0;
  const matrix = new DOMMatrix(transform);
  return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
}

export default function BellToggle({
  offLabel = "เปิดแจ้งเตือน", onLabel = "เปิดแจ้งเตือนแล้ว", icon, label,
  color = "var(--color-ink)", background = "var(--color-background)",
  onColor = "var(--color-ink)", onBackground = "var(--color-primary)",
  size = "md", radius = 22, ringAmplitude = 17, ringPasses = 5, ringDecay = 1,
  ringDuration = 820, ringPivot = 16, crossfadeMs = 200, revealBounce = 0,
  count = 0, badge = true, badgeColor = "#ef4444", badgeTextColor = "#ffffff",
  waves = true, clapper = false, pressed, defaultPressed = false, onChange, disabled = false, className = "",
}: BellToggleProps) {
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const clapperRef = useRef<HTMLSpanElement>(null);
  const waveLeft = useRef<SVGSVGElement>(null);
  const waveRight = useRef<SVGSVGElement>(null);
  const offRef = useRef<HTMLSpanElement>(null);
  const onRef = useRef<HTMLSpanElement>(null);
  const lastInput = useRef<"pointer" | "keyboard">("pointer");
  const pending = useRef<"pointer" | "keyboard" | null>(null);
  const spring = useRef<{ stop: () => void } | null>(null);
  const prevCount = useRef(count);
  const [height, fontSize, iconSize, padding, gap] = SIZES[size];
  const progress = useMotionValue(on ? 1 : 0);
  const offWidth = useMotionValue(0);
  const onWidth = useMotionValue(0);
  const clip = useTransform(() => {
    const a = offWidth.get();
    const b = onWidth.get();
    return `${Math.max(0, Math.max(a, b) - (a + (b - a) * progress.get()))}px`;
  });

  useLayoutEffect(() => {
    let mounted = true;
    const measure = () => {
      if (!mounted) return;
      if (offRef.current) offWidth.set(offRef.current.offsetWidth);
      if (onRef.current) onWidth.set(onRef.current.offsetWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (offRef.current) observer.observe(offRef.current);
    if (onRef.current) observer.observe(onRef.current);
    document.fonts.ready.then(measure);
    return () => { mounted = false; observer.disconnect(); };
  }, [offLabel, onLabel, size, offWidth, onWidth]);

  const swing = useCallback((amplitude: number, passes: number, duration: number) => {
    const element = glyphRef.current;
    if (!element) return;
    element.getAnimations().forEach(animation => animation.cancel());
    element.animate(ringKeyframes(liveAngle(element), amplitude, passes, ringDecay), { duration, easing: "linear" });
    const clapperElement = clapperRef.current;
    if (clapperElement) {
      clapperElement.getAnimations().forEach(animation => animation.cancel());
      clapperElement.animate(ringKeyframes(liveAngle(clapperElement), amplitude * 1.6, passes, ringDecay), { duration, delay: 70, easing: "linear" });
    }
    if (!waves) return;
    for (let index = 0; index < passes; index++) {
      const side = index % 2 ? waveRight.current : waveLeft.current;
      if (!side) continue;
      const strength = Math.pow(1 - index / passes, ringDecay);
      side.animate([
        { opacity: 0, transform: "scale(0.55)" },
        { opacity: 0.9 * strength, offset: 0.3 },
        { opacity: 0, transform: "scale(1.25)" },
      ], { duration: 380, delay: passOffset(index, passes) * duration, easing: "ease-out" });
    }
  }, [ringDecay, waves]);

  useLayoutEffect(() => {
    const pointer = pending.current === "pointer" && !reduce;
    pending.current = null;
    spring.current?.stop();
    if (pointer) spring.current = animate(progress, on ? 1 : 0, { ...SPRING_UI, bounce: revealBounce });
    else progress.jump(on ? 1 : 0);
    if (on && pointer) swing(ringAmplitude, ringPasses, ringDuration);
  }, [on, reduce, progress, revealBounce, ringAmplitude, ringPasses, ringDuration, swing]);
  useLayoutEffect(() => () => spring.current?.stop(), []);

  useEffect(() => {
    const previous = prevCount.current;
    prevCount.current = count;
    if (count > previous && on && !reduce) swing(ringAmplitude * WOBBLE.amplitude, WOBBLE.passes, WOBBLE.duration);
  }, [count, on, reduce, ringAmplitude, swing]);

  const toggle = () => {
    pending.current = lastInput.current;
    if (pressed === undefined) setInner(!on);
    onChange?.(!on);
  };
  const press = (event: PointerEvent<HTMLButtonElement>) => {
    lastInput.current = "pointer";
    if (event.button === 0 && !disabled && rootRef.current) rootRef.current.dataset.pressed = "";
  };
  const release = () => { if (rootRef.current) delete rootRef.current.dataset.pressed; };
  const key = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") lastInput.current = "keyboard";
  };

  const variables: MotionStyle & Record<`--bt-${string}`, string | MotionValue<string>> = {
    "--bt-clip": clip, "--bt-color": color, "--bt-bg": background,
    "--bt-on-color": onColor, "--bt-on-bg": onBackground, "--bt-badge": badgeColor, "--bt-badge-ink": badgeTextColor,
    "--bt-radius": `${radius}px`, "--bt-fade": `${crossfadeMs}ms`, "--bt-pivot": `${ringPivot}%`,
    "--bt-h": `${height}px`, "--bt-fs": `${fontSize}px`, "--bt-icon": `${iconSize}px`, "--bt-px": `${padding}px`, "--bt-gap": `${gap}px`,
  };
  return <motion.span ref={rootRef} className={`bell-toggle ${className}`} data-on={on ? "true" : "false"} data-disabled={disabled ? "" : undefined} style={variables}>
    <button type="button" className="bell-toggle__button" aria-pressed={on} aria-label={label ?? offLabel} disabled={disabled}
      onPointerDown={press} onPointerUp={release} onPointerCancel={release} onPointerLeave={release} onKeyDown={key} onClick={toggle}>
      <span className="bell-toggle__bell" aria-hidden="true">
        <span ref={glyphRef} className="bell-toggle__glyph">{clapper
          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={BELL_BODY} /><path d="M12 2.5V4" /></svg>
          : icon ?? <HugeiconsIcon icon={Notification03Icon} size={iconSize} strokeWidth={2} />}</span>
        {clapper && <span ref={clapperRef} className="bell-toggle__clapper"><svg viewBox="0 0 24 24"><circle cx="12" cy="20.4" r="1.7" fill="currentColor" /></svg></span>}
        {waves && <>
          <svg ref={waveLeft} className="bell-toggle__wave bell-toggle__wave--left" viewBox="0 0 14 14"><path d="M14 8a6 6 0 0 0-6 6" /><path d="M14 4A10 10 0 0 0 4 14" /></svg>
          <svg ref={waveRight} className="bell-toggle__wave bell-toggle__wave--right" viewBox="0 0 14 14"><path d="M0 8a6 6 0 0 1 6 6" /><path d="M0 4a10 10 0 0 1 10 10" /></svg>
        </>}
        {badge && <span className="bell-toggle__badge" data-show={on && count > 0 ? "" : undefined}><span key={count} className="bell-toggle__digit">{count > 9 ? "9+" : count}</span></span>}
      </span>
      <span className="bell-toggle__say" aria-hidden="true">
        <span ref={offRef} className="bell-toggle__face bell-toggle__face--off">{offLabel}</span>
        <span ref={onRef} className="bell-toggle__face bell-toggle__face--on">{onLabel}</span>
      </span>
    </button>
  </motion.span>;
}
