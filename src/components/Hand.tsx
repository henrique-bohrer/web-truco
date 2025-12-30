import React from 'react';
import { ICard } from '../lib/types';
import Card from './Card';

interface HandProps {
    cards: ICard[];
    hidden?: boolean;
    onCardClick?: (index: number) => void;
    disabled?: boolean;
    position: 'top' | 'bottom';
}

const Hand: React.FC<HandProps> = ({ cards, hidden, onCardClick, disabled, position }) => {
    // If no cards, just render a placeholder or empty div
    if (!cards || cards.length === 0) {
        return <div className={`hand-container hand-${position} empty`}></div>;
    }

    return (
        <div className={`hand-container hand-${position}`}>
            {cards.map((card, i) => {
                const total = cards.length;
                // Calculate offset from center (e.g., -1, 0, 1 for 3 cards)
                const center = (total - 1) / 2;
                const offset = i - center;

                // Rotation angle
                const angleStep = 15; // Degrees
                const rotation = offset * angleStep;

                // Adjust spread based on hand size? 3 cards usually fit well with 15 deg.

                const style: React.CSSProperties = {
                    // Start centered, then rotate
                    // We rely on CSS transform-origin for the "arc" effect
                    transform: `translateX(-50%) rotate(${rotation}deg)`,
                    zIndex: i + 1, // Ensure correct stacking order
                };

                return (
                    <div
                        key={i}
                        className="hand-card-wrapper"
                        style={style}
                    >
                         <Card
                            card={card}
                            hidden={hidden}
                            onClick={() => onCardClick && onCardClick(i)}
                            disabled={disabled}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default Hand;
