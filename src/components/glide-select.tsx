"use client";

// Adapted from React Bits GlideSelect. See react-bits-LICENSE.md.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import "./glide-select.css";

export interface GlideSelectOption {
  value: string;
  label: string;
  tag?: string;
}

interface GlideSelectProps {
  options: readonly GlideSelectOption[];
  value: string;
  onChange: (value: string, option: GlideSelectOption) => void;
  id?: string;
  name?: string;
  ariaLabel: string;
  placeholder?: string;
}

type Phase = "closed" | "open" | "closing";
const ROW_HEIGHT = 44;
const STEP = ROW_HEIGHT + 1;
const MENU_GAP = 6;
const CLOSE_DURATION = 140;

export default function GlideSelect({ options, value, onChange, id, name, ariaLabel, placeholder = "เลือกหมวดหมู่" }: GlideSelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const selected = options.findIndex((option) => option.value === value);
  const [phase, setPhase] = useState<Phase>("closed");
  const [active, setActive] = useState<number | null>(null);
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const instant = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrub = useRef<{ id: number; top: number } | null>(null);

  const close = useCallback((animate = false) => {
    clearTimeout(closeTimer.current);
    scrub.current = null;
    setActive(null);
    if (!animate) {
      setPhase("closed");
      return;
    }
    setPhase("closing");
    closeTimer.current = setTimeout(() => setPhase("closed"), CLOSE_DURATION);
  }, []);

  const open = (viaKey: boolean) => {
    if (!options.length) return;
    clearTimeout(closeTimer.current);
    const bounds = rootRef.current?.getBoundingClientRect();
    const needed = options.length * STEP + 7 + MENU_GAP;
    setSide(bounds && bounds.bottom + needed > window.innerHeight && bounds.top >= needed ? "top" : "bottom");
    instant.current = true;
    setActive(selected >= 0 ? selected : viaKey ? 0 : null);
    setPhase("open");
  };

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (phase !== "open" || !menu) return;
    menu.dataset.state = "closed";
    void menu.offsetHeight;
    menu.dataset.state = "open";
  }, [phase]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill || phase !== "open") return;
    if (active === null) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.transitionDuration = instant.current || pill.style.opacity !== "1" ? "0ms, 150ms" : "";
    pill.style.transform = `translateY(${active * STEP}px)`;
    pill.style.opacity = "1";
    instant.current = false;
  }, [active, phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const onDown = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close(true);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [phase, close]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const pick = (index: number, viaKey = false) => {
    const option = options[index];
    if (option && option.value !== value) {
      onChange(option.value, option);
      if (!viaKey && rootRef.current) rootRef.current.dataset.swap = "";
    }
    close();
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key;
    if (phase !== "open") {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(key)) {
        event.preventDefault();
        open(true);
      }
      return;
    }
    const current = active ?? Math.max(0, selected);
    const go = (index: number) => {
      event.preventDefault();
      instant.current = true;
      setActive(Math.min(options.length - 1, Math.max(0, index)));
    };
    if (key === "ArrowDown" || key === "ArrowUp") go(current + (key === "ArrowDown" ? 1 : -1));
    else if (key === "Home" || key === "End") go(key === "Home" ? 0 : options.length - 1);
    else if (key === "Enter" || key === " ") {
      event.preventDefault();
      pick(current, true);
    } else if (key === "Escape" || key === "Tab") {
      if (key === "Escape") event.preventDefault();
      close();
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      for (let offset = 1; offset <= options.length; offset++) {
        const index = (current + offset) % options.length;
        if (options[index].label.toLowerCase().startsWith(key.toLowerCase())) {
          go(index);
          break;
        }
      }
    }
  };

  const rowAt = (y: number) => {
    if (!scrub.current) return null;
    // The list starts inside the menu padding; its own top needs no padding offset.
    const index = Math.floor((y - scrub.current.top) / STEP);
    return index >= 0 && index < options.length ? index : null;
  };

  const onListUp = (event: PointerEvent<HTMLDivElement>) => {
    if (scrub.current?.id !== event.pointerId) return;
    const index = event.type === "pointerup" ? rowAt(event.clientY) : null;
    scrub.current = null;
    if (index !== null) pick(index);
  };

  return (
    <div
      ref={rootRef}
      className="glide-select w-full"
      data-side={side}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onAnimationEnd={(event) => {
        if (event.animationName === "gs-swap" && rootRef.current) delete rootRef.current.dataset.swap;
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={phase === "open"}
        aria-controls={phase === "open" ? `${controlId}-list` : undefined}
        aria-activedescendant={phase === "open" && active !== null ? `${controlId}-${active}` : undefined}
        aria-label={ariaLabel}
        disabled={!options.length}
        className="glide-select__trigger"
        onClick={() => phase === "open" ? close(true) : open(false)}
        onKeyDown={onTriggerKey}
      >
        <span className="glide-select__label" key={value} data-empty={selected < 0 ? "" : undefined}>
          {selected >= 0 ? options[selected].label : placeholder}
        </span>
        <span className="glide-select__chevron" aria-hidden="true">
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} />
        </span>
      </button>
      {phase !== "closed" ? (
        <div ref={menuRef} className="glide-select__menu" data-state={phase === "open" ? "open" : "closed"} data-side={side} data-align="left" inert={phase !== "open"} aria-hidden={phase !== "open"}>
          <div
            id={`${controlId}-list`}
            role="listbox"
            aria-label={ariaLabel}
            className="glide-select__list"
            data-live={active !== null ? "" : undefined}
            onPointerOver={(event) => {
              if (event.pointerType === "touch" || scrub.current || !(event.target instanceof Element)) return;
              const row = event.target.closest<HTMLElement>("[data-index]");
              if (row) setActive(Number(row.dataset.index));
            }}
            onPointerDown={(event) => {
              if (event.button !== 0 || scrub.current) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              scrub.current = { id: event.pointerId, top: event.currentTarget.getBoundingClientRect().top };
              instant.current = true;
              setActive(rowAt(event.clientY));
            }}
            onPointerMove={(event) => {
              if (scrub.current?.id === event.pointerId) setActive(rowAt(event.clientY));
            }}
            onPointerUp={onListUp}
            onPointerCancel={onListUp}
            onLostPointerCapture={onListUp}
          >
            <span ref={pillRef} className="glide-select__pill" aria-hidden="true" />
            {options.map((option, index) => (
              <div key={option.value} id={`${controlId}-${index}`} role="option" aria-selected={index === selected} data-index={index} className="glide-select__option" onClick={() => pick(index)}>
                <span className="glide-select__name">{option.label}</span>
                {option.tag ? <span className="glide-select__tag">{option.tag}</span> : null}
                <span className="glide-select__check" data-on={index === selected ? "" : undefined} aria-hidden="true">
                  <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
