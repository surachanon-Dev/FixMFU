"use client";

// Adapted from React Bits Branched Menu: https://reactbits.dev/micro/branched-menu
// Copyright (c) 2026 David Haz. See react-bits-LICENSE.md.
import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import "./branched-menu.css";

export interface BranchedMenuLink {
  value: string;
  label: string;
  href: string;
  icon?: IconSvgElement;
  children?: never;
}

export interface BranchedMenuSection {
  label: string;
  icon?: IconSvgElement;
  children: BranchedMenuLink[];
  value?: never;
  href?: never;
}

export type BranchedMenuItem = BranchedMenuLink | BranchedMenuSection;

interface BranchedMenuProps {
  items: BranchedMenuItem[];
  activeValue: string;
  defaultOpen?: number | number[];
  onSelect?: (value: string, item: BranchedMenuLink) => void;
  onToggle?: (index: number, open: boolean) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
}

const PAD = 6;
const MARK = 16;
const toSet = (open: number | number[]) => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

export default function BranchedMenu({
  items, activeValue, defaultOpen = 0, onSelect, onToggle,
  color = "var(--color-ink)", accentColor = "var(--color-primary)", lineColor = "var(--color-line)",
  width = 240, rowHeight = 40, indent = 38, trunk = 14, radius = 10,
  lineWidth = 1.5, fontSize = 14, drawDuration = 300, foldDuration = 220, className = "",
}: BranchedMenuProps) {
  const [open, setOpen] = useState(() => toSet(defaultOpen));
  const id = useId();
  const navRef = useRef<HTMLElement>(null);
  const heads = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);
  const activeSection = items.findIndex(item => item.children
    ? item.children.some(child => child.value === activeValue)
    : item.value === activeValue);
  const markerShown = activeSection >= 0 && (!items[activeSection].children || open.has(activeSection));

  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const marker = markerRef.current;
      const head = heads.current[activeSection];
      if (!marker) return;
      if (!glide) marker.style.transition = "none";
      if (markerShown && head) marker.style.top = `${head.offsetTop + (head.offsetHeight - MARK) / 2}px`;
      marker.toggleAttribute("data-on", Boolean(markerShown && head));
      if (!glide) {
        void marker.offsetHeight;
        marker.style.transition = "";
      }
    };
    place(true);
    const observer = new ResizeObserver(() => place(false));
    if (navRef.current) observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const toggle = (index: number) => {
    const next = new Set(open);
    const isOpen = !next.has(index);
    if (isOpen) next.add(index);
    else next.delete(index);
    setOpen(next);
    onToggle?.(index, isOpen);
  };
  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = (index: number) => PAD + index * rowHeight + rowHeight / 2;
  const branch = (index: number) => `M ${trunk} ${rowY(index) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(index)} H ${endX}`;
  const reach = (index: number) => `M ${trunk} 0 V ${rowY(index) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(index)} H ${endX}`;
  const variables: CSSProperties & Record<`--bm-${string}`, string | number> = {
    "--bm-w": `${width}px`, "--bm-ink": color, "--bm-accent": accentColor, "--bm-line": lineColor,
    "--bm-font": `${fontSize}px`, "--bm-row": `${rowHeight}px`, "--bm-indent": `${indent}px`,
    "--bm-line-w": lineWidth, "--bm-draw": `${drawDuration}ms`, "--bm-fold": `${foldDuration}ms`,
  };
  const icon = (value?: IconSvgElement) => value
    ? <HugeiconsIcon icon={value} size={18} strokeWidth={1.6} aria-hidden="true" />
    : null;

  return <nav ref={navRef} aria-label="เมนูผู้ดูแลระบบ" className={`branched-menu ${className}`} style={variables}>
    <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
    {items.map((item, index) => {
      const kids = item.children;
      const isOpen = open.has(index);
      const bodyId = `${id}-section-${index}`;
      const current = index === activeSection;
      const bodyHeight = kids ? PAD * 2 + kids.length * rowHeight : 0;
      return <div key={item.value ?? item.label} className="branched-menu__section" data-open={kids && isOpen ? "" : undefined}>
        {kids ? <button
          ref={element => { heads.current[index] = element; }}
          type="button" className="branched-menu__head" aria-expanded={isOpen} aria-controls={bodyId}
          data-current={current ? "" : undefined} onClick={() => toggle(index)}
        >{icon(item.icon)}<span>{item.label}</span><HugeiconsIcon icon={ArrowDown01Icon} size={14} className="branched-menu__chevron" aria-hidden="true" /></button>
          : <Link
            ref={element => { heads.current[index] = element; }}
            href={item.href} className="branched-menu__head" aria-current={current ? "page" : undefined}
            data-active={current ? "" : undefined} onClick={() => onSelect?.(item.value, item)}
          >{icon(item.icon)}<span>{item.label}</span></Link>}
        {kids && <div id={bodyId} className="branched-menu__body" inert={!isOpen}>
          <div className="branched-menu__fold">
            <div className="branched-menu__tree" style={{ height: bodyHeight }}>
              <svg className="branched-menu__lines" width={indent} height={bodyHeight} aria-hidden="true">
                <path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
                {kids.map((kid, childIndex) => <path key={kid.value} className="branched-menu__base" d={branch(childIndex)} />)}
                {kids.map((kid, childIndex) => <path key={kid.value} className="branched-menu__reach" d={reach(childIndex)} pathLength={1} strokeDasharray={1} strokeDashoffset={kid.value === activeValue ? 0 : 1} />)}
              </svg>
              {kids.map(kid => <Link
                key={kid.value} href={kid.href} className="branched-menu__item"
                aria-current={kid.value === activeValue ? "page" : undefined} data-active={kid.value === activeValue ? "" : undefined}
                tabIndex={isOpen ? 0 : -1} onClick={() => onSelect?.(kid.value, kid)}
              >{icon(kid.icon)}<span className="branched-menu__label">{kid.label}</span></Link>)}
            </div>
          </div>
        </div>}
      </div>;
    })}
  </nav>;
}
