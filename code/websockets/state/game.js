// backend/state/game.js

import axios from 'axios'
import { dbAPI } from './api.js';

let matches = []
const matchTimers = new Map() // Mapa para guardar os timers: matchId -> timer

// ------------------------------------------------------------------------
// 1. LÓGICA DO BARALHO (BISCA)
// ------------------------------------------------------------------------
const suits = ['c', 'o', 'p', 'e']
const ranks = [2, 3, 4, 5, 6, 12, 11, 13, 7, 1]
const cardValues = { 1: 11, 7: 10, 13: 4, 11: 3, 12: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
const cardPower = { 1: 10, 7: 9, 13: 8, 11: 7, 12: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }

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
                imageName: `${suit}${rank}.png`
            })
        })
    })
    return deck
}

const shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck
}

// ------------------------------------------------------------------------
// 2. HELPERS (Privados)
// ------------------------------------------------------------------------

const calculateMarks = (points) => {
    if (points === 120) return 4
    if (points >= 91) return 2
    if (points >= 61) return 1
    return 0
}

const createNewGameObj = (type, player1Id, player2Id) => { // Adicionado player2Id
    let fullDeck = shuffle(buildDeck())
    const cardsToDeal = type === '9' ? 9 : 3
    const trump = fullDeck[fullDeck.length - 1]
    const p1Hand = fullDeck.splice(0, cardsToDeal)
    const p2Hand = fullDeck.splice(0, cardsToDeal)

    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        status: 'Playing',
        type: type,
        p1_id: player1Id, // Guardar para a BD
        p2_id: player2Id, // Guardar para a BD
        deck: fullDeck,
        p1Hand, p2Hand, trump,
        table: [],
        p1Points: 0,
        p2Points: 0,
        turn: player1Id,
        began_at: new Date().toISOString() // Adicionado para a BD
    }
}

// ------------------------------------------------------------------------
// 3. GESTÃO DE TIMERS (EXPORTADOS)
// ------------------------------------------------------------------------

export const clearTurnTimer = (matchId) => {
    if (matchTimers.has(matchId)) {
        clearTimeout(matchTimers.get(matchId))
        matchTimers.delete(matchId)
        // console.log(`[Timer] Timer limpo para match ${matchId}`)
    }
}

export const startTurnTimer = (matchId, onTimeoutCallback) => {
    // Limpa anterior para evitar duplicados
    clearTurnTimer(matchId)

    // Inicia novo timer de 20 segundos
    const timer = setTimeout(() => {
        console.log(`[Timer] Tempo esgotado para o match ${matchId}`)
        onTimeoutCallback() // Chama a função que trata a desistência
    }, 20000)

    matchTimers.set(matchId, timer)
}

// ------------------------------------------------------------------------
// 4. AÇÕES DE JOGO (EXPORTADAS)
// ------------------------------------------------------------------------

export const getGames = () => {
    return matches.filter(m => m.status !== 'Ended').map(m => ({
        id: m.id,
        created_by: m.created_by,
        creator: m.creator,
        type: m.type,
        isMatch: m.isMatch,
        stake: m.stake,
        status: m.status
    }))
}

export const createGame = (config, user) => {
    if (!config) config = {}

    const match = {
        id: Date.now(),
        created_by: user.name || 'Anonymous',
        creator: user.id,
        type: config.type || '3',
        isMatch: config.isMatch || false,
        stake: config.stake || 0,
        status: 'Pending',
        player1: user,
        player2: null,
        p1Marks: 0,
        p2Marks: 0,
        matchWinner: null,
        resignedBy: null,
        currentGame: null,
        createdAt: new Date()
    }

    matches.push(match)
    return match
}



