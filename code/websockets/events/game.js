import { getUser } from "../state/connection.js"
// Importamos as funções da Bisca que criámos no step anterior
// Repara que removemos flipCard e clearFlippedCard
import { createGame, getGames, joinGame, removeGame, playCard, resignGame, startTurnTimer, clearTurnTimer, prepareNextGame } from "../state/game.js"
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
    // backend/websockets/events/game.js

    socket.on("join-game", async (matchId) => { // <--- Adicionar async aqui
        const user = getUser(socket.id)
        if (!user) return

        try {
            console.log(`[Socket] O user ${user.nickname} está a tentar entrar no jogo ${matchId}`)

            // Chamamos a função do game.js (que agora é async)
            const match = await joinGame(matchId, user)

            if (match) {
                // 1. Ambos os jogadores devem estar na mesma sala (pelo ID grande do Socket)
                // O Player B (quem entra) faz join agora
                socket.join(`game-${match.id}`)

                // 2. Avisar AMBOS os jogadores que o jogo começou
                // Usamos io.to(...).emit para chegar a todos na sala
                io.to(`game-${match.id}`).emit("game-started", match)

                // 3. Atualizar o Lobby para os outros users (remover o jogo da lista)
                io.emit("games-list", getGames())

                console.log(`[Bisca] Jogo #${match.id} (BD: ${match.db_id}) começou entre ${match.player1.nickname} e ${match.player2.nickname}`)
            } else {
                socket.emit("error", "Não foi possível entrar no jogo. Verifique o seu saldo.")
            }
        } catch (e) {
            console.error("Erro no evento join-game:", e)
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

        if (gameId) {
            // Processa a desistência (atribui pontos e fecha jogo)
            const game = resignGame(gameId, user.id)

            if (game) {
                clearTurnTimer(gameId)
                io.to(`game-${gameId}`).emit("game-update", game)

            }
        }
    })

    socket.on("play-card", async (payload) => {
        console.log("Payload recebido:", payload);
        const user = getUser(socket.id);
        if (!user) return;

        // 1. Usa AWAIT porque a função é async
        // 2. Garante que o nome da propriedade coincide com o que o Frontend envia (ex: matchId)
        const match = await playCard(payload.gameId, user.id, payload.card);

        if (match) {
            // 3. O ID para a sala deve ser o match.id (o ID que os jogadores usaram para entrar na sala)
            // Se no join-room usaste "game-123", aqui tem de ser igual
            io.to(`game-${match.id}`).emit("game-update", match);

            if (match.currentGame && match.currentGame.status === 'Playing') {
                // Timer baseado no ID do match e no turno atual
                startTurnTimer(match.id, () => handleTimeout(match.id, match.currentGame.turn));
            } else {
                clearTurnTimer(match.id);
            }
        } else {
            console.log("Jogada inválida ou Match não encontrado");
        }
    });

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