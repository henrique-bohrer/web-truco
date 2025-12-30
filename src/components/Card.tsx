import React from 'react';
import { ICard, Suit } from '../lib/types';

interface CardProps {
    card?: ICard; // Optional for hidden cards or partials
    hidden?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    size?: 'small' | 'normal';
    className?: string;
    style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ card, hidden, onClick, disabled, size = 'normal', className = '', style }) => {
    const sizeClass = size === 'small' ? 'card-small' : '';
    const disabledClass = disabled ? 'card-disabled' : '';

    if (hidden) {
        return (
            <div
                className={`card card-back ${sizeClass} ${className}`}
                onClick={!disabled ? onClick : undefined}
                style={style}
            />
        );
    }

    if (!card) return null;

    // Determine color based on suit
    const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
    const colorClass = isRed ? 'card-red' : 'card-black';

    return (
        <div
            className={`card ${colorClass} ${sizeClass} ${disabledClass} ${className}`}
            onClick={!disabled ? onClick : undefined}
            style={style}
        >
            <div className="card-corner top-left">
                <span>{card.rank}</span>
                <span>{card.suit}</span>
            </div>

            <div className="card-center">
                {card.suit}
            </div>

            <div className="card-corner bottom-right">
                <span>{card.rank}</span>
                <span>{card.suit}</span>
            </div>
        </div>
    );
};

export default Card;
