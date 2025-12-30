import { defineStore } from 'pinia'
import { ref, computed, inject, watch } from 'vue'
import { useAPIStore } from './api'
import { useAuthStore } from './auth'
import { toast } from 'vue-sonner'

export const useGameStore = defineStore('game', () => {
  const apiStore = useAPIStore()
  const authStore = useAuthStore()
  const socket = inject('socket')

  // ------------------------------------------------------------------------
  // 1. ESTADO DO JOGO (BISCA LOCAL & BOT)
  // ------------------------------------------------------------------------
  
  // Flag para distinguir Online vs Bot
  const isMultiplayer = ref(false)
  const multiplayerGameId = ref(null)

  const deck = ref([])
  const myHand = ref([]) 
  const botHand = ref([]) 
  const trumpCard = ref(null) 
  const tableCards = ref([]) 
  
  // 'me' = Minha vez | 'bot' = Vez do Bot | 'processing' = A resolver vaza
  const currentTurn = ref('me')
  
  // Pontuação e Estado do Jogo Atual
  const myPoints = ref(0)
  const opponentPoints = ref(0)
  const beganAt = ref(undefined)
  const endedAt = ref(undefined)

  // --- ESTADO DA PARTIDA (MATCH) ---
  const isMatchMode = ref(false)      // True se for uma partida de 4 marcas
  const myMarks = ref(0)              // Minhas marcas acumuladas (0 a 4)
  const opponentMarks = ref(0)        // Marcas do bot (0 a 4)
  const matchWinner = ref(null)       // 'me', 'bot' ou null se ainda decorre
  
  // Computed para saber se o jogo acabou
  const isGameComplete = computed(() => {
    return deck.value.length === 0 && 
           myHand.value.length === 0 && 
           botHand.value.length === 0 && 
           tableCards.value.length === 0 && 
           beganAt.value !== undefined
  })

  // Configurações Bisca
  const suits = ['c', 'o', 'p', 'e']
  const ranks = [2, 3, 4, 5, 6, 12, 11, 13, 7, 1] 
  
  const cardValues = { 1: 11, 7: 10, 13: 4, 11: 3, 12: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  const cardPower = { 1: 10, 7: 9, 13: 8, 11: 7, 12: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }

  const rankNames = { 1: 'Ás', 11: 'Valete', 12: 'Dama', 13: 'Rei', 7: 'Sete' }
  const getSuitName = (s) => ({ c: 'Copas', o: 'Ouros', p: 'Paus', e: 'Espadas' }[s])

  // ------------------------------------------------------------------------
  // 2. AÇÕES GERAIS (BARALHO E TURNO)
  // ------------------------------------------------------------------------

  const buildDeck = () => {
    const newDeck = []
    let idCounter = 1
    suits.forEach(suit => {
      ranks.forEach(rank => {
        newDeck.push({
          id: idCounter++,
          suit: suit,
          rank: rank,
          value: cardValues[rank],
          power: cardPower[rank],
          imageName: `${suit}${rank}.png`,
          fullName: `${rankNames[rank] || rank} de ${getSuitName(suit)}`
        })
      })
    })
    return newDeck
  }

  const shuffleDeck = (d) => {
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d
  }

  // Helper para resetar apenas o estado da rodada atual
  const resetRoundState = () => {
    tableCards.value = []
    myPoints.value = 0
    opponentPoints.value = 0
    endedAt.value = undefined
    currentTurn.value = 'me'
    beganAt.value = new Date()
  }

  // --- INICIAR JOGO / PARTIDA ---

  const startGameLocal = (cardsPerHand = 3, matchMode = false) => {
    isMultiplayer.value = false // Garante que estamos em modo local
    resetRoundState()
    
    // Configurações da Partida
    if (matchMode) {
        if (!isMatchMode.value) {
            isMatchMode.value = true
            myMarks.value = 0
            opponentMarks.value = 0
            matchWinner.value = null
        }
    } else {
        isMatchMode.value = false
        myMarks.value = 0
        opponentMarks.value = 0
        matchWinner.value = null
    }

    dealCards(cardsPerHand)
    toast.success('Jogo iniciado!')
  }

  const nextGameInMatch = (cardsPerHand = 3) => {
    if (!isMatchMode.value) return
    resetRoundState()
    
    // Se for local, dá cartas. Se for online, o servidor é que dá.
    if (!isMultiplayer.value) {
        dealCards(cardsPerHand)
    }
    toast.info(`Iniciando jogo. Placar: ${myMarks.value} - ${opponentMarks.value}`)
  }

  const dealCards = (cardsPerHand) => {
    let fullDeck = shuffleDeck(buildDeck())
    const trump = fullDeck[fullDeck.length - 1] 
    trumpCard.value = trump

    myHand.value = fullDeck.splice(0, cardsPerHand)
    botHand.value = fullDeck.splice(0, cardsPerHand)
    deck.value = fullDeck
    
    sortHand(myHand.value)
  }

  const leaveGame = () => {
    // Se estiver online, avisar servidor
    if (isMultiplayer.value && multiplayerGameId.value) {
        socket.emit('leave-game', { gameId: multiplayerGameId.value })
    }

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

  // --- ORDENAÇÃO DA MÃO ---
  const sortHand = (hand) => {
    const currentTrumpSuit = trumpCard.value ? trumpCard.value.suit : ''

    hand.sort((a, b) => {
      // 1. Trunfo sempre à esquerda
      const isATrump = a.suit === currentTrumpSuit
      const isBTrump = b.suit === currentTrumpSuit

      if (isATrump && !isBTrump) return -1 
      if (!isATrump && isBTrump) return 1  

      // 2. Agrupar por naipes diferentes
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit)
      }

      // 3. Dentro do mesmo naipe: Mais forte (Ás) à esquerda
      return b.power - a.power 
    })
  }

  // ------------------------------------------------------------------------
  // 3. LÓGICA DE JOGO (PLAY & BOT)
  // ------------------------------------------------------------------------

  // Jogada do Humano
  const playCard = (card) => {
    if (currentTurn.value !== 'me' || tableCards.value.length >= 2 || isGameComplete.value) return 

    // --- ALTERAÇÃO IMPORTANTE: Se for Online, envia para o servidor e PARA ---
    if (isMultiplayer.value) {
        socket.emit('play-card', { gameId: multiplayerGameId.value, card: card })
        return // Não executamos a lógica local
    }

    // --- LÓGICA LOCAL (BOT) ---
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

  // Jogada do Bot (Apenas Local)
  const botPlay = () => {
    if (botHand.value.length === 0) return

    let cardToPlay = null
    const leadCard = tableCards.value.length > 0 ? tableCards.value[0] : null
    const trump = trumpCard.value

    // 1. Filtrar ("Assistir")
    let playableCards = botHand.value
    if (deck.value.length === 0 && leadCard) {
        const sameSuitCards = botHand.value.filter(c => c.suit === leadCard.suit)
        if (sameSuitCards.length > 0) {
            playableCards = sameSuitCards
        }
    }

    // 2. Decidir Carta (Lógica simples mantida)
    if (!leadCard) {
        const sorted = [...playableCards].sort((a, b) => a.power - b.power)
        const nonTrumps = sorted.filter(c => c.suit !== trump.suit)
        cardToPlay = nonTrumps.length > 0 ? nonTrumps[0] : sorted[0]
    } else {
        const winningSameSuit = playableCards.filter(c => c.suit === leadCard.suit && c.power > leadCard.power).sort((a, b) => a.power - b.power)
        const winningTrump = playableCards.filter(c => c.suit === trump.suit).sort((a, b) => a.power - b.power)

        if (winningSameSuit.length > 0) cardToPlay = winningSameSuit[0] 
        else if (leadCard.suit !== trump.suit && winningTrump.length > 0) cardToPlay = winningTrump[0] 
        else {
            const trashOptions = [...playableCards].sort((a, b) => {
                if (a.value !== b.value) return a.value - b.value 
                return a.power - b.power 
            })
            cardToPlay = trashOptions[0]
        }
    }

    // Executar
    cardToPlay.playedBy = 'bot' 
    const index = botHand.value.findIndex(c => c.id === cardToPlay.id)
    botHand.value.splice(index, 1)
    tableCards.value.push(cardToPlay)

    if (tableCards.value.length === 1) {
        currentTurn.value = 'me'
        toast.info('Sua vez de jogar.')
    } else {
        currentTurn.value = 'processing'
        setTimeout(() => resolveTrick(), 1000)
    }
  }

  // Resolver Vaza (Apenas Local)
  const resolveTrick = () => {
    if (tableCards.value.length < 2) return

    const c1 = tableCards.value[0]
    const c2 = tableCards.value[1]
    const trump = trumpCard.value.suit
    let winnerIndex = 0 

    if (c1.suit === c2.suit) {
        if (c2.power > c1.power) winnerIndex = 1
    } else {
        if (c2.suit === trump) winnerIndex = 1
        else winnerIndex = 0
    }

    const points = c1.value + c2.value
    const winner = tableCards.value[winnerIndex].playedBy
    
    if (winner === 'me') {
        myPoints.value += points
        if (points > 0) toast.success(`Ganhaste a vaza! (+${points} pts)`)
    } else {
        opponentPoints.value += points
        if (points > 0) toast.info(`Bot ganhou a vaza. (+${points} pts)`)
    }

    tableCards.value = [] 
    drawCards(winner) 
    
    currentTurn.value = winner 

    if (!isGameComplete.value) {
        if (winner === 'bot') {
            setTimeout(() => botPlay(), 1000)
        } else {
            toast.success('É a tua vez de jogar!')
        }
    }
  }

  const drawCards = (winner) => {
    if (deck.value.length === 0) return

    const card1 = deck.value.shift()
    const card2 = deck.value.shift()

    if (winner === 'me') {
        if (card1) myHand.value.push(card1)
        if (card2) botHand.value.push(card2)
    } else {
        if (card1) botHand.value.push(card1)
        if (card2) myHand.value.push(card2)
    }
    sortHand(myHand.value)
  }

  // ------------------------------------------------------------------------
  // 4. FIM DE JOGO & CÁLCULO DE MARCAS
  // ------------------------------------------------------------------------

  const calculateMarks = (points) => {
    if (points === 120) return 4 
    if (points >= 91) return 2   
    if (points >= 61) return 1   
    return 0 
  }

  const processEndGame = () => {
    endedAt.value = new Date()
    let earnedMarks = 0
    let roundWinner = null

    if (myPoints.value > opponentPoints.value) {
        earnedMarks = calculateMarks(myPoints.value)
        roundWinner = 'me'
        if (isMatchMode.value) myMarks.value += earnedMarks
    } 
    else if (opponentPoints.value > myPoints.value) {
        earnedMarks = calculateMarks(opponentPoints.value)
        roundWinner = 'bot'
        if (isMatchMode.value) opponentMarks.value += earnedMarks
    }

    if (isMatchMode.value) {
        if (myMarks.value >= 4) {
            matchWinner.value = 'me'
            myMarks.value = 4
            toast.success('PARABÉNS! Ganhaste a partida!')
        } 
        else if (opponentMarks.value >= 4) {
            matchWinner.value = 'bot'
            opponentMarks.value = 4
            toast.error('O Bot ganhou a partida.')
        }
    }

    saveGame(roundWinner)
  }

  const saveGame = async (winner) => {
    const gameData = {
      type: 'S', 
      status: 'E', 
      player1_points: myPoints.value,
      player2_points: opponentPoints.value,
      began_at: beganAt.value,
      ended_at: endedAt.value,
      total_time: Math.ceil((endedAt.value - beganAt.value) / 1000),
      player1_id: authStore.currentUser ? authStore.currentUser.id : undefined,
    }
    try {
      await apiStore.postGame(gameData)
      toast.success('Jogo guardado no histórico!')
    } catch (e) {
      console.error(e)
    }
  }

  watch(isGameComplete, (val) => {
    if (val && !isMultiplayer.value) { // Só salva automaticamente se for Local
      setTimeout(() => {
        processEndGame()
      }, 1000)
    }
  })

  // ------------------------------------------------------------------------
  // 5. MULTIPLAYER / LOBBY (ATUALIZADO PARA LOBBYPAGE.VUE)
  // ------------------------------------------------------------------------
  
  const games = ref([]) 

  // --- AÇÃO 1: CRIAR JOGO (AGORA ACEITA OBJETO) ---
  const createGame = (config) => {
    if (!authStore.currentUser) {
      toast.error('Login necessário')
      return
    }
    if (!socket || !socket.connected) {
      toast.error('Sem conexão ao servidor.')
      return
    }
    
    // Config pode ser apenas string (retrocompatibilidade) ou objeto (novo lobby)
    // Se vier do novo lobby, config é { type: '3', isMatch: false, stake: 2 }
    socket.emit('create-game', config)
  }

  // --- AÇÃO 2: CANCELAR JOGO ---
  const cancelGame = (gameId) => {
    if (!socket || !socket.connected) return
    socket.emit('cancel-game', { gameId })
  }

  // --- AÇÃO 3: JUNTAR JOGO ---
  const joinGame = (gameId) => {
    if (!socket || !socket.connected) return
    // Validação extra de saldo deve ser feita na UI ou backend, mas aqui é o trigger
    socket.emit('join-game', { gameId })
  }

  const setGames = (newGames) => {
    games.value = newGames
  }

  // Função para configurar o estado quando o jogo multiplayer começa
  const startMultiplayerGame = (gameData) => {
      isMultiplayer.value = true
      multiplayerGameId.value = gameData.id
      resetRoundState()
      // Aqui carregarias a mão inicial vinda do servidor, etc.
  }

  const myGames = computed(() => {
    if (!authStore.currentUser) return []
    // Filtra pelos jogos criados pelo user atual
    return games.value.filter((game) => game.creator == authStore.currentUser.id || game.creator == authStore.currentUser.nickname)
  })

  const availableGames = computed(() => {
    if (!authStore.currentUser) return []
    // Filtra jogos que NÃO são meus
    return games.value.filter((game) => game.creator != authStore.currentUser.id && game.creator != authStore.currentUser.nickname)
  })

  return {
    // State
    isMultiplayer, multiplayerGameId,
    deck, myHand, botHand, trumpCard, tableCards,
    myPoints, opponentPoints, isGameComplete, currentTurn,
    isMatchMode, myMarks, opponentMarks, matchWinner,
    games, 

    // Actions Game
    startGameLocal, nextGameInMatch, leaveGame, playCard, botPlay, saveGame,

    // Actions Lobby
    createGame, cancelGame, joinGame, setGames, startMultiplayerGame,
    
    // Getters
    myGames, availableGames
  }
})