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

        const centerIndex = (total - 1) / 2;
        const x = index - centerIndex;

        // Spread angle settings
        const spreadAngle = 15; // Slightly tighter spread for arc
        const rotate = x * spreadAngle;

        // Vertical offset for arc effect (Parabolic curve: y = a * x^2)
        // We want the center card to be highest (translateY = 0 or lowest positive value if we are shifting down)
        // Actually, CSS transform is relative.
        // If we translate positive Y, it goes DOWN.
        // So center (x=0) should be 0. Edges (x large) should be positive Y (down).
        // y = C * x^2
        const arcIntensity = 12;
        const translateY = (x * x) * arcIntensity;

        const isTop = position === 'top';

        return {
            transform: `rotate(${isTop ? -rotate : rotate}deg) translateY(${isTop ? -translateY : translateY}px)`,
            margin: '0 -25px', // More overlap for a tighter "hand" feel
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
            {cards.length === 0 && <div style={{color: 'white', opacity: 0.5}}></div>}
        </div>
    );
};

export default Hand;
