import type { GenericCardProps } from "@/components/Cards/types/CardTypes.ts";
import { cloneElement, isValidElement } from "react";

/**
 * A reusable card component
 *
 * @description
 * If used with ListMapper, this component will automatically
 * receive the `item` and `index` props for each card.
 * It will act as a normal Component otherwise.
 *
 * @typeParam T - The type of the item to display (generic, can be any object or value).
 * @param children
 *   The content to display inside the card.
 *   **If it is a React element, it will automatically receive
 *   the `item` and `index` props**.
 * @param item
 *   (Optional) The current item from the list (automatically injected by ListMapper).
 * @param index
 *   (Optional) The current index from the list (automatically injected by ListMapper).
 * @param ...props
 *   Any other HTML props for the root div.
 *
 * @example
 * > **Usage with ListMapper**
 * > ```tsx
 * > <ListMapper items={data}>
 * >  <GenericCard className="my-card" />
 * > </ListMapper>
 * > ```
 *
 * > **Direct usage**
 * > ```tsx
 * > <GenericCard
 * >     item={{ id: 1, label: "Example" }}
 * >     index={0}
 * >   >
 * >   <div>My content</div>
 * > </GenericCard>
 * ```
 */
export function GenericCard<T>({
   children,
   className,
   index,
   ...props
}: GenericCardProps<T>) {
   let cardId;

   if (typeof props === "object") {
      cardId = "id" in props ? props.id : Math.random();
   }

   return (
      <div id={`card-${cardId}`} className={`card ${className ?? ""}`}>
         {isValidElement(children)
            ? cloneElement(children, { ...props, index } as {
                 item?: T;
                 index?: number;
              })
            : children}
      </div>
   );
}
