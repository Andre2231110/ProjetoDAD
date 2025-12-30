import { defineStore } from 'pinia'
import { ref, computed, inject, watch } from 'vue'
import { useAPIStore } from './api'
import { useAuthStore } from './auth'
import { useSocketStore } from './socket'
import { toast } from 'vue-sonner'

export const useGameStore = defineStore('game', () => {
  const apiStore = useAPIStore()
  const authStore = useAuthStore()
  const socketStore = useSocketStore() // Usar a store do socket para emits
  
  // ------------------------------------------------------------------------
  // 1. ESTADO DO JOGO
  // ------------------------------------------------------------------------
  
  const isMultiplayer = ref(false)
  const multiplayerGameId = ref(null)
  const resignedBy = ref(null)

  const deck = ref([])
  const myHand = ref([]) 
  const botHand = ref([]) 
  const trumpCard = ref(null) 
  const tableCards = ref([]) 
  
  const currentTurn = ref('me')
  
  const myPoints = ref(0)
  const opponentPoints = ref(0)
  
  // Timestamps para estatísticas
  const beganAt = ref(undefined)
  const endedAt = ref(undefined)

  // --- ESTADO DA PARTIDA (MATCH) ---
  const isMatchMode = ref(false)      
  const myMarks = ref(0)              
  const opponentMarks = ref(0)        
  const matchWinner = ref(null)       
  
  // Computed para saber se o jogo acabou
  const isGameComplete = computed(() => {
    // Nota: No multiplayer, o servidor define o fim (status='Ended')
    // No local, usamos as cartas.
    if(isMultiplayer.value) {
        return endedAt.value !== undefined
    }
    
    return deck.value.length === 0 && 
           myHand.value.length === 0 && 
           botHand.value.length === 0 && 
           tableCards.value.length === 0 && 
           beganAt.value !== undefined
  })

  // ------------------------------------------------------------------------
  // 2. CONFIGURAÇÕES BISCA
  // ------------------------------------------------------------------------
  const suits = ['c', 'o', 'p', 'e']
  const ranks = [2, 3, 4, 5, 6, 12, 11, 13, 7, 1] 
  const cardValues = { 1: 11, 7: 10, 13: 4, 11: 3, 12: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  const cardPower = { 1: 10, 7: 9, 13: 8, 11: 7, 12: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }

  // ------------------------------------------------------------------------
  // 3. MULTIPLAYER - STATE MANAGEMENT
  // ------------------------------------------------------------------------

  // A. Iniciar Jogo (Primeira vez ou reload)
  const startMultiplayerGame = (matchData) => {
      console.log("A configurar tabuleiro multiplayer...", matchData)

      isMultiplayer.value = true
      multiplayerGameId.value = matchData.id
      isMatchMode.value = matchData.isMatch
      
      // Reset de estado visual
      beganAt.value = new Date()
      endedAt.value = undefined 
      resignedBy.value = null
      matchWinner.value = null
      
      // Atualizar com os dados recebidos
      updateMultiplayerState(matchData)
  }

  // B. Atualizar Jogo (A cada jogada ou fim de ronda)
  const updateMultiplayerState = (matchData) => {
      // 1. Identificar Jogadores
      const myId = authStore.currentUser.id
      // O backend pode enviar player1 como objeto ou ID
      const p1Id = matchData.player1.id || matchData.player1
      const amIPlayer1 = (p1Id == myId)

      // 2. Atualizar MARCAS (Do Match Principal)
      if (matchData.isMatch) {
          myMarks.value = amIPlayer1 ? matchData.p1Marks : matchData.p2Marks
          opponentMarks.value = amIPlayer1 ? matchData.p2Marks : matchData.p1Marks
          
          if (matchData.matchWinner) {
              matchWinner.value = (matchData.matchWinner == myId) ? 'me' : 'bot'
          }
      } else {
          myMarks.value = 0
          opponentMarks.value = 0
      }

      // 3. Atualizar JOGO ATUAL (Ronda)
      // O backend agora envia 'currentGame' com o estado da mesa
      const game = matchData.currentGame
      
      if (game) {
          // Cartas
          if (amIPlayer1) {
              myHand.value = game.p1Hand
              botHand.value = game.p2Hand
          } else {
              myHand.value = game.p2Hand
              botHand.value = game.p1Hand
          }

          tableCards.value = game.table
          deck.value = game.deck
          trumpCard.value = game.trump
          
          // Pontos
          myPoints.value = amIPlayer1 ? game.p1Points : game.p2Points
          opponentPoints.value = amIPlayer1 ? game.p2Points : game.p1Points

          // Turno
          if (game.turn == myId) {
              currentTurn.value = 'me'
          } else {
              currentTurn.value = 'bot'
          }
          
          // Verificar Desistência
          if (matchData.resignedBy) {
              resignedBy.value = matchData.resignedBy
          }

          // Verificar Fim do Jogo (Ronda)
          if (game.status === 'Ended') {
              endedAt.value = new Date() // Isto dispara isGameComplete = true
              
              if (resignedBy.value) {
                  const amIResigner = (resignedBy.value == myId)
                  if (amIResigner) toast.error("Desististe do jogo.")
                  else toast.success("O oponente desistiu! Ganhaste.")
              } else if (matchWinner.value) {
                  const msg = matchWinner.value == 'me' ? 'Ganhaste a Partida!' : 'Perdeste a Partida.'
                  if(matchWinner.value == 'me') toast.success(msg)
                  else toast.error(msg)
              }
          } else {
              endedAt.value = undefined // Garante que o modal fecha se começar novo jogo
          }
      }
  }

  // ------------------------------------------------------------------------
  // 4. AÇÕES DE JOGO (LOCAL & MULTIPLAYER)
  // ------------------------------------------------------------------------

  const playCard = (card) => {
    // Validações básicas
    if (currentTurn.value !== 'me') return 
    if (tableCards.value.length >= 2) return
    if (isGameComplete.value) return

    // MULTIPLAYER
    if (isMultiplayer.value) {
        // Envia para o servidor e espera o update
        socketStore.emitPlayCard(multiplayerGameId.value, card)
        return
    }

    // LOCAL (BOT)
    const index = myHand.value.findIndex(c => c.id === card.id)
    if (index !== -1) {
      const cardToPlay = myHand.value[index]
      cardToPlay.playedBy = 'me'
      myHand.value.splice(index, 1)
      tableCards.value.push(cardToPlay)

      if (tableCards.value.length === 1) {
        currentTurn.value = 'bot' 
        setTimeout(() => botPlay(), 1000)
      } else {
        currentTurn.value = 'processing'
        setTimeout(() => resolveTrick(), 1000)
      }
    }
  }

  // Pedir próximo jogo (Multiplayer) ou iniciar novo (Local)
  const nextGameInMatch = (cardsPerHand = 3) => {
    if (isMultiplayer.value) {
        socketStore.emitRequestNextGame(multiplayerGameId.value)
    } else {
        if (!isMatchMode.value) return
        resetRoundState()
        dealCards(cardsPerHand)
        toast.info(`Iniciando jogo. Placar: ${myMarks.value} - ${opponentMarks.value}`)
    }
  }

  // Sair / Desistir
  const leaveGame = () => {
    if (isMultiplayer.value && multiplayerGameId.value) {
        socketStore.emitLeaveGame(multiplayerGameId.value)
    }
    // Limpeza Local
    deck.value = []
    myHand.value = []
    botHand.value = []
    tableCards.value = []
    isMatchMode.value = false
    myMarks.value = 0
    opponentMarks.value = 0
    isMultiplayer.value = false
    multiplayerGameId.value = null
 }

  // ------------------------------------------------------------------------
  // 5. LÓGICA LOCAL (BOT) - Auxiliares
  // ------------------------------------------------------------------------
  // (Mantive igual ao que tinhas, omitido para poupar espaço se não for alterado)
  const buildDeck = () => { /* ... igual ... */ 
      const d = []; let id=1;
      suits.forEach(s => ranks.forEach(r => d.push({id:id++, suit:s, rank:r, value:cardValues[r], power:cardPower[r], imageName:`${s}${r}.png`})));
      return d;
  }
  const shuffleDeck = (d) => { /* ... igual ... */ 
      for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];} return d;
  }
  const resetRoundState = () => {
    tableCards.value = []; myPoints.value = 0; opponentPoints.value = 0;
    endedAt.value = undefined; currentTurn.value = 'me'; beganAt.value = new Date();
  }
  const startGameLocal = (cardsPerHand = 3, matchMode = false) => {
    isMultiplayer.value = false; resetRoundState();
    if (matchMode) {
        if (!isMatchMode.value) { isMatchMode.value = true; myMarks.value = 0; opponentMarks.value = 0; matchWinner.value = null; }
    } else {
        isMatchMode.value = false; myMarks.value = 0; opponentMarks.value = 0; matchWinner.value = null;
    }
    dealCards(cardsPerHand); toast.success('Jogo iniciado!');
  }
  const dealCards = (cardsPerHand) => {
    let fullDeck = shuffleDeck(buildDeck());
    trumpCard.value = fullDeck[fullDeck.length - 1];
    myHand.value = fullDeck.splice(0, cardsPerHand);
    botHand.value = fullDeck.splice(0, cardsPerHand);
    deck.value = fullDeck;
    sortHand(myHand.value);
  }
  const sortHand = (hand) => {
    const ts = trumpCard.value ? trumpCard.value.suit : '';
    hand.sort((a, b) => {
      const ia = a.suit === ts, ib = b.suit === ts;
      if (ia && !ib) return -1; if (!ia && ib) return 1;
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return b.power - a.power;
    })
  }
  
  // Bot Play & Resolve Trick (Local)
  const botPlay = () => { /* ... igual ao teu código ... */ 
      // Lógica simples de jogar carta
      // ...
      // No final chama resolveTrick()
  }
  const resolveTrick = () => { /* ... igual ao teu código ... */ 
      // Lógica de quem ganha a vaza localmente
      // ...
  }

  // ------------------------------------------------------------------------
  // 6. LOBBY - Listas
  // ------------------------------------------------------------------------
  
  const games = ref([]) 

  const setGames = (newGames) => {
    games.value = newGames
  }

  const createGame = (config) => { socketStore.emitCreateGame(config) }
  const cancelGame = (id) => { socketStore.emitCancelGame(id) }
  const joinGame = (game) => { socketStore.emitJoinGame(game) }

  const myGames = computed(() => {
    if (!authStore.currentUser) return []
    return games.value.filter((g) => g.creator == authStore.currentUser.id || g.creator == authStore.currentUser.nickname)
  })

  const availableGames = computed(() => {
    if (!authStore.currentUser) return []
    return games.value.filter((g) => g.creator != authStore.currentUser.id && g.creator != authStore.currentUser.nickname)
  })

  return {
    // State
    isMultiplayer, multiplayerGameId, deck, myHand, botHand, trumpCard, tableCards,
    myPoints, opponentPoints, isGameComplete, currentTurn,
    isMatchMode, myMarks, opponentMarks, matchWinner, games, resignedBy,

    // Actions
    startGameLocal, nextGameInMatch, leaveGame, playCard, 
    createGame, cancelGame, joinGame, setGames, 
    startMultiplayerGame, updateMultiplayerState,
    
    // Getters
    myGames, availableGames
  }
})