<template>
    <div class="container mx-auto p-6">
        <div class="max-w-5xl mx-auto space-y-8">

            <!-- CABEÇALHO DE STATUS -->
            <div
                class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-800">
                <div>
                    <h1 class="text-2xl font-black tracking-tight">LOBBY</h1>
                    <p class="text-slate-400 text-sm">Escolhe a tua mesa ou cria um novo desafio.</p>
                </div>
                <div class="flex items-center gap-4 bg-indigo-800 p-3 rounded-xl border border-slate-700">
                    <span class="text-amber-400 text-xl">💰</span>
                    <div>
                        <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">O teu Saldo</p>
                        <p class="text-lg font-black">{{ authStore.currentUser?.coins_balance ?? 0 }} Moedas</p>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-8">

                <!-- LINHA SUPERIOR: CRIAÇÃO DE JOGOS (MULTIPLAYER E BOT) -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <!-- 1. CRIAR MESA MULTIPLAYER (COM APOSTAS) -->
                    <Card class="shadow-lg border-t-4 border-t-indigo-500 h-full">
                        <CardHeader>
                            <CardTitle class="text-xl font-bold flex items-center gap-2">
                                <span>🌐</span> Multiplayer Online
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <!-- Variante -->
                            <div class="space-y-3">
                                <label
                                    class="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                                    Variante do Jogo
                                </label>
                                <div class="flex p-1 bg-indigo-50/50 rounded-xl gap-1 border border-indigo-100">
                                    <Button type="button" @click="newGame.type = '3'" :class="[
                                        'flex-1 h-10 font-bold transition-all border-none shadow-none rounded-lg',
                                        newGame.type === '3'
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                            : 'bg-transparent text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/50'
                                    ]">
                                        Bisca de 3
                                    </Button>
                                    <Button type="button" @click="newGame.type = '9'" :class="[
                                        'flex-1 h-10 font-bold transition-all border-none shadow-none rounded-lg',
                                        newGame.type === '9'
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                            : 'bg-transparent text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/50'
                                    ]">
                                        Bisca de 9
                                    </Button>
                                </div>
                            </div>

                            <!-- Formato -->
                            <div class="space-y-3">
                                <label
                                    class="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                                    Formato da Partida
                                </label>
                                <div class="space-y-2">
                                    <!-- Jogo Único -->
                                    <button type="button" @click="newGame.isMatch = false" :class="[
                                        'w-full p-4 border-2 rounded-2xl text-left transition-all duration-200',
                                        !newGame.isMatch
                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20'
                                            : 'border-slate-100 bg-white hover:border-indigo-200'
                                    ]">
                                        <div class="flex justify-between items-center">
                                            <p
                                                :class="['font-black text-sm', !newGame.isMatch ? 'text-indigo-900' : 'text-slate-600']">
                                                Jogo Único
                                            </p>
                                            
                                        </div>
                                        <p
                                            class="text-[10px] font-bold text-indigo-400/80 uppercase italic tracking-tighter">
                                            2 coins entrada
                                        </p>
                                    </button>

                                    <!-- Match -->
                                    <button type="button" @click="newGame.isMatch = true" :class="[
                                        'w-full p-4 border-2 rounded-2xl text-left transition-all duration-200',
                                        newGame.isMatch
                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20'
                                            : 'border-slate-100 bg-white hover:border-indigo-200'
                                    ]">
                                        <div class="flex justify-between items-center">
                                            <p
                                                :class="['font-black text-sm', newGame.isMatch ? 'text-indigo-900' : 'text-slate-600']">
                                                Match (4 Marcas)
                                            </p>
                                        
                                        </div>
                                        <p
                                            class="text-[10px] font-bold text-indigo-400/80 uppercase italic tracking-tighter">
                                            Mínimo 3 coins
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <!-- Input de Aposta (Apenas Multiplayer Match) -->
                            <div class="space-y-4 pt-2" v-if="newGame.isMatch">
                                <div class="flex justify-between items-end">
                                    <label
                                        class="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                                        Aposta
                                    </label>
                                    <div class="flex items-center gap-1 bg-indigo-100 px-2 py-1 rounded-lg">
                                        <span class="text-xs font-black text-indigo-600">{{ newGame.stake }}</span>
                                        <span class="text-[10px] text-indigo-400 font-bold uppercase">Coins</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4 group">
                                    <input type="range" v-model="newGame.stake" min="3" max="100"
                                        class="flex-1 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                                </div>
                            </div>

                            <div class="pt-4 mt-auto">
                                <Button @click="handleCreate"
                                    class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-100">
                                    CRIAR MESA
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- 2. JOGAR CONTRA BOT (OFFLINE/TREINO) -->
                    <Card class="shadow-lg border-t-4 border-t-slate-500 h-full">
                        <CardHeader>
                            <CardTitle class="text-xl font-bold flex items-center gap-2 text-slate-800">
                                <span>🤖</span> Praticar vs Bot
                            </CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <!-- Variante Bot -->
                            <div class="space-y-3">
                                <label
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    Variante do Treino
                                </label>
                                <div class="flex p-1 bg-slate-50 rounded-xl gap-1 border border-slate-200">
                                    <Button type="button" @click="botGameConfig.type = '3'" :class="[
                                        'flex-1 h-10 font-bold transition-all border-none shadow-none rounded-lg',
                                        botGameConfig.type === '3'
                                            ? 'bg-slate-700 text-white hover:bg-slate-800 shadow-md'
                                            : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                                    ]">
                                        Bisca de 3
                                    </Button>
                                    <Button type="button" @click="botGameConfig.type = '9'" :class="[
                                        'flex-1 h-10 font-bold transition-all border-none shadow-none rounded-lg',
                                        botGameConfig.type === '9'
                                            ? 'bg-slate-700 text-white hover:bg-slate-800 shadow-md'
                                            : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                                    ]">
                                        Bisca de 9
                                    </Button>
                                </div>
                            </div>

                            <!-- Formato Bot -->
                            <div class="space-y-3">
                                <label
                                    class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    Duração
                                </label>
                                <div class="space-y-2">
                                    <!-- Bot Jogo Único -->
                                    <button type="button" @click="botGameConfig.isMatch = false" :class="[
                                        'w-full p-4 border-2 rounded-2xl text-left transition-all duration-200',
                                        !botGameConfig.isMatch
                                            ? 'border-slate-600 bg-slate-50 ring-1 ring-slate-600/20'
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                    ]">
                                        <div class="flex justify-between items-center">
                                            <p
                                                :class="['font-black text-sm', !botGameConfig.isMatch ? 'text-slate-900' : 'text-slate-500']">
                                                Jogo Rápido
                                            </p>
                                        </div>
                                        <p
                                            class="text-[10px] font-bold text-slate-400 uppercase italic tracking-tighter">
                                            Sem custo
                                        </p>
                                    </button>

                                    <!-- Bot Match -->
                                    <button type="button" @click="botGameConfig.isMatch = true" :class="[
                                        'w-full p-4 border-2 rounded-2xl text-left transition-all duration-200',
                                        botGameConfig.isMatch
                                            ? 'border-slate-600 bg-slate-50 ring-1 ring-slate-600/20'
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                    ]">
                                        <div class="flex justify-between items-center">
                                            <p
                                                :class="['font-black text-sm', botGameConfig.isMatch ? 'text-slate-900' : 'text-slate-500']">
                                                Simular Match
                                            </p>
                                            
                                        </div>
                                        <p
                                            class="text-[10px] font-bold text-slate-400 uppercase italic tracking-tighter">
                                            4 Marcas
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <!-- Espaçador para alinhar botões se necessário -->
                            <div class="pt-4 mt-auto">
                                <Button @click="startSinglePlayer(botGameConfig)"
                                    class="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white font-black text-lg shadow-lg shadow-slate-200">
                                    INICIAR JOGO SOLO
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <!-- LINHA INFERIOR: LOBBY E MEUS JOGOS -->
                <div class="space-y-6">

                    <!-- Meus Jogos Ativos -->
                    <div v-if="gameStore.myGames.length > 0" class="space-y-3">
                        <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest px-2">As Tuas Mesas</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div v-for="game in gameStore.myGames" :key="game.id"
                                class="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-pulse-slow">
                                <div class="flex gap-4 items-center">
                                    <div
                                        class="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                        B{{ game.type }}
                                    </div>
                                    <div>
                                        <p class="font-black text-indigo-900">{{ game.isMatch ? 'Match' : 'Individual'
                                            }}</p>
                                        <p class="text-xs font-bold text-indigo-400 uppercase">Aposta: {{ game.stake }}
                                            💰</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <Button v-if="game.player2" @click="startGame(game)"
                                        class="bg-emerald-500 hover:bg-emerald-600 font-bold">COMEÇAR</Button>
                                    <Button @click="cancelGame(game)" variant="outline"
                                        class="border-indigo-200 text-indigo-600 hover:bg-white">Cancelar</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Lobby Global -->
                    <Card class="min-h-[400px]">
                        <CardHeader class="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
                            <CardTitle class="text-xl font-black">Lobby de Jogos Disponíveis</CardTitle>
                            <Button @click="refreshLobby" variant="outline" size="sm" class="rounded-full gap-2">
                                <span>🔄</span> Atualizar
                            </Button>
                        </CardHeader>
                        <CardContent class="p-0">
                            <div v-if="!gameStore.availableGames?.length"
                                class="flex flex-col items-center justify-center py-20 text-slate-300">
                                <span class="text-6xl mb-4 text-slate-200">🎴</span>
                                <p class="font-bold">Nenhuma mesa aberta de momento...</p>
                            </div>

                            <div v-else class="divide-y divide-slate-50">
                                <div v-for="game in gameStore.availableGames" :key="game.id"
                                    class="p-5 flex flex-col md:flex-row items-center justify-between hover:bg-slate-50 transition-colors gap-4">

                                    <div class="flex items-center gap-4 w-full md:w-auto">
                                        <div
                                            class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-black text-slate-600">
                                            {{ game.creator.charAt(0) }}
                                        </div>
                                        <div>
                                            <p class="font-black text-slate-800 tracking-tight">{{ game.creator }}'s
                                                Table</p>
                                            <div class="flex gap-2 mt-1">
                                                <Badge variant="secondary" class="text-[10px] px-2 py-0">Bisca {{
                                                    game.type }}</Badge>
                                                <Badge v-if="game.isMatch"
                                                    class="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px]">
                                                    🏆 Match
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        class="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                        <div class="text-right">
                                            <p class="text-[10px] font-black text-slate-400 uppercase">Stake</p>
                                            <p class="text-xl font-black text-emerald-600 leading-none">{{ game.stake }}
                                                💰</p>
                                        </div>
                                        <Button @click="joinGame(game)"
                                            :disabled="authStore.user?.coins_balance < game.stake"
                                            class="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl px-6 font-bold h-11 transition-all">
                                            ENTRAR
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
 import { ref } from 'vue'
import { reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const socketStore = useSocketStore()

// Configuração inicial para novo jogo (Seguindo as regras do PDF)
const newGame = ref({
    type: '3',      // '3' para Bisca de 3, '9' para Bisca de 9
    isMatch: false, // Jogo Único vs Match de 4 marcas
    stake: 2        // 2 coins para jogo único, min 3 para Match
})

const botGameConfig = ref({
    type: '3',       // Valor inicial: Bisca de 3
    isMatch: false   // Valor inicial: Jogo Rápido (não match)
});

// Ajusta a aposta mínima automaticamente se mudar para Match
watch(() => newGame.isMatch, (isMatch) => {
    newGame.stake = isMatch ? 3 : 2
})

const handleCreate = () => {
    // Validação de saldo
    if (authStore.user.coins_balance < newGame.stake) {
        alert("Saldo de moedas insuficiente!")
        return
    }
    // O gameStore.createGame deve agora aceitar este objeto completo
    gameStore.createGame({ ...newGame })
}

const startSinglePlayer = (config = null) => {
    // Se a função for chamada sem argumentos (pelo botão antigo), usa um padrão
    // Se for chamada pelo novo botão, usa o 'config' passado (botGameConfig)
    const settings = config || botGameConfig.value;

    console.log("A iniciar jogo contra Bot com:", settings);
    
    router.push({ 
        name: 'Game', // O nome que deste à rota no router/index.js
        query: { 
            mode: 'bot', 
            type: settings.type, 
            isMatch: settings.isMatch ? 'true' : 'false'
        } 
    });
};

const joinGame = (game) => {
    socketStore.emitJoinGame(game)
}

const startGame = (game) => {
    gameStore.multiplayerGame = game
    router.push({ name: 'multiplayer' })
}

const cancelGame = (game) => {
    // Chamar socket ou store para remover o jogo da fila
}

const refreshLobby = () => {
    socketStore.emitGetGames()
}

onMounted(() => {
    //socketStore.emitGetGames()
})
</script>

<style scoped>
.animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}
</style>