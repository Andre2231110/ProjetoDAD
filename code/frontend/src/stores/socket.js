import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from './game'
import { useAuthStore } from './auth'
import { toast } from 'vue-sonner'

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket')
  const authStore = useAuthStore()
  const gameStore = useGameStore()
  const router = useRouter()

  // Flag para evitar enviar 'login' múltiplas vezes
  const joined = ref(false)

  // --------------------------------------------------------
  // 1. GESTÃO DE CONEXÃO E IDENTIDADE (DO PROFESSOR)
  // --------------------------------------------------------

  // Envia os dados do user para o servidor saber quem é o socket.id
  const emitJoin = (user) => {
    if (!socket || joined.value) return
    
    console.log(`[Socket] A enviar login para o servidor...`)
    // Nota: No backend 'events/connection.js' deves ter socket.on('login', ...)
    socket.emit('login', user) 
    joined.value = true
  }

  const emitLeave = () => {
    if (!socket) return
    socket.emit('logout') // Se tiveres este evento no backend
    joined.value = false
  }

  const handleConnection = () => {
    if (!socket) return

    socket.on('login', () => {
      console.log(`[Socket] Connected -- ${socket.id}`)
      
      // Se já estiver logado na App, faz login no Socket automaticamente
      if (authStore.currentUser && !joined.value) {
        emitJoin(authStore.currentUser)
      }
      
      // Pede a lista de jogos sempre que reconecta
      emitGetGames()
    })

    socket.on('disconnect', () => {
      joined.value = false
      console.log(`[Socket] Disconnected`)
      toast.error('Ligação ao servidor perdida.')
    })

    socket.on('error', (err) => {
        console.error("[Socket Error]", err)
        toast.error(err.message || "Erro de comunicação")
    })
  }

  // --------------------------------------------------------
  // 2. EVENTOS DE JOGO (LÓGICA BISCA)
  // --------------------------------------------------------

  const handleGameEvents = () => {
    if (!socket) return

    // --- LOBBY: Recebe a lista de jogos ---
    socket.on('games-list', (games) => {
      // console.log(`[Socket] Lista recebida: ${games.length} jogos`)
      gameStore.setGames(games)
    })

    // --- START: O jogo começou (ambos os jogadores recebem isto) ---
    socket.on('game-started', (gameData) => {
      console.log('[Socket] GAME STARTED:', gameData)
      
      // 1. Configura a store com as cartas iniciais e estado
      gameStore.startMultiplayerGame(gameData)
      
      // 2. Redireciona para o tabuleiro
      router.push({ name: 'Game', query: { mode: 'multiplayer' } })
      toast.success('Jogo começou!')
    })

    socket.on('game-update', (gameData) => {
       console.log('Update de jogo recebido:', gameData)
       gameStore.updateMultiplayerState(gameData)
    })
  }

  // --------------------------------------------------------
  // 3. AÇÕES (EMITTERS)
  // --------------------------------------------------------

  const emitGetGames = () => {
    socket.emit('get-games')
  }

  const emitCreateGame = (config) => {
    // config = { type: '3', isMatch: false, stake: 2 }
    socket.emit('create-game', config)
  }

  const emitJoinGame = (game) => {
    // Validação de saldo antes de enviar

    console.log(game)
    console.log(game.id)
    console.log(authStore.currentUser?.coins_balance)

    const balance = authStore.currentUser?.coins_balance ?? 0
    if (balance < game.stake) {
        toast.error('Saldo insuficiente!')
        return
    }
    
    console.log(`[Socket] A tentar entrar no jogo ${game.id}`)
    socket.emit('join-game', game.id)
  }

  const emitCancelGame = (gameId) => {
    socket.emit('cancel-game', { gameId })
  }

  const emitLeaveGame = (gameId) => {
      socket.emit('leave-game', { gameId })
  }
  const emitPlayCard = (gameId, card) => {
      console.log(`[Socket] A jogar carta ${card.id} no jogo ${gameId}`)
      socket.emit('play-card', { gameId, card })
  }

  const emitRequestNextGame = (gameId) => {
      console.log(`[Socket] Pedindo próximo jogo para match ${gameId}`)
      socket.emit('request-next-game', { gameId })
  }

  return {
    joined,
    handleConnection,
    handleGameEvents,
    emitJoin,
    emitLeave,
    emitGetGames,
    emitCreateGame,
    emitJoinGame,
    emitCancelGame,
    emitLeaveGame,
    emitPlayCard,
    emitRequestNextGame
  }
})