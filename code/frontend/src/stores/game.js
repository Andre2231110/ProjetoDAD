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
  const botPlay = () => {
    if (isGameComplete.value || currentTurn.value !== 'bot') return

    let cardToPlay = null
    const playerCard = tableCards.value[0] // Carta que o jogador jogou
    const isStockEmpty = deck.value.length === 0

    // Se o bot for o SEGUNDO a jogar (o jogador liderou a vaza)
    if (playerCard) {
      const trumpSuit = trumpCard.value.suit
      
      // Filtrar cartas que podem ganhar a vaza
      const winningCards = botHand.value.filter(c => {
        if (c.suit === playerCard.suit) {
          return c.power > playerCard.power
        }
        return c.suit === trumpSuit && playerCard.suit !== trumpSuit
      })

      // Regra de "Assistir" (Seguir o naipe) se o monte estiver vazio (Fase Final)
      if (isStockEmpty) {
        const sameSuitCards = botHand.value.filter(c => c.suit === playerCard.suit)
        if (sameSuitCards.length > 0) {
          // Se tem o naipe, tem de seguir. Tenta ganhar com a menor carta possível que ganhe.
          const possibleWinners = sameSuitCards.filter(c => c.power > playerCard.power)
          cardToPlay = possibleWinners.length > 0 
            ? possibleWinners.sort((a,b) => a.power - b.power)[0] // Menor das que ganham
            : sameSuitCards.sort((a,b) => a.power - b.power)[0]    // Menor das que perdem
        }
      }

      // Se ainda não escolheu carta (Fase 1 ou não tem o naipe na Fase Final)
      if (!cardToPlay) {
        if (winningCards.length > 0) {
          // Tenta ganhar com a carta "mais barata" (menor power entre as vencedoras)
          cardToPlay = winningCards.sort((a, b) => a.power - b.power)[0]
        } else {
          // Não consegue ganhar, joga a carta mais baixa da mão
          cardToPlay = botHand.value.sort((a, b) => a.power - b.power)[0]
        }
      }
    } else {
      // Se o bot for o PRIMEIRO a jogar (liderar a vaza)
      // Estratégia simples: joga a carta mais baixa que não seja trunfo (se possível)
      const nonTrumps = botHand.value.filter(c => c.suit !== trumpCard.value.suit)
      cardToPlay = nonTrumps.length > 0 
        ? nonTrumps.sort((a,b) => a.power - b.power)[0]
        : botHand.value.sort((a,b) => a.power - b.power)[0]
    }

    // Executar a jogada
    const index = botHand.value.findIndex(c => c.id === cardToPlay.id)
    cardToPlay.playedBy = 'bot'
    botHand.value.splice(index, 1)
    tableCards.value.push(cardToPlay)

    // Se o bot foi o primeiro, passa o turno para o player. 
    // Se foi o segundo, resolve a vaza.
    if (tableCards.value.length === 1) {
      currentTurn.value = 'me'
    } else {
      currentTurn.value = 'processing'
      setTimeout(() => resolveTrick(), 1000)
    }
  }

  const resolveTrick = () => {
    const [c1, c2] = tableCards.value
    const trumpSuit = trumpCard.value.suit
    let winner = 'me'

    // Lógica de quem ganha a vaza (conforme secção 2.4 do PDF)
    if (c1.suit === c2.suit) {
      winner = c1.power > c2.power ? c1.playedBy : c2.playedBy
    } else if (c2.suit === trumpSuit) {
      winner = c2.playedBy
    } else if (c1.suit === trumpSuit) {
      winner = c1.playedBy
    } else {
      winner = c1.playedBy
    }

    // Calcular pontos da vaza
    const points = c1.value + c2.value
    if (winner === 'me') {
      myPoints.value += points
    } else {
      opponentPoints.value += points
    }

    // Limpar mesa e dar cartas (se houver no deck)
    tableCards.value = []
    
    if (deck.value.length > 0) {
      // O vencedor compra primeiro
      if (winner === 'me') {
        myHand.value.push(deck.value.shift())
        botHand.value.push(deck.value.shift())
      } else {
        botHand.value.push(deck.value.shift())
        myHand.value.push(deck.value.shift())
      }
      sortHand(myHand.value)
    }

    // Definir próximo turno
    currentTurn.value = (winner === 'me') ? 'me' : 'bot'

    // Verificar se o jogo acabou
    if (myHand.value.length === 0 && botHand.value.length === 0) {
      finalizeGameLocal()
    } else if (currentTurn.value === 'bot') {
      setTimeout(() => botPlay(), 1000)
    }
  }

  const finalizeGameLocal = () => {
    endedAt.value = new Date()
    
    // Se não estivermos em modo Match, não contamos marcas
    if (!isMatchMode.value) {
      if (myPoints.value >= 61) toast.success("Ganhaste o jogo!")
      else if (myPoints.value < 60) toast.error("Perdeste o jogo.")
      else toast.info("Empate!")
      return
    }

    // Lógica de Marcas (Conforme Secção 5 do PDF)
    let marksWon = 0
    if (myPoints.value >= 61) {
      // 120 pts = Bandeira (Ganha a partida/4 marcas)
      if (myPoints.value === 120) marksWon = 4 
      // 91-119 pts = Capote (2 marcas)
      else if (myPoints.value >= 91) marksWon = 2 
      // 61-90 pts = Risca/Moca (1 marca)
      else marksWon = 1 
      
      myMarks.value += marksWon
      toast.success(`Ganhaste o jogo e recebeste ${marksWon} marca(s)!`)
    } 
    else if (opponentPoints.value >= 61) {
      if (opponentPoints.value === 120) marksWon = 4
      else if (opponentPoints.value >= 91) marksWon = 2
      else marksWon = 1
      
      opponentMarks.value += marksWon
      toast.error(`O Bot ganhou o jogo e recebeu ${marksWon} marca(s)!`)
    } else {
      toast.info("Empate! Ninguém ganha marcas.")
    }

    // Verificar se alguém ganhou a partida (Match) - 4 marcas
    if (myMarks.value >= 4) {
      matchWinner.value = 'me'
      toast.success("VITÓRIA TOTAL! Ganhaste a partida!")
    } else if (opponentMarks.value >= 4) {
      matchWinner.value = 'bot'
      toast.error("DERROTA! O Bot ganhou a partida.")
    }
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