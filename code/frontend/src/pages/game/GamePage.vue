<template>
    <!-- Container Principal -->
    <div class="h-screen w-full bg-emerald-800 flex flex-col overflow-hidden relative select-none">

        <!-- 1. HEADER -->
        <header
            class="h-14 bg-emerald-900/80 flex items-center justify-between px-4 text-white shadow-md z-20 shrink-0">
            <div class="flex items-center gap-3">
                <button class="text-white/80 hover:text-white hover:bg-white/10 px-3 py-1 rounded transition"
                    @click="handleExit">
                    <span class="mr-1">⬅</span> Sair
                </button>
                <div class="hidden md:flex flex-col leading-tight">
                    <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Modo</span>
                    <span class="text-xs font-bold">{{ isMultiplayer ? 'Multiplayer' : 'Bot' }} (Bisca de {{ gameType
                        }})</span>
                </div>
            </div>

            <!-- Placar -->
            <div class="absolute left-1/2 -translate-x-1/2 ...">
                <div class="flex items-center gap-6 ...">
                    <div class="text-red-300 flex flex-col items-center leading-none">
                        <span>{{ gameStore.opponentPoints }}</span>
                        <span class="text-[8px] opacity-60 font-normal tracking-normal">
                            {{ isMultiplayer ? 'OPONENTE' : 'BOT' }}
                        </span>
                    </div>
                    <div class="text-white/30 text-sm">vs</div>
                    <div class="text-blue-300 flex flex-col items-center leading-none">
                        <span>{{ gameStore.myPoints }}</span>
                        <span class="text-[8px] ...">{{ authStore.currentUser?.nickname || 'Eu' }}</span>
                    </div>

                </div>
            </div>

            <!-- Avatar -->
            <div class="flex items-center gap-2">
                <div class="text-right leading-tight hidden sm:block">
                    <p class="font-bold text-xs">{{ authStore.currentUser?.nickname || 'Eu' }}</p>
                </div>

                <div class="w-8 h-8 bg-indigo-500 rounded-full border border-white/50 flex items-center justify-center font-bold text-sm overflow-hidden relative">

                    <img v-if="userAvatarSrc"
                         :src="userAvatarSrc"
                         alt="Avatar"
                         class="w-full h-full object-cover"
                         @error="(e) => e.target.style.display='none'" />

                    <span v-else>
                        {{ (authStore.currentUser?.nickname || 'E').charAt(0) }}
                    </span>

                </div>
            </div>
        </header>

        <!-- 2. ÁREA DE JOGO -->
        <main class="flex-1 flex flex-col relative w-full max-w-6xl mx-auto">

            <!-- ZONA SUPERIOR: Oponente -->
            <div class="h-1/4 flex items-start justify-center pt-4 relative">
                <div class="absolute top-2 flex flex-col items-center opacity-60 z-0">
                    <div
                        class="w-10 h-10 bg-red-600 rounded-full border-2 border-white/30 flex items-center justify-center font-bold text-white shadow-lg">
                        OP
                    </div>
                </div>

                <!-- Mão do Oponente (Costas com deck personalizado) -->
                <div class="flex items-center justify-center -space-x-8 z-10 mt-8">
                    <img v-for="n in gameStore.botHand.length" :key="n" :src="currentDeckBack"
                        class="h-24 md:h-28 object-contain drop-shadow-lg" />
                </div>
            </div>

            <!-- ZONA CENTRAL: Mesa, Baralho e Trunfo -->
            <div class="h-2/4 flex items-center justify-center relative w-full">

                <!-- Baralho e Trunfo -->
                <div class="absolute left-4 md:left-20 lg:left-32 flex items-center group">

                    <!-- Trunfo -->
                    <div v-if="gameStore.trumpCard && gameStore.deck.length > 0"
                        class="absolute transform rotate-90 translate-x-6 md:translate-x-8 transition-transform group-hover:translate-x-10">
                        <img :src="getCardSrc(gameStore.trumpCard)"
                            class="h-24 md:h-32 object-contain rounded shadow-md brightness-90" />
                    </div>

                    <!-- Baralho (com deck personalizado) -->
                    <div v-if="gameStore.deck.length > 0" class="relative z-10 cursor-pointer">
                        <img :src="currentDeckBack"
                            class="h-24 md:h-32 object-contain rounded shadow-2xl border border-white/10" />
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span
                                class="bg-black/60 text-white font-bold text-sm px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                                {{ gameStore.deck.length }}
                            </span>
                        </div>
                    </div>
                    <div v-else
                        class="h-24 md:h-32 w-16 border-2 border-white/5 rounded border-dashed flex items-center justify-center opacity-20">
                        <span class="text-[10px] text-white uppercase">Fim</span>
                    </div>
                </div>

                <!-- VAZA (Cartas na mesa) -->
                <div class="flex gap-4 md:gap-12 items-center justify-center z-10">
                    <!-- Slot 1 -->
                    <div
                        class="relative w-24 h-36 md:w-28 md:h-40 flex items-center justify-center transition-all duration-300">
                        <img v-if="gameStore.tableCards[0]" :src="getCardSrc(gameStore.tableCards[0])"
                            class="h-full object-contain drop-shadow-2xl animate-in" />
                        <div v-else class="w-20 h-32 border-2 border-white/5 rounded-lg border-dashed"></div>
                    </div>
                    <!-- Slot 2 -->
                    <div
                        class="relative w-24 h-36 md:w-28 md:h-40 flex items-center justify-center transition-all duration-300">
                        <img v-if="gameStore.tableCards[1]" :src="getCardSrc(gameStore.tableCards[1])"
                            class="h-full object-contain drop-shadow-2xl animate-in" />
                        <div v-else class="w-20 h-32 border-2 border-white/5 rounded-lg border-dashed"></div>
                    </div>
                </div>
            </div>

            <!-- ZONA INFERIOR: Minha Mão -->
            <div class="h-1/4 flex items-end justify-center pb-2 md:pb-6 relative px-4">

                <!-- 2. Timer (fica entre o aviso de turno e as cartas) -->
                <div v-if="isMultiplayer && !gameStore.isGameComplete"
                    class="absolute bottom-40 md:bottom-52 left-1/2 -translate-x-1/2 w-64 z-20">
                    <div class="flex justify-between text-xs text-white font-bold mb-1 shadow-black drop-shadow-md">
                        <span>Tempo Restante</span>
                        <span :class="timeLeft < 5 ? 'text-red-500 animate-ping' : 'text-white'">{{ timeLeft }}s</span>
                    </div>
                    <div class="h-2 bg-gray-700 rounded-full overflow-hidden border border-white/20">
                        <div class="h-full transition-all duration-1000 ease-linear"
                            :class="timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-400'"
                            :style="{ width: (timeLeft / 20 * 100) + '%' }">
                        </div>
                    </div>
                </div>

                <!-- Bloqueio visual se não for a minha vez -->
                <div class="flex -space-x-8 md:-space-x-6 hover:-space-x-2 transition-all duration-300 ease-out h-full items-end"
                    :class="{ 'opacity-60 pointer-events-none grayscale-[0.5]': gameStore.currentTurn !== 'me' }">

                    <div v-for="card in gameStore.myHand" :key="card.id" @click="gameStore.playCard(card)"
                        class="relative group cursor-pointer transform hover:-translate-y-8 hover:scale-110 transition-all duration-200 z-10 hover:z-50">
                        <img :src="getCardSrc(card)" class="h-32 md:h-44 object-contain drop-shadow-xl rounded-lg"
                            alt="Carta" />
                    </div>
                </div>

                <!-- Aviso de turno -->
                <div v-if="gameStore.currentTurn !== 'me' && !gameStore.isGameComplete"
                    class="absolute bottom-32 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur animate-pulse border border-white/10">
                    {{ gameStore.isMultiplayer ? ' Oponente a jogar...' : 'Bot a pensar...' }}
                </div>
            </div>

        </main>

        <!-- MODAL DE FIM DE JOGO -->
        <div v-if="gameStore.isGameComplete"
            class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

            <div
                class="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">

                <!-- Efeito de Fundo (Brilho) -->
                <div class="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none">
                </div>
                <div v-if="gameStore.resignedBy"
                    class="mb-4 p-3 rounded bg-red-900/50 border border-red-500 text-center animate-pulse">
                    <p class="text-white font-bold text-lg">
                        ⛔ JOGO TERMINADO POR DESISTÊNCIA
                    </p>
                    <p class="text-sm text-red-200">
                        {{ gameStore.resignedBy == authStore.currentUser.id
                            ? 'Tu desististe da partida.'
                            : 'O oponente abandonou o jogo.' }}
                    </p>
                </div>

                <!-- Título: Resultado do Jogo -->
                <h2 class="text-3xl font-black mb-2 uppercase tracking-widest"
                    :class="gameStore.myPoints > gameStore.opponentPoints ? 'text-yellow-400' : 'text-red-400'">
                    {{ gameStore.myPoints > gameStore.opponentPoints ? 'Vitória!' : (gameStore.myPoints ==
                        gameStore.opponentPoints ? 'Empate' : 'Derrota') }}
                </h2>

                <!-- Detalhes dos Pontos -->
                <div class="flex justify-center gap-8 my-6 text-white">
                    <div class="flex flex-col">
                        <span class="text-xs text-gray-400 uppercase font-bold">Teus Pontos</span>
                        <span class="text-4xl font-bold">{{ gameStore.myPoints }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs text-gray-400 uppercase font-bold">Bot Pontos</span>
                        <span class="text-4xl font-bold">{{ gameStore.opponentPoints }}</span>
                    </div>
                </div>

                <!-- SE FOR MODO PARTIDA (MATCH) -->
                <div v-if="gameStore.isMatchMode" class="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                    <p class="text-xs text-emerald-400 font-bold uppercase mb-3 tracking-widest">Placar da Partida
                        (Marcas)</p>

                    <div class="flex items-center justify-between px-4">
                        <div class="flex gap-1">
                            <div v-for="n in 4" :key="n"
                                class="w-4 h-4 rounded-full border border-yellow-500/50 transition-all duration-500"
                                :class="n <= gameStore.myMarks ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-transparent'">
                            </div>
                        </div>

                        <span class="text-white/20 font-bold text-xs">VS</span>

                        <div class="flex gap-1 flex-row-reverse">
                            <div v-for="n in 4" :key="n"
                                class="w-4 h-4 rounded-full border border-red-500/50 transition-all duration-500"
                                :class="n <= gameStore.opponentMarks ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-transparent'">
                            </div>
                        </div>
                    </div>

                    <div v-if="gameStore.matchWinner" class="mt-4 pt-4 border-t border-white/10">
                        <span class="text-xl font-bold uppercase animate-pulse"
                            :class="gameStore.matchWinner === 'me' ? 'text-yellow-400' : 'text-red-500'">
                            {{ gameStore.matchWinner === 'me' ? '🏆 Vencedor da Partida! 🏆' : '💀 Perdeste a Partida💀'
                            }}
                        </span>
                    </div>
                </div>

                <!-- BOTÕES DE AÇÃO -->
                <div class="flex flex-col gap-3 mt-4 relative z-10">
                    <button v-if="gameStore.isMatchMode && !gameStore.matchWinner" @click="nextGame"
                        class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition transform hover:scale-[1.02]">
                        Próximo Jogo da Partida ➔
                    </button>

                    <button @click="voltarLobby" class="w-full py-3 rounded-xl font-bold transition text-white"
                        :class="(gameStore.isMatchMode && !gameStore.matchWinner) ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-700 hover:bg-gray-600'">
                        {{ gameStore.isMatchMode && !gameStore.matchWinner ? 'Sair da Partida (Desistir)' : 'Voltar ao Lobby' }}
                    </button>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGameStore } from '@/stores/game';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const gameStore = useGameStore();
