import type {
   GenericList,
   GenericListProps,
} from "@/components/Lists/types/ListsTypes.ts";
import { cloneElement, Fragment, isValidElement } from "react";

/**
 * A generic list component that will map over its items list
 *
 * @description This component will render a list of components
 * or let you access the individual items through a custom function.
 * If you do not need to access the individual items or a custom logic,
 * the props item and index will be passed over to the children.
 * @param items - The items array to render.
 * @param children - Either a React Component (will automatically receive the `item` and `index` props),
 * or a function `(item, index) => ReactNode` for custom logic.
 * @example
 *
 * > **Use with a function for custom logic :**
 * > ```tsx
 * > <GenericList items={myItems}>
 * >    {(item, index) => (
 * >       // My custom logic here
 * >       <MyListItem key={item.id} item={item} index={index} />
 * >    )}
 * > </GenericList>
 *
 * > **Use with a children**
 * > ```tsx
 * > <GenericList items={myItems}>
 * >    <MyListItem /> // { item, index } props will be passed automatically
 * > </GenericList>
 * ```
 */

export function GenericList<T>({
   items,
   children,
}: GenericListProps<T>): GenericList<T> {
   return (
      <>
         {items.map((item, index) => {
            if (!item) {
               return null;
            }

            let itemId =
               typeof item === "object" && "id" in item
                  ? item.id
                  : index * Math.random();
            return (
               <Fragment key={String(itemId)}>
                  {typeof children === "function"
                     ? children(item, index)
                     : isValidElement(children)
                     ? cloneElement(children, {
                          ...item,
                          index,
                       })
                     : null}
               </Fragment>
            );
         })}
      </>
   );
}
