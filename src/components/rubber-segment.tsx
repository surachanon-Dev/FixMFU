"use client";

// Adapted from React Bits RubberSegment. Copyright (c) 2026 David Haz.
// See react-bits-LICENSE.md. The measured thumb and drag support a two-row grid.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import "./rubber-segment.css";

interface SegmentItem { value: string; label: ReactNode; icon?: ReactNode; ariaLabel?: string }
interface Slot { l: number; r: number; t: number; b: number }
interface DragState { id: number; slot: number; x0: number; y0: number; onThumb: boolean; live: boolean; offsetX: number; offsetY: number; w: number; h: number; hist: [number, number, number][] }
interface RubberSegmentProps {
  items: readonly SegmentItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  onClear?: () => void;
  allowEmpty?: boolean;
  name?: string;
  ariaLabel: string;
  columns?: 1 | 2 | 3 | 4;
  variant?: "default" | "cards";
  controlsId?: string;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  activeTextColor?: string;
  radius?: number;
  inset?: number;
  stretch?: number;
  squash?: number;
  speed?: number;
  glide?: number;
  draggable?: boolean;
  disabled?: boolean;
  className?: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SPRING_UI = { type: "spring", duration: 0.3, bounce: 0 } as const;
const SPRING_MOMENTUM = { type: "spring", duration: 0.4, bounce: 0.2 } as const;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const rubber = (over: number, dim: number) => over * dim * 0.55 / (dim + 0.55 * Math.abs(over));
const project = (v: number, glide: number) => { const d = 1 - 0.1 * Math.pow(0.05, glide / 100); return v / 1000 * d / (1 - d); };

export default function RubberSegment({ items, value, defaultValue, onChange, onClear, allowEmpty = false, name, ariaLabel, columns = 2, variant = "default", controlsId,
  trackColor = "var(--color-background)", thumbColor = "var(--color-primary)", textColor = "var(--color-ink)", activeTextColor = "var(--color-ink)",
  radius = 16, inset = 4, stretch = 100, squash = 3, speed = 1, glide = 75, draggable = true, disabled = false, className = "",
}: RubberSegmentProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value ?? "");
  const matched = items.findIndex(item => item.value === (value ?? inner));
  const index = allowEmpty ? matched : Math.max(0, matched);
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slots = useRef<Slot[]>([]);
  const box = useRef<DOMRect | null>(null);
  const committed = useRef(index);
  const handoff = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const drag = useRef<DragState | null>(null);
  const left = useMotionValue(0), right = useMotionValue(0), top = useMotionValue(0), bottom = useMotionValue(0);
  const width = useMotionValue(0), height = useMotionValue(0);
  const thumbRadius = Math.max(0, radius - inset);
  const clipPath = useTransform(() => `inset(${Math.max(0, top.get())}px ${Math.max(0, width.get() - right.get())}px ${Math.max(0, height.get() - bottom.get())}px ${Math.max(0, left.get())}px round ${thumbRadius}px)`);
  const duration = (seconds: number) => seconds / Math.max(0.1, speed);

  function cancelAnimation() {
    if (handoff.current) clearTimeout(handoff.current);
    generation.current++;
    left.stop(); right.stop(); top.stop(); bottom.stop();
  }

  function jumpTo(i: number) {
    cancelAnimation();
    const slot = slots.current[i];
    if (!slot) return;
    left.jump(slot.l); right.jump(slot.r); top.jump(slot.t); bottom.jump(slot.b);
  }

  function measure() {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    box.current = rect;
    slots.current = itemRefs.current.slice(0, items.length).map(element => {
      const r = element?.getBoundingClientRect();
      return r ? { l: r.left - rect.left - inset, r: r.right - rect.left - inset, t: r.top - rect.top - inset, b: r.bottom - rect.top - inset } : { l: 0, r: 0, t: 0, b: 0 };
    });
    width.set(rect.width - inset * 2); height.set(rect.height - inset * 2);
    drag.current = null;
    delete track.dataset.held;
    jumpTo(committed.current);
  }