const authStore = useAuthStore();

// Parâmetros da URL
const gameType = computed(() => route.query.type || '3');
const isMultiplayer = computed(() => route.query.mode === 'multiplayer');
const isMatch = computed(() => route.query.isMatch === 'true');

const timeLeft = ref(20)
let timerInterval = null

// Computed para o verso do deck personalizado
const currentDeckBack = computed(() => {
    const deckResource = authStore.currentUser?.current_deck
    if (!deckResource || deckResource === 'deck1_preview') {
        return '/cards/semFace.png'
    }

    const jpgDecks = ['deck2_preview', 'deck6_preview', 'deck7_preview']
    const extension = jpgDecks.includes(deckResource) ? 'jpg' : 'png'

    return `/assets/${deckResource}.${extension}`
})


// --- LÓGICA DO AVATAR ---

const API_URL =  'http://127.0.0.1:8000'

const getAssetUrl = (resourceName) => {
  const jpgFiles = [
    'avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5',
    'avatar6', 'avatar7', 'avatar8', 'avatar14', 'avatar16'
  ]
  if (jpgFiles.includes(resourceName)) return `/assets/${resourceName}.jpg`
  return `/assets/${resourceName}.png`
}

const userAvatarSrc = computed(() => {
  const avatar = authStore.currentUser?.current_avatar
  if (!avatar) return null

  // Se for um resource do inventário
  if (avatar.startsWith('avatar') || avatar.startsWith('default_')) {
    return getAssetUrl(avatar)
  }

  // Se for upload personalizado (foto do PC)
  return `${API_URL}/storage/photos_avatars/${avatar}`
})

