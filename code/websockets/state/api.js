import axios from 'axios';


// Configuração do Axios para falar com o Laravel
const api = axios.create({
    baseURL: `http://${import.meta.env.VITE_API_DOMAIN}/api`, // URL do teu Laravel
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Token interno para o Laravel saber que o pedido vem do Socket e não de um user comum
        //'Authorization': 'Bearer ' + process.env.INTERNAL_API_TOKEN
    }
});

export const dbAPI = {

    async storeMatch(matchData) {
        try {
            const response = await api.post('/matches', {
                type: matchData.type,
                player1_user_id: matchData.player1.id,
                player2_user_id: matchData.player2.id,
                stake: matchData.stake,
                is_match: matchData.isMatch ? 1 : 0,
                status: 'Playing',
                began_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
            console.log(response.data)
            return response.data; // Retorna o ID criado na BD
        } catch (error) {
            console.error('Erro ao guardar Match no Laravel:', error.response?.data || error.message);
        }
    },

    // 2. Criar um Jogo
    async storeGame(gameData, matchId) {
        console.log(gameData)
        try {
            const response = await api.post('/games', {
                match_id: matchId, // ID que veio da storeMatch
                type: gameData.type,
                player1_user_id: gameData.p1_id,
                player2_user_id: gameData.p2_id,
                status: 'Playing',
                began_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao guardar Game no Laravel:', error.message);
        }
    },

    // 3. Atualizar Resultado do Round (Tabela games)
    async updateGameResult(gameId, results) {

        try {
            await api.patch(`/games/${gameId}`, {
                player1_points: results.player1_points, // Garante que nunca vai null
                player2_points: results.player2_points, // Garante que nunca vai null
                total_time: Math.round(results.total_time),
            });
        } catch (error) {
            console.error('Erro ao atualizar Game:', error.message);
        }
    },

    // 4. Finalizar a Partida (Tabela matches)
    async finalizeMatch(matchId, finalResults) {
        try {
            await api.patch(`/matches/${matchId}`, {
                winner_user_id: finalResults.winnerId,
                player1_marks: finalResults.p1Marks,
                player2_marks: finalResults.p2Marks,
                // Novos campos para a lógica unificada:
                is_match: finalResults.is_match,
                player1_points: finalResults.player1_points,
                player2_points: finalResults.player2_points,
                status: 'Ended'
            });
        } catch (error) {
            console.error('Erro ao finalizar Match:', error.message);
        }
    }
};