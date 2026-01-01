import { getUser } from "../state/connection.js"
// Importamos as funções da Bisca que criámos no step anterior
// Repara que removemos flipCard e clearFlippedCard
import { createGame, getGames, joinGame, removeGame, playCard, resignGame, startTurnTimer, clearTurnTimer,prepareNextGame } from "../state/game.js"
import { server } from "../server.js"

export const handleGameEvents = (io, socket) => {

    // --- 1. CRIAR JOGO ---
    socket.on("create-game", (config) => {
        
        const user = getUser(socket.id)
        if (!user) return
        
        try {
            // Cria o jogo com as configurações (aposta, tipo, etc)
            const game = createGame(config, user)
            console.log(game)
            
            // O criador entra na sala do Socket correspondente
            socket.join(`game-${game.id}`)
            
            console.log(`[Bisca] ${user.name} criou o jogo #${game.id} (Tipo: ${game.type})`)
            
            // Envia a lista atualizada para TODOS os clientes (Lobby)
            // Nota: O frontend espera "games-list", não apenas "games"
            io.emit("games-list", getGames())
        } catch (e) {
            console.error("Erro ao criar jogo:", e)
        }
    })
    
    // --- 2. PEDIR LISTA DE JOGOS ---
    socket.on("get-games", () => {
        socket.emit("games-list", getGames())
    })

    const handleTimeout = (gameId, loserId) => {
        // Usa a mesma lógica de desistência
        const game = resignGame(gameId, loserId)
        if (game) {
            // Adiciona uma flag para o frontend saber que foi por tempo
            game.timeout = true 
            io.to(`game-${gameId}`).emit("game-update", game)
        }
    }
    
    // --- 3. JUNTAR A UM JOGO ---
    socket.on("join-game", (payload) => {
        const user = getUser(socket.id)
        if (!user) return

        // O payload pode vir como objeto { gameId: 1 } ou direto
        const gameId = payload.gameId || payload
        
        // Tenta juntar o jogador (a função joinGame no state já baralha e dá cartas)
        const game = joinGame(gameId, user)
        
        if (game) {
            // Jogador entra na sala
            socket.join(`game-${game.id}`)
            console.log(`[Bisca] ${user.name} entrou no jogo #${game.id}`)
            
            // 1. Atualiza o lobby para todos (o jogo deixa de estar 'Pending')
            io.emit("games-list", getGames())
            
            // 2. AVISA A SALA que o jogo começou e envia os dados (cartas, trunfo, etc)
            // Isto fará o frontend redirecionar para o tabuleiro
            io.to(`game-${game.id}`).emit("game-started", game)

            startTurnTimer(game.id, () => handleTimeout(game.id, game.turn))
        } else {
            // Envia erro apenas para quem tentou entrar
            socket.emit("error", { message: "Não foi possível entrar no jogo (Cheio ou Cancelado)." })
        }
    })
    
    // --- 4. CANCELAR JOGO ---
    socket.on("cancel-game", (payload) => {
        
        const user = getUser(socket.id)
        if (!user) return

        const gameId = payload.gameId || payload

        // Se conseguir remover (só o criador pode), atualiza a lista
        if (removeGame(gameId, user.id)) {
            console.log(`[Bisca] Jogo #${gameId} cancelado por ${user.name}`)
            io.emit("games-list", getGames())
        }
    })

    // --- 5. SAIR DO JOGO (Leave) ---
    socket.on("leave-game", (payload) => {
        const user = getUser(socket.id)
        if (!user) return

        const gameId = payload.gameId

        if(gameId) {
            // Processa a desistência (atribui pontos e fecha jogo)
            const game = resignGame(gameId, user.id)

            if (game) {
                clearTurnTimer(gameId)
                io.to(`game-${gameId}`).emit("game-update", game)

            }
        }
    })

    socket.on("play-card", (payload) => {
        const user = getUser(socket.id)
        if (!user) return

        // Executa a lógica
        const game = playCard(payload.gameId, user.id, payload.card)
        
        if (game) {
            // Envia o estado atualizado para AMBOS os jogadores
            io.to(`game-${game.id}`).emit("game-update", game)

            if (game.status === 'Playing') {
                // Se o jogo continua, inicia timer para o PRÓXIMO jogador (game.turn)
                startTurnTimer(game.id, () => handleTimeout(game.id, game.turn))
            } else {
                // Se acabou, garante que não há timers
                clearTurnTimer(game.id)
            }
        }
    })

    socket.on("request-next-game", (payload) => {
        const gameId = payload.gameId
        
        // Prepara o tabuleiro para a nova ronda
        const game = prepareNextGame(gameId)
        
        if (game) {
            // Emite 'game-started' novamente para reiniciar o UI do cliente
            // (Esconde o modal, mostra as novas cartas)
            io.to(`game-${gameId}`).emit("game-started", game)
        }
    })
}