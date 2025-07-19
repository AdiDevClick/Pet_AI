import '@css/tasks.scss';
export function Tasks({ children }) {
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
}
