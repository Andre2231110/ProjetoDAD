<template>
  <div class="p-6 space-y-6">
    <h1 class="text-3xl font-bold text-purple-600">O Teu Histórico de Bisca 🃏</h1>

    <div v-if="loading" class="text-center">A carregar as tuas vitórias...</div>

    <div v-else-if="games.length === 0" class="text-center text-gray-500">
      Ainda não tens jogos registados. Força, vai jogar! 💪
    </div>

    <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-purple-50">
          <tr>
            <th class="p-4 font-semibold">Data</th>
            <th class="p-4 font-semibold">Tipo</th>
            <th class="p-4 font-semibold">Resultado</th>
            <th class="p-4 font-semibold">Pontos</th>
            <th class="p-4 font-semibold">Tempo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="game in games" :key="game.id" class="border-t hover:bg-gray-50 transition">
            <td class="p-4">{{ formatDate(game.began_at) }}</td>
            <td class="p-4">Bisca de {{ game.type }}</td>
            <td class="p-4">
              <span :class="game.player1_points > game.player2_points ? 'text-green-600 font-bold' : 'text-red-500'">
                {{ game.player1_points > game.player2_points ? 'Vitória' : 'Derrota' }}
              </span>
            </td>
            <td class="p-4">{{ game.player1_points }} - {{ game.player2_points }}</td>
            <td class="p-4">{{ game.total_time }}s</td>
          </tr>
        </tbody>
      </table>
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