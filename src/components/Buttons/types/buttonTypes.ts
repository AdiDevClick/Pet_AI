import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps<T>
   extends ButtonHTMLAttributes<HTMLButtonElement> {
   children?: ReactNode;
   type?: "button" | "submit" | "reset";
   customProps?: T;
}
