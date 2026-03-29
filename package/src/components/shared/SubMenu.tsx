import { useEffect, useRef, type ReactNode } from "react";

interface SubMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

interface SubMenuProps {
  items: SubMenuItem[];
  onDismiss: () => void;
}

export function SubMenu({ items, onDismiss }: SubMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !target.closest("[data-remediate-widget]")
      ) {
        onDismiss();
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      className="rm-submenu"
      data-remediate-widget=""
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          className={`rm-submenu__tile ${item.disabled ? "rm-submenu__tile--disabled" : ""}`}
          onClick={item.disabled ? undefined : item.onClick}
          style={{ animationDelay: `${50 + i * 50}ms` }}
          aria-label={item.label}
          aria-disabled={item.disabled || undefined}
        >
          <span className="rm-submenu__tile-icon">{item.icon}</span>
          <span className="rm-submenu__tile-label">{item.label}</span>
          {item.disabled && item.disabledReason && (
            <span className="rm-submenu__tile-reason">{item.disabledReason}</span>
          )}
        </button>
      ))}
    </div>
  );
}