  const listKey = items.map(item => item.value).join("|");
  useLayoutEffect(() => {
    let alive = true;
    const settle = () => { if (alive) measure(); };
    settle();
    const observer = new ResizeObserver(settle);
    if (trackRef.current) observer.observe(trackRef.current);
    document.fonts?.ready.then(settle);
    return () => { alive = false; observer.disconnect(); cancelAnimation(); };
    // Measurement uses the latest DOM after item or layout changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, columns, inset]);

  useEffect(() => {
    if (disabled) { drag.current = null; if (trackRef.current) delete trackRef.current.dataset.held; }
    if ((!drag.current && committed.current !== index) || reduce || disabled) {
      committed.current = index;
      jumpTo(index);
    }
  });

  function commit(i: number) {
    if (disabled || !items[i]) return;
    committed.current = i;
    if (i === index) return;
    if (value === undefined) setInner(items[i].value);
    onChange?.(items[i].value, i);
  }

  function land(to: number, vx = 0, vy = 0, flick = false, withSquash = true) {
    const slot = slots.current[to];
    if (!slot) return;
    const g = ++generation.current;
    const spring = { ...(flick ? SPRING_MOMENTUM : SPRING_UI), duration: duration(flick ? 0.4 : 0.3) };
    function axis(a: MotionValue<number>, b: MotionValue<number>, min: number, max: number, v: number) {
      const dir = Math.sign((min + max) / 2 - (a.get() + b.get()) / 2) || 1;
      const [lead, leadTo, trail, trailTo] = dir > 0 ? [b, max, a, min] : [a, min, b, max];
      animate(lead, leadTo, { ...spring, velocity: clamp(v, -2000, 2000) });
      const extra = withSquash ? Math.max(0, squash) * dir : 0;
      void animate(trail, trailTo + extra, { ...spring, velocity: clamp(v, -2000, 2000) }).then(() => {
        if (generation.current === g && extra) animate(trail, trailTo, { type: "spring", duration: duration(0.16), bounce: 0 });
      });
    }
    axis(left, right, slot.l, slot.r, vx); axis(top, bottom, slot.t, slot.b, vy);
  }

  function travel(from: number, to: number) {
    const a = slots.current[from], b = slots.current[to];
    if (!a || from === to) { jumpTo(to); return; }
    if (!b) return;
    cancelAnimation();
    if (reduce) { jumpTo(to); return; }
    const u = clamp(stretch, 0, 150) / 100;
    const tween = { duration: duration(0.19), ease: EASE_OUT };
    animate(left, b.l + (Math.min(a.l, b.l) - b.l) * u, tween);
    animate(right, b.r + (Math.max(a.r, b.r) - b.r) * u, tween);
    animate(top, b.t + (Math.min(a.t, b.t) - b.t) * u, tween);
    animate(bottom, b.b + (Math.max(a.b, b.b) - b.b) * u, tween);
    handoff.current = setTimeout(() => land(to), duration(0.15) * 1000);
  }

  function tap(i: number) {
    if (disabled) return;
    if (allowEmpty && onClear && i === index) {
      cancelAnimation();
      committed.current = -1;
      if (value === undefined) setInner("");
      onClear();
      return;
    }
    const from = committed.current;
    commit(i);
    travel(from, i);
  }

  function local(event: PointerEvent) {
    return { x: event.clientX - (box.current?.left ?? 0) - inset, y: event.clientY - (box.current?.top ?? 0) - inset };
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, i: number) {
    if (disabled || drag.current || event.button !== 0 || !trackRef.current) return;
    box.current = trackRef.current.getBoundingClientRect();
    const { x, y } = local(event);
    const onThumb = index >= 0 && draggable && x >= left.get() && x <= right.get() && y >= top.get() && y <= bottom.get();
    drag.current = { id: event.pointerId, slot: i, x0: x, y0: y, onThumb, live: false, offsetX: x - left.get(), offsetY: y - top.get(), w: right.get() - left.get(), h: bottom.get() - top.get(), hist: [[event.timeStamp, x, y]] };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer may already have been released. */ }
    if (onThumb) cancelAnimation();
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || event.pointerId !== d.id || !d.onThumb) return;
    const { x, y } = local(event);
    d.hist.push([event.timeStamp, x, y]); if (d.hist.length > 8) d.hist.shift();
    if (!d.live && Math.hypot(x - d.x0, y - d.y0) < 4) return;
    d.live = true;
    if (trackRef.current) trackRef.current.dataset.held = "";
    function move(a: MotionValue<number>, b: MotionValue<number>, min: number, span: number, limit: number) {
      const max = Math.max(0, limit - span);
      if (reduce) { const n = clamp(min, 0, max); a.set(n); b.set(n + span); }
      else if (min < 0) { a.set(0); b.set(span - rubber(-min, span)); }
      else if (min > max) { b.set(limit); a.set(max + rubber(min - max, span)); }
      else { a.set(min); b.set(min + span); }
    }
    move(left, right, x - d.offsetX, d.w, width.get()); move(top, bottom, y - d.offsetY, d.h, height.get());
  }

