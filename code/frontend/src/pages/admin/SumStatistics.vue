<template>
  <div class="max-w-6xl mx-auto py-10">
    <h2 class="text-4xl font-extrabold text-blue-700 mb-8 text-center">Dashboard Administrativo</h2>

    <!-- NAVBAR ADMIN -->
    <div class="flex gap-4 justify-center mb-10">
      <RouterLink
        to="/administration"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Utilizadores
      </RouterLink>
      <RouterLink to="/admin/history" class="bg-blue-800 text-white px-6 py-2 rounded-lg">
        Histórico Jogos
      </RouterLink>

      <RouterLink to="/admin/transacoes" class="bg-blue-800 text-white px-6 py-2 rounded-lg">
        Transações
      </RouterLink>

      <RouterLink
        to="/admin/summary-stats"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Estatísticas
      </RouterLink>
    </div>

    <!-- RESUMO GERAL -->
    <div class="grid grid-cols-4 gap-6 mb-10">
      <div class="p-6 bg-blue-100 rounded-xl text-center shadow">
        <h3 class="text-xl font-semibold mb-2">Utilizadores</h3>
        <p class="text-3xl font-bold text-blue-700">{{ stats.summary.total_users || 0 }}</p>
      </div>
      <div class="p-6 bg-green-100 rounded-xl text-center shadow">
        <h3 class="text-xl font-semibold mb-2">Jogos</h3>
        <p class="text-3xl font-bold text-green-700">{{ stats.summary.total_games || 0 }}</p>
      </div>
      <div class="p-6 bg-yellow-100 rounded-xl text-center shadow">
        <h3 class="text-xl font-semibold mb-2">Compras</h3>
        <p class="text-3xl font-bold text-yellow-700">
          {{ stats.summary.total_coin_purchases || 0 }}
        </p>
      </div>
      <div class="p-6 bg-purple-100 rounded-xl text-center shadow">
        <h3 class="text-xl font-semibold mb-2">Receita (€)</h3>
        <p class="text-3xl font-bold text-purple-700">
          {{ stats.summary.total_revenue_euros?.toFixed(2) || '0.00' }}
        </p>
      </div>
    </div>

    <!-- GRÁFICOS -->
    <div class="mb-10">
      <h3 class="text-2xl font-semibold mb-4">Compras por Dia</h3>
      <canvas id="purchasesByDayChart" height="100"></canvas>
    </div>

    <div class="mb-10">
      <h3 class="text-2xl font-semibold mb-4">Coins Ganhos por Dia</h3>
      <canvas id="coinsByDayChart" height="100"></canvas>
    </div>

    <div class="mb-10">
      <h3 class="text-2xl font-semibold mb-4">Vitórias por Dia</h3>
      <canvas id="winsByDayChart" height="100"></canvas>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'
import Chart from 'chart.js/auto'

const apiStore = useAPIStore()

const stats = ref({
  summary: {},
  purchases_by_user: [],
  coins_by_user: [],
  games_by_player: [],
  purchases_by_day: [],
})

const API_BASE = `http://${import.meta.env.VITE_API_DOMAIN}/api/admin`

const fetchStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${apiStore.token}` },
    })
    const data = await res.json()
    stats.value = data
    renderCharts()
  } catch (err) {
    console.error('Erro ao buscar stats:', err)
  }
}


const renderCharts = () => {
  // ----------- Compras por Dia -----------
  if (stats.value.purchases_by_day.length) {
    const purchasesMap = {}
    stats.value.purchases_by_day.forEach(p => { purchasesMap[p.day] = p })

    const purchasesAllDates = []
    const startDate = new Date(stats.value.purchases_by_day[0].day)
    const endDate = new Date(stats.value.purchases_by_day[stats.value.purchases_by_day.length - 1].day)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) purchasesAllDates.push(new Date(d))

    const purchasesLabels = purchasesAllDates.map(d => d.toLocaleDateString())
    const purchasesCountData = purchasesAllDates.map(d => {
      const key = d.toISOString().split('T')[0]
      return purchasesMap[key]?.purchases_count || 0
    })
    const totalSpentData = purchasesAllDates.map(d => {
      const key = d.toISOString().split('T')[0]
      return purchasesMap[key]?.total_spent || 0
    })

    new Chart(document.getElementById('purchasesByDayChart'), {
      type: 'line',
      data: {
        labels: purchasesLabels,
        datasets: [
          {
            label: 'Número de Compras',
            data: purchasesCountData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Total Gasto (€)',
            data: totalSpentData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Compras' } },
          y1: { type: 'linear', position: 'right', title: { display: true, text: '€ Gasto' }, grid: { drawOnChartArea: false } }
        }
      }
    })
  }

  // ----------- Coins por Dia -----------
  if (stats.value.coins_by_day.length) {
    const coinsMap = {}
    stats.value.coins_by_day.forEach(c => { coinsMap[c.day] = c.coins_total })

    const coinsAllDates = []
    const startDate = new Date(stats.value.coins_by_day[0].day)
    const endDate = new Date(stats.value.coins_by_day[stats.value.coins_by_day.length - 1].day)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) coinsAllDates.push(new Date(d))

    const coinsLabels = coinsAllDates.map(d => d.toLocaleDateString())
    const coinsData = coinsAllDates.map(d => {
      const key = d.toISOString().split('T')[0]
      return coinsMap[key] || 0
    })

    new Chart(document.getElementById('coinsByDayChart'), {
      type: 'line',
      data: {
        labels: coinsLabels,
        datasets: [
          {
            label: 'Coins Ganhos',
            data: coinsData,
            borderColor: '#facc15',
            backgroundColor: 'rgba(250, 204, 21, 0.2)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: { y: { type: 'linear', position: 'left', title: { display: true, text: 'Coins' } } }
      }
    })
  }

  // ----------- Vitórias por Dia -----------
  if (stats.value.games_won_by_day.length) {
    const winsMap = {}
    stats.value.games_won_by_day.forEach(g => { winsMap[g.day] = g.wins })

    const winsAllDates = []
    const startDate = new Date(stats.value.games_won_by_day[0].day)
    const endDate = new Date(stats.value.games_won_by_day[stats.value.games_won_by_day.length - 1].day)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) winsAllDates.push(new Date(d))

    const winsLabels = winsAllDates.map(d => d.toLocaleDateString())
    const winsData = winsAllDates.map(d => {
      const key = d.toISOString().split('T')[0]
      return winsMap[key] || 0
    })

    new Chart(document.getElementById('winsByDayChart'), {
      type: 'line',
      data: {
        labels: winsLabels,
        datasets: [
          {
            label: 'Vitórias por Dia',
            data: winsData,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.2)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: { y: { type: 'linear', position: 'left', title: { display: true, text: 'Vitórias' } } }
      }
    })
  }
}

onMounted(fetchStats)
</script>
