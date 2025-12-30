import React from 'react';
import { ICard } from '../lib/types';
import Card from './Card';

interface HandProps {
    cards: ICard[];
    hidden?: boolean;
    disabled?: boolean;
    onCardClick?: (index: number) => void;
    position: 'top' | 'bottom';
}

const Hand: React.FC<HandProps> = ({ cards, hidden, disabled, onCardClick, position }) => {

    // Helper to calculate card fan style
    const getCardStyle = (index: number, total: number): React.CSSProperties => {
        if (total === 0) return {};

        // Spread angle settings
        const spreadAngle = 20; // Degrees between cards
        const centerIndex = (total - 1) / 2;
        const rotate = (index - centerIndex) * spreadAngle;

        // Vertical offset for arc effect (center card higher)
        const offset = Math.abs(index - centerIndex);
        const translateY = offset * 10;

        // Invert rotation and translation for top player if needed
        // For top player, we might want the arc to open downwards or just be mirrored.
        // Usually top player cards are upside down or just at the top.
        // Let's assume standard view: top player cards are at the top, arc handles same way (fanned).
        // If we want them 'upside down' relative to center, we rotate 180?
        // But usually in digital card games, top player cards are just fanned at the top.

        const isTop = position === 'top';

        return {
            transform: `rotate(${isTop ? -rotate : rotate}deg) translateY(${isTop ? -translateY : translateY}px)`,
            margin: '0 -15px', // Negative margin for overlap
            zIndex: index, // Stack order
        };
    };

    return (
        <div className={`hand-container ${position}`} style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: '100%', alignItems: position === 'top' ? 'flex-start' : 'flex-end' }}>
            {cards.map((card, i) => (
                <Card
                    key={i}
                    card={card}
                    hidden={hidden}
                    style={getCardStyle(i, cards.length)}
                    onClick={() => onCardClick && onCardClick(i)}
                    disabled={disabled}
                />
            ))}
            {cards.length === 0 && <div style={{color: 'white', opacity: 0.5}}>No cards</div>}
        </div>
    );
};

export default Hand;
