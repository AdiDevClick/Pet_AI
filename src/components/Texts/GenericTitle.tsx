import "@css/generic-layout.scss";
import type { HTMLAttributes, ReactNode } from "react";

export function GenericTitle<T extends HTMLAttributes<HTMLHeadingElement>>({
   children,
   ...props
}: {
   children: ReactNode;
} & T) {
   return (
      <h2 {...props} className={`generic-layout__title ${props.className}`}>
         {children}
      </h2>
   );
}
