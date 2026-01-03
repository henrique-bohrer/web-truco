import React, { useState } from 'react';

interface TutorialProps {
    onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
    const [page, setPage] = useState(0);

    const pages = [
        {
            title: "Objetivo",
            content: "O objetivo do Truco é fazer 12 pontos. A partida é dividida em 'mãos', e cada mão vale inicialmente 1 ponto. Quem vencer a 'melhor de 3' rodadas ganha os pontos da mão."
        },
        {
            title: "Força das Cartas (Manilhas)",
            content: (
                <div>
                    <p>No Truco Paulista, a força das cartas depende do 'Vira'. As cartas mais fortes são as 'Manilhas', que são a carta imediatamente acima do Vira.</p>
                    <p>Ordem das Manilhas (Naipes):</p>
                    <ul style={{textAlign: 'left', display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px'}}>
                        <li>♣️ Paus (Zap) - Mais forte</li>
                        <li>♥️ Copas</li>
                        <li>♠️ Espadas (Espadilha)</li>
                        <li>♦️ Ouros (Pica-Fumo)</li>
                    </ul>
                </div>
            )
        },
        {
            title: "Força das Cartas (Comuns)",
            content: (
                <div>
                    <p>Se não forem manilhas, a ordem de força fixa é:</p>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold', margin: '10px 0'}}>3 &gt; 2 &gt; A &gt; K &gt; J &gt; Q &gt; 7 &gt; 6 &gt; 5 &gt; 4</div>
                    <p>Note que 8, 9 e 10 foram removidos do baralho.</p>
                </div>
            )
        },
        {
            title: "Truco!",
            content: "A qualquer momento na sua vez, você pode pedir TRUCO. O valor da mão sobe para 3. O adversário pode Aceitar, Correr (desistir) ou pedir 6 (aumentar a aposta). O valor pode subir para 9 e depois 12."
        },
        {
            title: "Mão de Ferro",
            content: "Quando ambas as equipes estão com 11 pontos, joga-se a 'Mão de Ferro'. As cartas são jogadas no escuro (face para baixo) e quem vencer a mão ganha o jogo."
        }
    ];

    return (
        <div className="game-container" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>📖 Como Jogar</h1>

            <div style={{
                background: 'rgba(0,0,0,0.6)',
                padding: '30px',
                borderRadius: '20px',
                maxWidth: '600px',
                width: '90%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div>
                    <h2 style={{ color: '#ffd700', fontSize: '2rem', marginBottom: '20px' }}>{pages[page].title}</h2>
                    <div style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>{pages[page].content}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'center' }}>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Anterior</button>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>{page + 1} / {pages.length}</span>
                    <button onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))} disabled={page === pages.length - 1}>Próximo →</button>
                </div>
            </div>

            <button onClick={onClose} style={{ marginTop: '30px', background: 'transparent', border: '2px solid white', color: 'white' }}>Voltar ao Menu</button>
        </div>
    );
};

export default Tutorial;
