import React from "react";

export function Panel({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={`panel p-3 ${className}`}>
      {title && <h3 className="mb-2 font-display text-sm uppercase tracking-wide text-fern">{title}</h3>}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "default",
  disabled,
  className = "",
  type = "button",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  const v = variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`btn ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: (color ?? "#5c7a4b") + "33", color: color ?? "#8bab6a", border: `1px solid ${(color ?? "#5c7a4b")}66` }}
    >
      {children}
    </span>
  );
}

export function Modal({
  children,
  onClose,
  title,
  wide,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 animate-fade-in" onClick={onClose}>
      <div
        className={`panel max-h-[90vh] w-full overflow-y-auto scrollbar-thin ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-fern/20 bg-dusk/95 p-3">
          <h2 className="font-display text-lg text-parchment">{title}</h2>
          {onClose && (
            <button className="btn px-3 py-1" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
