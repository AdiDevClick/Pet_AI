import "@css/tasks.scss";
import { memo } from "react";
export const MemoizedTasks = memo(function Tasks({ children }) {
   return (
      <section className="tasks">
         <div className="task-description">
            <h3>📋 Tâche actuelle</h3>
            <p>
               Sélectionnez toutes les images qui contiennent des
               <strong> {children}</strong>
            </p>
         </div>
      </section>
   );
});

export default MemoizedTasks;
