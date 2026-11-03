import { type ComponentType, useLayoutEffect, useRef, useState } from "react";

export interface FilterTab<T extends string> {
  id: T;
  label: string;
  count?: number;
  Icon?: ComponentType<{ className?: string; size?: number }>;
}

/** Pill tabs with one sliding ember thumb. Used to split any list: All / X / LinkedIn…, All / Pending / Approved… */
export function FilterTabs<T extends string>({ tabs, value, onChange, label }: { tabs: FilterTab<T>[]; value: T; onChange: (id: T) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-tab="${value}"]`);
    if (!el) return;
    setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [value, tabs.map((t) => `${t.id}${t.count}`).join()]);
  return (
    <div ref={ref} role="tablist" aria-label={label} className="sf-tabs">
      {thumb && <span className="sf-tab-thumb" style={{ left: thumb.left, width: thumb.width }} aria-hidden />}
      {tabs.map(({ id, label: l, count, Icon }) => (
        <button key={id} type="button" role="tab" data-tab={id} aria-selected={value === id} onClick={() => onChange(id)} className="sf-tab">
          {Icon && <Icon size={14} />}
          {l}
          {count !== undefined && <span className="sf-tab-count">{count}</span>}
        </button>
      ))}
    </div>
  );
}