const resetVisualTimer = () => {
    clearInterval(timerInterval)
    timeLeft.value = 20

    if (gameStore.isGameComplete) return

    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--
        } else {
            clearInterval(timerInterval)
        }
    }, 1000)
}

// Observar mudança de turno
watch(() => gameStore.currentTurn, () => {
    if (isMultiplayer.value) {
        resetVisualTimer()
    }
})

// Helper de Imagem
const getCardSrc = (card) => {
    if (!card || !card.imageName) return '';
    return `/cards/${card.imageName}`;
};

// Botão "Próximo Jogo"
const nextGame = () => {
    const cardsToDeal = gameType.value === '9' ? 9 : 3;
    gameStore.nextGameInMatch(cardsToDeal);
};

// Executar saída
const executeExit = () => {
    gameStore.leaveGame();

    if (authStore.isLoggedIn) {
        router.push('/lobby');
    } else {
        router.push({ name: 'HomePage' });
    }
};

const voltarLobby = () => {
    gameStore.clearLocalState();
    if (authStore.isLoggedIn) {
        router.push('/lobby');
    } else {
        router.push({ name: 'HomePage' });
    }
}

// Botão "Sair" (Header)
const handleExit = () => {
    const isOngoing = gameStore.isMultiplayer && !gameStore.matchWinner;

    if (isOngoing) {
        if (confirm("⚠️ Estás a meio de um jogo! Se saíres, vais desistir e perder as moedas. Confirmas?")) {
            executeExit();
        }
    } else {
        executeExit();
    }
};

// Limpar ao sair
onUnmounted(() => {
    gameStore.leaveGame();
    clearInterval(timerInterval)
});

onMounted(() => {
    if (!isMultiplayer.value) {
        const cardsToDeal = gameType.value === '9' ? 9 : 3;

        if (gameStore.myHand.length === 0) {
            gameStore.startGameLocal(cardsToDeal, isMatch.value);
        }
    } else {
        if (gameStore.myHand.length === 0 && gameStore.deck.length === 0) {
            alert("Erro ao carregar jogo. A voltar ao lobby.");
            router.push('/lobby');
        }
    }

    if (isMultiplayer.value) resetVisualTimer()
});
</script>

<style scoped>
@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.5);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-in {
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
