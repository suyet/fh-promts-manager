import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  label,
  icon,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: ReactNode }) {
  return (
    <button className={["icon-btn", className].filter(Boolean).join(" ")} aria-label={label} title={label} {...props}>
      {icon}
    </button>
  );
}
