<template>
  <div class="container mx-auto p-6 space-y-8">
    
    <div class="max-w-[80%] mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
      
      <div class="mb-10 text-center md:text-left">
        <h1 class="text-4xl font-black text-indigo-900 tracking-tight uppercase">O Teu Histórico</h1>
        </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-indigo-600">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p class="font-bold">A carregar as tuas partidas...</p>
      </div>

      <div v-else-if="games?.length === 0" class="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <span class="text-6xl mb-4">📭</span>
        <p class="text-slate-500 font-bold text-lg">Ainda não tens jogos registados.</p>
        <p class="text-slate-400">Vai para o Lobby e começa a jogar!</p>
      </div>

      <div v-else class="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-indigo-50/50">
              <th class="p-5 text-sm font-bold text-indigo-600 uppercase tracking-wider">Data</th>
              <th class="p-5 text-sm font-bold text-indigo-600 uppercase tracking-wider">Variante</th>
              <th class="p-5 text-sm font-bold text-indigo-600 uppercase tracking-wider">Resultado</th>
              <th class="p-5 text-sm font-bold text-indigo-600 uppercase tracking-wider text-center">Pontuação</th>
              <th class="p-5 text-sm font-bold text-indigo-600 uppercase tracking-wider text-right">Duração</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="game in games" :key="game.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-5 text-slate-700 font-medium">{{ formatDate(game.began_at) }}</td>
              <td class="p-5">
                <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase">
                  Bisca de {{ game.type }}
                </span>
              </td>
              <td class="p-5">
                <span v-if="game.player1_points > game.player2_points" 
                      class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-tighter">
                   Vitória
                </span>
                <span v-else 
                      class="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-black uppercase tracking-tighter">
                   Derrota
                </span>
              </td>
              <td class="p-5 text-center font-bold text-slate-700">
                {{ game.player1_points }} <span class="text-slate-300 mx-1">-</span> {{ game.player2_points }}
              </td>
              <td class="p-5 text-right text-slate-500 font-medium">{{ game.total_time }}s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const games = ref([])
const loading = ref(true)

const fetchHistory = async () => {
  try {
    const response = await axios.get('/games') // O teu controller já filtra pelo user!
    games.value = response.data.data
  } catch (error) {
    console.error("Erro ao carregar histórico", error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(fetchHistory)
</script>