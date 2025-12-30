// backend/state/game.js

// Usaremos um Array para facilitar a iteração e filtro dos jogos
let games = [] 
 // Contador para gerar IDs únicos de jogo

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

const gameTimers = new Map() 

export const clearTurnTimer = (gameId) => {
    if (gameTimers.has(gameId)) {
        clearTimeout(gameTimers.get(gameId))
        gameTimers.delete(gameId)
    }
}

export const startTurnTimer = (gameId, onTimeoutCallback) => {
    // 1. Limpa timer anterior se existir
    clearTurnTimer(gameId)

    // 2. Inicia novo timer de 20 segundos (20000ms)
    const timer = setTimeout(() => {
        console.log(`[Timer] Tempo esgotado para o jogo ${gameId}`)
        onTimeoutCallback() // Executa a função de desistência
    }, 20000)

    // 3. Guarda o timer
    gameTimers.set(gameId, timer)
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
    const uniqueId = Date.now() 
    const game = {
        id: uniqueId, // ID único para o jogo
        
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

// backend/state/game.js

// ... (código anterior: games, createGame, joinGame, etc) ...

// --- LÓGICA DE VAZA ---
const resolveTrick = (game) => {
    const c1 = game.table[0]
    const c2 = game.table[1]
    const trumpSuit = game.trump.suit
    
    let winnerId = null
    let points = c1.value + c2.value

    // Regras da Bisca para determinar vencedor
    // c1 é a carta de quem abriu a vaza (playedBy tem o ID)
    
    let c1Wins = true

    if (c1.suit === c2.suit) {
        // Mesmo naipe: ganha a maior
        if (c2.power > c1.power) c1Wins = false
    } else {
        // Naipes diferentes
        if (c2.suit === trumpSuit) c1Wins = false // c2 trunfou
        // Se c2 não é trunfo e naipes diferentes, c1 ganha (assistiu ou cortou sem trunfo)
    }

    winnerId = c1Wins ? c1.playedBy : c2.playedBy

    // Atualizar pontos
    if (winnerId === game.player1.id) {
        game.p1Points += points
    } else {
        game.p2Points += points
    }

    return winnerId
}

const drawCards = (game) => {
    if (game.deck.length === 0) return

    // Tira duas cartas do monte
    const card1 = game.deck.shift()
    const card2 = game.deck.shift() // Pode ser undefined se só sobrar a do fundo (trunfo)

    // O vencedor da vaza (game.turn) recebe a primeira carta
    // O perdedor recebe a segunda
    // Nota: Simplificação. Na bisca real, vencedor pesca primeiro.
    // Vamos assumir que quem joga a seguir (vencedor) é quem recebe card1.
    
    if (game.turn === game.player1.id) {
        if(card1) game.p1Hand.push(card1)
        if(card2) game.p2Hand.push(card2)
    } else {
        if(card1) game.p2Hand.push(card1)
        if(card2) game.p1Hand.push(card2)
    }
}

// --- FUNÇÃO PRINCIPAL DE JOGAR ---
const playCard = (gameId, userId, card) => {
    const game = games.find(g => g.id == gameId)
    if (!game) return null
    if (game.status !== 'Playing') return null
    
    // 1. Validar Turno
    if (game.turn != userId) return null 

    // 2. Validar se tem a carta e remover da mão
    let hand = (game.player1.id == userId) ? game.p1Hand : game.p2Hand
    const cardIndex = hand.findIndex(c => c.id === card.id)
    
    if (cardIndex === -1) return null // Tentou jogar carta que não tem (batota?)
    
    clearTurnTimer(gameId)

    // Remove da mão
    const playedCard = hand.splice(cardIndex, 1)[0]
    playedCard.playedBy = userId // Marca quem jogou
    
    // Adiciona à mesa
    game.table.push(playedCard)

    // 3. Lógica de Jogo
    if (game.table.length === 1) {
        // Foi a primeira carta. Passa a vez ao outro.
        game.turn = (userId == game.player1.id) ? game.player2.id : game.player1.id
    } 
    else if (game.table.length === 2) {
        // Vaza completa! Resolver.
        const winnerId = resolveTrick(game)
        
        // Vencedor joga a próxima
        game.turn = winnerId
        
        // Pescar cartas (enquanto houver baralho)
        if (game.deck.length > 0) {
            drawCards(game)
        }
        
        // Limpar mesa (Num jogo real, mandarias um evento 'trick-ended' e esperarias 2s)
        // Aqui vamos limpar, mas o frontend tem de lidar com isso
        // Para simplificar: enviamos a mesa cheia, o frontend mostra, e depois limpa.
        // O ideal é: o servidor guarda 'lastTrick' para mostrar quem ganhou.
        
        game.lastTrick = [...game.table] // Guarda para mostrar histórico
        game.table = [] // Limpa a mesa para a próxima
        
        // Verificar Fim de Jogo (Se não há cartas na mão)
        if (game.p1Hand.length === 0 && game.p2Hand.length === 0) {
            game.status = 'Ended'
            // Definir vencedor final...
        }
    }

    if (game.status === 'Ended') {
        clearTurnTimer(gameId)
    }

    return game
}
const sumPoints = (cards) => {
    return cards.reduce((total, card) => total + card.value, 0)
}

const resignGame = (gameId, userId) => {

    clearTurnTimer(gameId)
    const game = games.find(g => g.id == gameId)
    
    // Validações
    if (!game) return null
    if (game.status !== 'Playing') return null // Só se pode desistir se o jogo estiver a decorrer

    // Identificar quem desistiu e quem ganha
    const isP1Resigning = (game.player1.id == userId)
    const opponentId = isP1Resigning ? game.player2.id : game.player1.id

    // 1. O OPONENTE RECEBE TODAS AS CARTAS RESTANTES
    // (Mãos de ambos + Baralho + Mesa)
    let extraPoints = 0
    extraPoints += sumPoints(game.p1Hand)
    extraPoints += sumPoints(game.p2Hand)
    extraPoints += sumPoints(game.deck)
    extraPoints += sumPoints(game.table)

    // Atribuir os pontos ao oponente
    if (isP1Resigning) {
        game.p2Points += extraPoints
    } else {
        game.p1Points += extraPoints
    }

    // Limpar o tabuleiro (simboliza que as cartas foram recolhidas)
    game.p1Hand = []
    game.p2Hand = []
    game.deck = []
    game.table = []

    // 2. TERMINAR O JOGO
    game.status = 'Ended'
    game.winner = opponentId // Vencedor deste jogo específico

    if (!game.resignedBy) game.resignedBy = userId 

    // 3. SE FOR MATCH, A DESISTÊNCIA APLICA-SE A TUDO
    if (game.isMatch) {
        game.matchWinner = opponentId
        // Opcional: Podes definir as marcas para 4-0 se quiseres ser explícito
        if (isP1Resigning) game.p2Marks = 4
        else game.p1Marks = 4
    }

    console.log(`[State] Jogo ${game.id}: User ${userId} desistiu. Vitória para ${opponentId}.`)
    
    return game
}

// Exportar as funções necessárias para o backend/events
export { suits, ranks, cardValues, cardPower, playCard, resignGame}