// backend/state/game.js

// Usaremos um Array para facilitar a iteração e filtro dos jogos
let games = [] 
let gameIdCounter = 1 // Contador para gerar IDs únicos de jogo

// --- CONSTANTES DA BISCA ---
const suits = ['c', 'o', 'p', 'e'] // Copas, Ouros, Paus, Espadas
const ranks = [2, 3, 4, 5, 6, 12, 11, 13, 7, 1] // 2-6 (sem valor), Valete(11), Dama(12), Rei(13), Sete(7), Ás(1)

// Pontos das cartas na Bisca
const cardValues = { 
    1: 11,  // Ás
    7: 10,  // Sete (Bisca)
    13: 4,  // Rei
    11: 3,  // Valete
    12: 2,  // Dama
    2: 0, 3: 0, 4: 0, 5: 0, 6: 0 
}

// Poder da carta (para determinar vencedor da vaza)
const cardPower = { 
    1: 10, 7: 9, 13: 8, 11: 7, 12: 6, 
    6: 5, 5: 4, 4: 3, 3: 2, 2: 1 
}

// Função para criar um baralho de Bisca completo (40 cartas)
const buildDeck = () => {
    const deck = []
    let id = 1
    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({
                id: id++, 
                suit,
                rank,
                value: cardValues[rank],
                power: cardPower[rank],
                imageName: `${suit}${rank}.png` // Formato para nome do ficheiro da imagem
            })
        })
    })
    return deck
}

// Função para baralhar o baralho (Fisher-Yates Algorithm)
const shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck
}

// ------------------------------------------------------------------------
// 2. GESTÃO DE JOGOS (LOBBY & ESTADO)
// ------------------------------------------------------------------------

// Retorna a lista de jogos ativos (não cancelados, não terminados)
export const getGames = () => {
    return games.filter(g => g.status !== 'Ended')
}

// Cria um novo jogo (quando o utilizador clica em "Criar Mesa")
export const createGame = (config, user) => {
    // config vem do frontend: { type: '3', isMatch: true, stake: 10 }
    if (!config) config = {} // Caso não venha config

    const game = {
        id: gameIdCounter++, // ID único para o jogo
        
        // --- DADOS DO LOBBY ---
        created_by: user.name || 'Anonymous', // Nome para mostrar no lobby
        creator: user.id,                     // ID do criador para validações
        type: config.type || '3',             // '3' ou '9' (Bisca de 3 ou 9)
        isMatch: config.isMatch || false,     // Jogo Único ou Partida (4 marcas)
        stake: config.stake || 0,             // Aposta em moedas
        status: 'Pending',                    // Estado inicial: à espera de oponente
        
        // --- JOGADORES ---
        player1: user,
        player2: null,
        
        // --- ESTADO DO TABULEIRO (Inicialmente vazio, preenchido ao juntar) ---
        deck: [],         // O baralho restante
        p1Hand: [],       // Cartas do jogador 1 (criador)
        p2Hand: [],       // Cartas do jogador 2 (o que se junta)
        trump: null,      // Carta de Trunfo
        table: [],        // Cartas jogadas na mesa (vaza)
        turn: null,       // ID do utilizador que tem a vez de jogar ('player1' ou 'player2')
        
        // --- PONTUAÇÃO ---
        p1Points: 0,
        p2Points: 0,
        
        createdAt: new Date() // Timestamp de criação
    }
    
    games.push(game)
    console.log(`[State] Game created: #${game.id} by ${game.created_by}`)
    return game
}

// Adiciona o segundo jogador ao jogo e prepara o tabuleiro
export const joinGame = (gameId, user) => {
    const game = games.find(g => g.id == gameId)
    
    // Validações: Jogo existe? Está Pendente? O utilizador não é o criador?
    if (!game) {
        console.error(`[State] joinGame: Game with ID ${gameId} not found.`)
        return null
    }
    if (game.status !== 'Pending') {
        console.warn(`[State] joinGame: Game #${gameId} is not Pending (Status: ${game.status}).`)
        return null
    }
    if (game.creator === user.id) {
        console.warn(`[State] joinGame: Player cannot join their own game #${gameId}.`)
        return null
    }

    // 1. Adiciona o jogador 2 e muda o estado do jogo
    game.player2 = user
    game.status = 'Playing'
    
    // 2. Prepara o Tabuleiro com o baralho e cartas
    let fullDeck = shuffle(buildDeck())
    
    // Define o Trunfo (última carta do baralho)
    game.trump = fullDeck[fullDeck.length - 1]
    
    // Distribui as cartas (3 ou 9, dependendo do tipo de jogo)
    const cardsToDeal = game.type === '9' ? 9 : 3
    
    game.p1Hand = fullDeck.splice(0, cardsToDeal)
    game.p2Hand = fullDeck.splice(0, cardsToDeal)
    game.deck = fullDeck // Restante baralho no monte
    
    // 3. Define quem começa a jogar
    // Regra: O criador (player1) começa.
    game.turn = game.player1.id 

    console.log(`[State] Player ${user.name} joined game #${game.id}. Game started!`)
    return game
}

// Remove um jogo do lobby (quando o criador cancela)
export const removeGame = (gameId, userId) => {
    

    const index = games.findIndex(g => g.id == gameId)
    if (index !== -1) {
        // Só o criador pode remover
        if (games[index].creator == userId) {
            const removedGame = games.splice(index, 1)[0]
            console.log(`[State] Game ${removedGame.id} removed by ${userId}.`)
            return true
        }
    }
    return false
}

// Placeholder para a lógica de jogar uma carta (será implementada depois)
export const playCard = (gameId, userId, cardId) => {
    // Encontra o jogo
    const game = games.find(g => g.id == gameId)
    if (!game) return null
    if (game.turn !== userId) return null // Não é a vez do jogador
    // ... Lógica para validar e mover a carta ...
    return game // Retorna o estado atualizado do jogo
}

// Exportar as funções necessárias para o backend/events
export { suits, ranks, cardValues, cardPower }