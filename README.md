📄 Documentação do Projeto: Truco Web (Regra Paulista)
1. Visão Geral do Projeto
Desenvolvimento de um jogo de Truco online via web, focado na regra Paulista. O sistema deve priorizar a integridade das regras no backend e permitir partidas contra inteligência artificial (Bots).

2. Regras de Negócio (Game Core)
2.1. Baralho e Cartas
Composição: Baralho de 40 cartas (sem 8, 9, 10 e Coringas).

Hierarquia de Força (Normal):

3 (Três) - Mais forte das cartas comuns

2 (Dois)

A (Ás)

K (Rei)

J (Valete)

Q (Dama)

7 (Sete)

6 (Seis)

5 (Cinco)

4 (Quatro) - Mais fraca

Manilhas (Regra Nova/Paulista):

Definidas pela carta "Vira" no início de cada mão.

A manilha é a carta imediatamente superior à Vira na ordem circular (ex: Vira 7 -> Manilha Q).

Força dos Naipes das Manilhas (Decrescente):

♣️ Paus (Zap) - Suprema

♥️ Copas (Copeta)

♠️ Espadas (Espadilha)

♦️ Ouros (Pica-fumo)

2.2. Modos de Jogo
1 vs 1: Jogador Humano vs. 1 Bot.

2 vs 2: Jogador Humano + Bot Parceiro vs. 2 Bots Adversários.

3. Estrutura do Backend (Lógica)
3.1. Classe Baralho (Deck)
Responsabilidade: Criar e gerenciar as cartas da partida.

Funcionalidade Crítica:

Gerar as 40 cartas.

Embaralhar (Shuffle).

Distribuição Única: Garantir que uma carta entregue a um jogador nunca seja entregue a outro na mesma mão (pop do array embaralhado).

3.2. Controle de Partida (MatchController)
Fluxo da Mão:

Distribuir 3 cartas para cada jogador.

Revelar o "Vira".

Definir as Manilhas da rodada.

Iniciar Rodadas (Melhor de 3).

Sistema de Pontuação:

Vitória simples: 1 ponto.

Truco: 3 pontos.

Seis: 6 pontos.

Nove: 9 pontos.

Doze: 12 pontos.

Mão de Ferro (11x11): Regras específicas (cegas).

3.3. Inteligência Artificial (Bots)
Lógica Básica:

Reconhecer manilhas na mão.

Jogar cartas baixas quando a rodada estiver perdida.

Aceitar Truco se tiver manilha ou cartas fortes (3 ou 2).

4. Roadmap de Desenvolvimento
Fase 1: Implementação da lógica de regras e validação no backend (Terminal/Console logs).

Fase 2: Interface Web (Frontend) e conexão com API.

Fase 3 (Futuro): Personalização de Skins (Baralho Espanhol/Copag)