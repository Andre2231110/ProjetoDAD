<template>
    <div class="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">

        <div v-if="authStore.isLoggedIn && personalStats" class="max-w-5xl mx-auto mb-12">
            <div class="bg-slate-100/80 border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
                <div class="flex items-center justify-between mb-6 px-2">
                    <div class="flex items-center gap-3">
                        <div class="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                        <h2 class="text-xs font-black uppercase tracking-[0.2em] text-slate-600">As Tuas Estatísticas Pessoais</h2>
                    </div>
                    <div class="flex items-center gap-2 bg-indigo-50 px-5 py-2.5 rounded-2xl border-2 border-indigo-100 shadow-sm">
                        <span class="text-[10px] font-black text-indigo-400 uppercase tracking-wider">A Tua Posição Global:</span>
                        <span class="text-xl font-black text-indigo-700 tracking-tighter">#{{ personalStats.position }}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-b-4 border-b-indigo-500">
                        <p class="text-[10px] font-black text-slate-500 uppercase mb-2">Jogos Ganhos</p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-black text-indigo-900">{{ personalStats.game_wins }}</span>
                            <span class="text-[11px] font-extrabold text-indigo-500 uppercase">Games</span>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-b-4 border-b-amber-500">
                        <p class="text-[10px] font-black text-slate-500 uppercase mb-2">Matches Ganhos</p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-black text-amber-600">{{ personalStats.match_wins }}</span>
                            <span class="text-[11px] font-extrabold text-amber-500 uppercase">Wins</span>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-b-4 border-b-slate-600">
                        <p class="text-[10px] font-black text-slate-500 uppercase mb-2">Capotes Dados 🧥</p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-black text-slate-800">{{ personalStats.capotes }}</span>
                            <span class="text-[11px] font-extrabold text-slate-400 uppercase">Dados</span>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-b-4 border-b-rose-500">
                        <p class="text-[10px] font-black text-rose-700 uppercase mb-2">Bandeiras 🚩</p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-3xl font-black text-slate-800">{{ personalStats.bandeiras }}</span>
                            <span class="text-[11px] font-extrabold text-rose-500">Total</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10">
            <div class="text-center mb-10">
                <h1 class="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Global Rankings</h1>
                <p class="text-slate-400 font-bold">Os melhores mestres da Bisca do mundo</p>
            </div>

            <div class="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
                <div class="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button v-for="v in [null, '3', '9']" :key="v" @click="changeVariant(v)"
                        :class="selectedVariant === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'"
                        class="px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all">
                        {{ v === null ? 'Geral' : 'Bisca ' + v }}
                    </button>
                </div>
                <div class="flex bg-indigo-50 p-1.5 rounded-2xl border border-indigo-100">
                    <button @click="currentTab = 'wins'" 
                        :class="currentTab === 'wins' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400'"
                        class="px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all">🏆 Jogos</button>
                    <button @click="currentTab = 'matches'" 
                        :class="currentTab === 'matches' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400'"
                        class="px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all">🔥 Matches</button>
                </div>
            </div>

            <div v-if="loading" class="text-center py-20 animate-pulse text-slate-400">A carregar o pódio...</div>
            <div v-else class="space-y-4">
                <div v-for="(player, index) in activeRanking" :key="player.id"
                    class="flex items-center justify-between p-6 rounded-[2rem] border-2 border-slate-50 hover:border-indigo-100 transition-all bg-white shadow-sm group">
                    <div class="flex items-center gap-6">
                        <span class="text-2xl font-black w-8 text-center" :class="index < 3 ? 'text-amber-500' : 'text-slate-300'">
                            {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1) }}
                        </span>
                        <div class="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden shadow-sm border border-slate-100">
                            <img :src="player.photo_avatar_filename ? `http://${import.meta.env.VITE_API_DOMAIN}/storage/photos_avatars/` + player.photo_avatar_filename : '/default.jpg'"
                                class="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p class="font-black text-slate-900 uppercase italic">{{ player.nickname }}</p>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                🧥 Capotes: {{ player.capote_count }} | 🚩 Bandeiras: {{ player.bandeira_count }}
                            </p>
                        </div>
                    </div>
                    <div class="bg-indigo-50 px-6 py-3 rounded-2xl font-black text-indigo-600 uppercase text-xs">
                        {{ currentTab === 'wins' ? (player.total_wins || 0) + ' Vitórias' : (player.total_matches || 0) + ' Matches' }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import axios from 'axios'

const authStore = useAuthStore()
const apiStore = useAPIStore()

const loading = ref(true)
const rankings = ref({ by_wins: [], by_matches: [] })
const personalStats = ref(null)
const selectedVariant = ref(null)
const currentTab = ref('wins')

const changeVariant = (variant) => {
    selectedVariant.value = variant
    fetchGlobal()
}

const fetchGlobal = async () => {
    loading.value = true
    try {
        const url = `http://${import.meta.env.VITE_API_DOMAIN}/api/ranking/global${selectedVariant.value ? '?variant=' + selectedVariant.value : ''}`
        const res = await axios.get(url)
        rankings.value.by_wins = res.data.by_wins || []
        rankings.value.by_matches = res.data.by_matches || []
    } catch (err) {
        console.error("Erro no Global:", err)
    } finally {
        loading.value = false
    }
}

const fetchPersonal = async () => {
    if (!authStore.isLoggedIn) return
    try {
        const res = await axios.get(`http://${import.meta.env.VITE_API_DOMAIN}/api/ranking/personal`, {
            headers: {
                'Authorization': `Bearer ${apiStore.token}`,
                'Accept': 'application/json'
            }
        })
        personalStats.value = res.data
    } catch (err) {
        console.error("Erro no Personal:", err)
    }
}

const activeRanking = computed(() => {
    return currentTab.value === 'wins' ? rankings.value.by_wins : rankings.value.by_matches
})

onMounted(() => {
    fetchGlobal()
    fetchPersonal()
})
</script>