import type { HTMLProps, ReactNode } from "react";

export function GenericDescription<T extends HTMLProps<HTMLParagraphElement>>({
   children,
   ...props
}: {
   children: ReactNode;
} & T) {
   return (
      <p
         {...props}
         className={`generic-layout__description ${
            props.className ? props.className : ""
         }`}
      >
         {children}
      </p>
   );
}
