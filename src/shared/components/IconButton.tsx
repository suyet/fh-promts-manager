import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  label,
  icon,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: ReactNode }) {
  return (
    <button className="icon-btn" aria-label={label} title={label} {...props}>
      {icon}
    </button>
  );
}
