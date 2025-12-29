import React from 'react';
import { ICard, Suit } from '../lib/types';

interface CardProps {
    card?: ICard;
    hidden?: boolean;
    onClick?: () => void;
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
}

const Card: React.FC<CardProps> = ({ card, hidden, onClick, size = 'medium', disabled }) => {
    // Basic styling
    const getDimensions = () => {
        switch (size) {
            case 'small': return { width: 60, height: 90, fontSize: 14 };
            case 'large': return { width: 120, height: 180, fontSize: 24 };
            default: return { width: 90, height: 135, fontSize: 18 };
        }
    };
    const { width, height, fontSize } = getDimensions();

    const styles: React.CSSProperties = {
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: hidden ? '#3a3a3a' : 'white',
        borderRadius: '8px',
        border: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5px',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
        color: !hidden && (card?.suit === Suit.Diamonds || card?.suit === Suit.Hearts) ? 'red' : 'black',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        position: 'relative',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.2s'
    };

    // Hover effect if clickable
    const handleMouseEnter = (e: React.MouseEvent) => {
        if (onClick && !disabled) {
            e.currentTarget.style.transform = 'translateY(-5px)';
        }
    };
    const handleMouseLeave = (e: React.MouseEvent) => {
        if (onClick && !disabled) {
            e.currentTarget.style.transform = 'translateY(0)';
        }
    };

    if (hidden) {
        return (
            <div style={styles}>
                <div style={{
                    width: '100%', height: '100%',
                    background: 'repeating-linear-gradient(45deg, #606abc, #606abc 10px, #465298 10px, #465298 20px)',
                    borderRadius: '6px'
                }} />
            </div>
        );
    }

    if (!card) return null;

    return (
        <div
            style={styles}
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', textAlign: 'left' }}>
                {card.rank}{card.suit}
            </div>
            <div style={{ fontSize: `${fontSize * 2.5}px`, textAlign: 'center', marginTop: '-10px' }}>
                {card.suit}
            </div>
            <div style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', textAlign: 'right', transform: 'rotate(180deg)' }}>
                {card.rank}{card.suit}
            </div>
        </div>
    );
};

export default Card;
