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
        const spreadAngle = 10; // Degrees per card step
        const rotate = x * spreadAngle;

        // Vertical offset for arc effect (Parabolic curve: y = a * x^2)
        // We want the fan to arch UPWARDS.
        // Center card should be highest (lowest Y value).
        // Side cards should be lower (higher Y value).
        // To prevent overflowing the bottom container, we should anchor the lowest card to 0 (or slight offset).

        const arcIntensity = 10;
        // Calculate the max offset (the offset of the outermost card)
        // Max x is roughly (total-1)/2
        const maxX = (total - 1) / 2;
        const maxY = (maxX * maxX) * arcIntensity;

        // Current Y relative to a flat line
        const rawY = (x * x) * arcIntensity;

        // Normalized Y: Lift the whole hand so the lowest cards (edges) are at 0 (bottom),
        // and the center is higher (negative Y).
        // Wait, 'flex-end' aligns items to the bottom.
        // If we want the arch to go UP into the container, we want negative Y.
        // If we have rawY (0 at center, positive at edges), and we align to flex-end...
        // The center is at 0. The edges are at +Y (pushed down BELOW the flex line).
        // This is BAD. We want edges at 0 (on line), center at -Y (above line).

        const normalizedY = rawY - maxY;
        // Now edges (rawY ~= maxY) -> 0.
        // Center (rawY = 0) -> -maxY (Lifted up).

        const isTop = position === 'top';

        // For Top player, we want the inverse.
        // Align flex-start (top).
        // We want edges at 0 (top line). Center at +Y (pushed down).
        // So normalizedY works if we invert sign?
        // rawY is positive (down). maxY is max positive.
        // normalizedY = rawY - maxY is negative.
        // If isTop: we want center (0) to be lowest (highest Y).
        // Actually, for top player, an arc usually looks like a U (center lower than sides? or center higher?)
        // If it mirrors the bottom player, it should be an inverted U (n).
        // Let's stick to the same shape: Center of fan is "furthest from player".
        // Bottom player: Center is highest (furthest UP).
        // Top player: Center is lowest (furthest DOWN).

        const finalTranslateY = isTop ? -normalizedY : normalizedY;

        return {
            transform: `rotate(${isTop ? -rotate : rotate}deg) translateY(${finalTranslateY}px)`,
            // Adjust margins based on count to keep width manageable
            marginLeft: index === 0 ? 0 : '-30px',
            zIndex: index, // Stack order
            position: 'relative', // Ensure z-index works
        };
    };

    return (
        <div className={`hand-container ${position}`} style={{
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            height: '100%', // Ensure it fills the container
            alignItems: position === 'top' ? 'flex-start' : 'flex-end',
            // Add padding to ensure cards don't touch edges
            paddingBottom: position === 'bottom' ? '10px' : '0',
            paddingTop: position === 'top' ? '10px' : '0',
        }}>
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