  function release() {
    const d = drag.current;
    drag.current = null;
    if (trackRef.current) delete trackRef.current.dataset.held;
    return d;
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    const d = release()!;
    const { x, y } = local(event);
    if (!d.live) {
      if (Math.hypot(x - d.x0, y - d.y0) <= 10) tap(d.slot);
      else jumpTo(committed.current);
      return;
    }
    const recent = d.hist.filter(([time]) => event.timeStamp - time <= 100);
    const first = recent[0], last = recent[recent.length - 1];
    const dt = first && last ? last[0] - first[0] : 0;
    const vx = dt >= 8 ? clamp((last[1] - first[1]) / dt * 1000, -2000, 2000) : 0;
    const vy = dt >= 8 ? clamp((last[2] - first[2]) / dt * 1000, -2000, 2000) : 0;
    const targetX = (left.get() + right.get()) / 2 + project(vx, glide);
    const targetY = (top.get() + bottom.get()) / 2 + project(vy, glide);
    let to = 0;
    const distance = (slot: Slot) => Math.hypot((slot.l + slot.r) / 2 - targetX, (slot.t + slot.b) / 2 - targetY);
    slots.current.forEach((slot, i) => { if (distance(slot) < distance(slots.current[to])) to = i; });
    commit(to);
    itemRefs.current[to]?.focus({ preventScroll: true });
    if (reduce) jumpTo(to); else land(to, vx, vy, Math.hypot(vx, vy) > 110);
  }

  function pointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    release();
    jumpTo(committed.current);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>, focusedIndex: number) {
    if (disabled || !items.length) return;
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); tap(focusedIndex); return; }
    const renderedColumns = trackRef.current ? getComputedStyle(trackRef.current).gridTemplateColumns.split(" ").length : columns;
    let next = index < 0 ? focusedIndex : index;
    if (event.key === "ArrowRight") next++;
    else if (event.key === "ArrowLeft") next--;
    else if (event.key === "ArrowDown") next += renderedColumns;
    else if (event.key === "ArrowUp") next -= renderedColumns;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    next = clamp(next, 0, items.length - 1);
    commit(next); jumpTo(next); itemRefs.current[next]?.focus();
  }

  const style = { "--rs-cols": columns, "--rs-track": trackColor, "--rs-thumb": thumbColor, "--rs-ink": textColor, "--rs-ink-active": activeTextColor, "--rs-radius": `${radius}px`, "--rs-inset": `${inset}px`, "--rs-thumb-radius": `${thumbRadius}px` } as CSSProperties;
  const content = (item: SegmentItem) => <>{item.icon && <span className="rubber-segment__icon" aria-hidden="true">{item.icon}</span>}<span className="rubber-segment__label">{item.label}</span></>;
  return <div ref={trackRef} role="radiogroup" aria-label={ariaLabel} aria-disabled={disabled || undefined} data-empty={index < 0 ? "" : undefined} data-draggable={draggable && !disabled ? "" : undefined} className={`rubber-segment ${variant === "cards" ? "rubber-segment--cards" : ""} ${className}`} style={style} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} onLostPointerCapture={pointerCancel}>
    {name && <input type="hidden" name={name} value={items[index]?.value ?? ""} disabled={disabled} />}
    {items.map((item, i) => <button key={item.value} ref={element => { itemRefs.current[i] = element; }} type="button" role="radio" aria-label={item.ariaLabel} aria-controls={controlsId} aria-checked={i === index} tabIndex={i === (index < 0 ? 0 : index) ? 0 : -1} disabled={disabled} className="rubber-segment__item" onPointerDown={event => pointerDown(event, i)} onKeyDown={event => keyDown(event, i)} onClick={event => { if (event.detail === 0) tap(i); }}>{content(item)}</button>)}
    <motion.div className="rubber-segment__thumb" aria-hidden="true" style={{ clipPath }}>{items.map(item => <span key={item.value} className="rubber-segment__item rubber-segment__copy">{content(item)}</span>)}</motion.div>
  </div>;
}
