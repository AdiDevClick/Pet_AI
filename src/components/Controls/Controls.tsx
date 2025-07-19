import { Button } from '@/components/Buttons/Button';
import '@css/controls.scss';

export function Controls({ buttons }) {
    return (
        <div className="controls">
            {buttons.map((button, index) => (
                <Button
                    key={index}
                    className={button.className}
                    {...button.functions}
                >
                    {button.label}
                </Button>
            ))}
        </div>
    );
}
