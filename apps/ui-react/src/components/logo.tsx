import type { ComponentProps } from "react";

export function Logo({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="363"
      height="223"
      viewBox="0 0 363 223"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="111.5" cy="111.5" r="106.5" fill="white" stroke="currentColor" strokeWidth="10" />
      <circle
        cx="251.5"
        cy="111.5"
        r="106.5"
        fill="var(--primary)"
        stroke="currentColor"
        strokeWidth="10"
      />
    </svg>
  );
}
