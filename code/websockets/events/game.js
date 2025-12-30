import { getUser } from "../state/connection.js"
// Importamos as funções da Bisca que criámos no step anterior
// Repara que removemos flipCard e clearFlippedCard
import { createGame, getGames, joinGame, removeGame,playCard } from "../state/game.js"
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
        const gameId = payload.gameId
        if(gameId) {
            socket.leave(`game-${gameId}`)
            // Aqui poderias adicionar lógica para dar vitória ao adversário por desistência
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
        }
    })
}