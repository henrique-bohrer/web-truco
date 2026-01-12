import React, { useState } from 'react';
import Card from './Card';
import { Rank, Suit } from '../lib/types';

interface TutorialProps {
    onBack: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onBack }) => {
    const [page, setPage] = useState(0);

    const pages = [
        {
            title: "Bem-vindo ao Truco!",
            content: (
                <div>
                    <p>
                        Truco é um jogo de cartas emocionante e cheio de estratégia.
                        O objetivo é ser o primeiro a alcançar <strong>12 pontos</strong>.
                    </p>
                    <p>
                        O jogo é disputado em <strong>Mãos</strong>, e cada Mão é composta por <strong>3 Rodadas</strong>.
                        Vence a Mão quem ganhar 2 das 3 Rodadas ("melhor de três").
                    </p>
                    <div style={{ marginTop: '20px', fontSize: '4rem' }}>🃏</div>
                </div>
            )
        },
        {
            title: "Força das Cartas",
            content: (
                <div>
                    <p>A força das cartas segue a ordem abaixo (da mais fraca para a mais forte):</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', margin: '20px 0' }}>
                        {[Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Queen, Rank.Jack, Rank.King, Rank.Ace, Rank.Two, Rank.Three].map((rank, i) => (
                            <div key={rank} style={{ transform: 'scale(0.8)' }}>
                                <Card card={{ rank, suit: Suit.Diamonds } as any} />
                                <div style={{ fontSize: '12px', marginTop: '5px' }}>{i + 1}º</div>
                            </div>
                        ))}
                    </div>
                    <p>
                        O <strong>3</strong> é a carta mais forte "comum", e o <strong>4</strong> é a mais fraca.
                        Porém, as cartas especiais chamadas <strong>Manilhas</strong> mudam tudo!
                    </p>
                </div>
            )
        },
        {
            title: "O Vira e as Manilhas",
            content: (
                <div>
                    <p>
                        No início de cada Mão, uma carta é virada na mesa: o <strong>Vira</strong>.
                    </p>
                    <div style={{ transform: 'scale(0.8)', margin: '10px 0' }}>
                        <div style={{ fontWeight: 'bold' }}>Vira (Exemplo)</div>
                        <Card card={{ rank: Rank.Seven, suit: Suit.Diamonds } as any} />
                    </div>
                    <p>
                        As <strong>Manilhas</strong> são as cartas imediatamente acima do Vira.
                        Elas são as cartas mais fortes do jogo!
                    </p>
                    <p>
                        <em>Exemplo: Se o Vira for 7, as Manilhas são as Damas (Q).</em>
                    </p>
                </div>
            )
        },
        {
            title: "Naipes das Manilhas",
            content: (
                <div>
                    <p>
                        Diferente das cartas comuns, as Manilhas têm força baseada no naipe.
                        A ordem de força é:
                    </p>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', margin: '20px 0', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#ff4444' }}>♦️</div>
                            <small>Pica-fumo</small>
                            <br />(Mais Fraca)
                        </div>
                        <div>{'<'}</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem' }}>♠️</div>
                            <small>Espadilha</small>
                        </div>
                        <div>{'<'}</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#ff4444' }}>♥️</div>
                            <small>Copas</small>
                        </div>
                        <div>{'<'}</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem' }}>♣️</div>
                            <small>Zap</small>
                            <br />(<strong>Mais Forte!</strong>)
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Truco!",
            content: (
                <div>
                    <p>
                        A qualquer momento na sua vez, você pode pedir <strong>TRUCO!</strong>
                    </p>
                    <p>
                        Isso aumenta o valor da Mão:
                    </p>
                    <ul style={{ textAlign: 'left', display: 'inline-block', lineHeight: '1.8' }}>
                        <li><strong>1 ponto</strong>: Jogo normal.</li>
                        <li><strong>3 pontos</strong>: Truco aceito.</li>
                        <li><strong>6 pontos</strong>: Pediu 6 (Resposta ao Truco).</li>
                        <li><strong>9 pontos</strong>: Pediu 9.</li>
                        <li><strong>12 pontos</strong>: Pediu 12 (Vale a partida!).</li>
                    </ul>
                    <p style={{ marginTop: '15px' }}>
                        Se o oponente <strong>correr</strong> (desistir), você ganha os pontos atuais da rodada.
                    </p>
                </div>
            )
        },
        {
            title: "Empates",
            content: (
                <div>
                    <p>
                        Se a primeira rodada empatar ("cangar"), a mão será decidida por quem vencer a <strong>segunda rodada</strong>.
                    </p>
                    <p>
                        Se empatar de novo, a decisão vai para a terceira.
                        Se as 3 rodadas empatarem, ninguém ganha pontos (ou segue regra específica da mesa, mas aqui focamos no básico).
                    </p>
                    <p>
                        <em>Dica: Tente sempre ganhar a primeira rodada para ter vantagem!</em>
                    </p>
                </div>
            )
        },
        {
            title: "Pronto para Jogar?",
            content: (
                <div>
                    <p>Agora você já sabe o básico do Truco Paulista.</p>
                    <p>Chame um amigo ou jogue contra o Bot para praticar!</p>
                    <button onClick={onBack} style={{
                        marginTop: '30px',
                        padding: '15px 30px',
                        fontSize: '1.2rem',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '30px',
                        cursor: 'pointer'
                    }}>
                        Jogar Agora!
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="game-container" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            textAlign: 'center',
            color: 'white'
        }}>
            <div style={{
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '30px',
                borderRadius: '15px',
                maxWidth: '600px',
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: '#ffd700' }}>
                    {pages[page].title}
                </h2>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {pages[page].content}
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        style={{ opacity: page === 0 ? 0.3 : 1 }}
                    >
                        ← Voltar
                    </button>

                    <div style={{ color: '#aaa' }}>
                        {page + 1} / {pages.length}
                    </div>

                    {page < pages.length - 1 ? (
                        <button onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))}>
                            Próximo →
                        </button>
                    ) : (
                        <button onClick={onBack}>
                            Sair
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tutorial;
