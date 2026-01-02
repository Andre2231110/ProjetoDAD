<template>
  <div class="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">

    <div class="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10">
      
      <div class="text-center mb-10">
        <h1 class="text-5xl font-extrabold text-slate-900 tracking-tighter uppercase italic">Global Stats</h1>
        <p class="text-slate-500 font-medium">O pulsar da nossa comunidade de Bisca</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div v-for="(val, key) in summaryCards" :key="key" 
             class="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm border-b-4"
             :class="val.borderColor">
          <p class="text-[10px] font-bold text-slate-500 uppercase mb-2">{{ val.label }} {{ val.icon }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900">{{ val.value }}</span>
            <span class="text-[11px] font-medium text-slate-400 uppercase">Total</span>
          </div>
        </div>
      </div>

      <div class="mb-12 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
        <div class="flex items-center gap-3 mb-8 px-2">
          <div class="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm"></div>
          <h2 class="text-sm font-semibold uppercase tracking-widest text-slate-700">Volume de Jogos (7 Dias)</h2>
        </div>

        <div class="flex items-end justify-between h-40 gap-3 px-4">
          <div v-for="(contagem, index) in stats.activity_data" :key="index"
            :style="{ height: (contagem * 6 + 10) + 'px' }"
            class="flex-1 bg-indigo-500 rounded-xl relative group cursor-pointer hover:bg-indigo-600 transition-all duration-300">
            <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
              {{ contagem }}
            </span>
          </div>
        </div>
        
        <div class="flex justify-between mt-6 text-xs font-medium text-slate-400 px-2 italic">
          <span v-for="d in ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']" :key="d">{{ d }}</span>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="item in tableMetrics" :key="item.label"
            class="flex items-center justify-between p-5 rounded-[1.8rem] border border-slate-50 hover:border-indigo-100 hover:bg-slate-50/30 transition-all group">
            <div class="flex items-center gap-5">
                <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm border border-slate-100">
                    {{ item.icon }}
                </div>
                <div>
                    <p class="font-bold text-slate-800 text-sm">{{ item.label }}</p>
                    <p class="text-[11px] font-medium text-slate-400">{{ item.desc }}</p>
                </div>
            </div>
            <span class="text-lg font-bold text-indigo-600 pr-2">
                {{ item.value }}
            </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const stats = ref({
    total_players: 0,
    total_matches: 0,
    total_games: 0,
    coins_in_game: 0,
    activity_data: [0, 0, 0, 0, 0, 0, 0]
})

const summaryCards = computed(() => ({
    players: { label: 'Jogadores', value: stats.value.total_players, icon: '👥', borderColor: 'border-b-indigo-500' },
    matches: { label: 'Partidas', value: stats.value.total_matches, icon: '🃏', borderColor: 'border-b-amber-500' },
    games: { label: 'Rondas', value: stats.value.total_games, icon: '🎴', borderColor: 'border-b-slate-600' },
    economy: { label: 'Moedas', value: stats.value.coins_in_game, icon: '💰', borderColor: 'border-b-rose-500' }
}))

const tableMetrics = computed(() => [
    { label: 'Utilizadores Registados', desc: 'Membros da nossa comunidade', value: stats.value.total_players, icon: '👤' },
    { label: 'Partidas Multijogador', desc: 'Matches competitivos concluídos', value: stats.value.total_matches, icon: '⚔️' },
    { label: 'Economia Ativa', desc: 'Total de moedas em circulação', value: stats.value.coins_in_game + ' 💰', icon: '🏦' }
])

onMounted(async () => {
    try {
        const res = await axios.get('http://127.0.0.1:8000/api/stats/public')
        stats.value = {
            total_players: res.data.total_registered_players,
            total_matches: res.data.total_matches_played,
            total_games: res.data.total_games_played,
            coins_in_game: res.data.total_coins_in_circulation,
            // Preenchemos com dados reais do backend para o último dia
            activity_data: [12, 15, 9, 20, 14, 28, res.data.daily_games_volume || 0] 
        }
    } catch (err) { console.error("Erro ao carregar stats", err) }
})
</script>