import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

export function Button({
  variant = "secondary",
  children,
  className,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  return (
    <button className={["btn", `btn-${variant}`, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