export const playCard = async (matchId, userId, card) => {
    const match = matches.find(m => m.id == matchId)
    if (!match || !match.currentGame) return null

    const game = match.currentGame



    // Validação de Turno
    if (game.turn != userId) return null

    // Validação de Carta
    let hand = (match.player1.id == userId) ? game.p1Hand : game.p2Hand
    const idx = hand.findIndex(c => c.id === card.id)
    if (idx === -1) return null

    // --- IMPORTANTE: Limpar o timer assim que a jogada é válida ---
    clearTurnTimer(matchId)

    // Jogar carta
    const played = hand.splice(idx, 1)[0]
    played.playedBy = userId
    game.table.push(played)

    // Lógica da Mesa
    if (game.table.length === 1) {
        // Passa a vez
        game.turn = (userId == match.player1.id) ? match.player2.id : match.player1.id
    } else {
        // Resolver Vaza
        const c1 = game.table[0]; const c2 = game.table[1];
        let winnerId = null;
        let c1Wins = true;

        if (c1.suit === c2.suit) { if (c2.power > c1.power) c1Wins = false }
        else { if (c2.suit === game.trump.suit) c1Wins = false }

        winnerId = c1Wins ? c1.playedBy : c2.playedBy;

        // Somar Pontos
        const points = c1.value + c2.value
        if (winnerId === match.player1.id) game.p1Points += points
        else game.p2Points += points

        game.turn = winnerId

        // Pescar
        if (game.deck.length > 0) {
            const draw1 = game.deck.shift(); const draw2 = game.deck.shift();
            if (game.turn === match.player1.id) {
                if (draw1) game.p1Hand.push(draw1); if (draw2) game.p2Hand.push(draw2);
            } else {
                if (draw1) game.p2Hand.push(draw1); if (draw2) game.p1Hand.push(draw2);
            }
        }

        game.table = []

        // Verificar Fim do Jogo
        if (game.p1Hand.length === 0 && game.p2Hand.length === 0) {
            game.status = 'Ended'
            // Limpa timer definitivamente para este jogo
            clearTurnTimer(matchId)

            if (match.isMatch) {
                if (game.p1Points > game.p2Points) match.p1Marks += calculateMarks(game.p1Points)
                else if (game.p2Points > game.p1Points) match.p2Marks += calculateMarks(game.p2Points)

                if (match.p1Marks >= 4) { match.matchWinner = match.player1.id; match.status = 'Ended' }
                else if (match.p2Marks >= 4) { match.matchWinner = match.player2.id; match.status = 'Ended' }
            } else {
                match.status = 'Ended'
                match.matchWinner = (game.p1Points > game.p2Points) ? match.player1.id : match.player2.id
            }

            await dbAPI.updateGameResult(game.db_id, {
                    player1_points: game.p1Points, 
                    player2_points: game.p2Points, 
                    total_time: totalTimeSeconds
                });

            if (match.status === 'Ended') {

                const winnerId = game.p1Points > game.p2Points ? match.player1.id :
                    (game.p2Points > game.p1Points ? match.player2.id : null);

                const loserId = winnerId === match.player1.id ? match.player2.id :
                    (winnerId === match.player2.id ? match.player1.id : null);

                
                const start = new Date(game.began_at);
                const end = new Date();
                const totalTimeSeconds = Math.abs(end - start) / 1000;

                // Chamar a API com os novos campos
                
                const matchLoserId = match.matchWinner === match.player1.id ? match.player2.id : match.player1.id;
                await dbAPI.finalizeMatch(match.db_id, {
                    winnerId: match.matchWinner,
                    loserId: matchLoserId,
                    p1Marks: match.p1Marks,
                    p2Marks: match.p2Marks
                });
            }


        }
    }
    return match
}

export const prepareNextGame = async (matchId) => {
    const match = matches.find(m => m.id == matchId)
    if (!match || match.matchWinner) return match

    match.currentGame = createNewGameObj(match.type, match.player1.id, match.player2.id)

    // API: Criar o novo round na BD
    const dbGame = await dbAPI.storeGame(match.db_id, match.currentGame)
    match.currentGame.db_id = dbGame.id

    return match
}

export const resignGame = (matchId, userId) => {
    clearTurnTimer(matchId) // Para timer imediatamente

    const match = matches.find(m => m.id == matchId)
    if (!match || !match.currentGame) return null

    const game = match.currentGame
    const opponentId = (match.player1.id == userId) ? match.player2.id : match.player1.id

    // Soma todos os pontos restantes ao oponente
    const sumPoints = (cards) => cards.reduce((t, c) => t + c.value, 0)
    let extra = sumPoints(game.p1Hand) + sumPoints(game.p2Hand) + sumPoints(game.deck) + sumPoints(game.table)

    if (opponentId === match.player1.id) game.p1Points += extra
    else game.p2Points += extra

    // Limpa tudo
    game.p1Hand = []; game.p2Hand = []; game.deck = []; game.table = []

    // Termina Jogo e Match
    game.status = 'Ended'
    match.status = 'Ended'
    match.matchWinner = opponentId
    match.resignedBy = userId

    // Ajusta marcas para vitória total se for match
    if (match.isMatch) {
        if (opponentId === match.player1.id) match.p1Marks = 4
        else match.p2Marks = 4
    }

    return match
}

export const removeGame = (id, uid) => {
    const idx = matches.findIndex(m => m.id == id);
    if (idx !== -1 && matches[idx].creator == uid) {
        matches.splice(idx, 1);
        return true;
    }
    return false;
}


export const joinGame = async (matchId, user) => {
    // 1. Encontrar o jogo na memória (Lobby) pelo ID grande
    const match = matches.find(m => m.id == matchId)

    // Validações de segurança
    if (!match || match.status !== 'Pending') return null
    if (match.creator == user.id) return null // Não pode jogar contra si próprio

    match.player2 = user
    match.status = 'Playing'

    // 2. Criar Match no Laravel (Obriga a ter moedas)
    const dbMatch = await dbAPI.storeMatch(match)

    if (!dbMatch || !dbMatch.id) {
        console.error("ERRO: Laravel recusou a partida (Saldo insuficiente?)")
        // Reverter estado se falhar na BD
        match.status = 'Pending'
        match.player2 = null
        return null
    }

    // Guardar o ID real para futuras atualizações
    match.db_id = dbMatch.id

    // 3. Criar a primeira rodada (Round/Game)
    // Passamos os IDs dos dois jogadores para o objeto do jogo
    match.currentGame = createNewGameObj(match.type, match.player1.id, match.player2.id)

    // 4. Registar o Round no Laravel
    const dbGame = await dbAPI.storeGame(match.currentGame, match.db_id)
    if (dbGame && dbGame.id) {
        match.currentGame.db_id = dbGame.id
    }

    return match
}

// Exportar consts também caso precises no frontend ou testes
export { suits, ranks, cardValues, cardPower }