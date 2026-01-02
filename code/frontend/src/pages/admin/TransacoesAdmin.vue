<template>
  <div class="max-w-6xl mx-auto py-10">

    <!-- NAVBAR ADMIN -->
    <div class="flex gap-4 justify-center mb-10">
      <RouterLink
        to="/administration"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Utilizadores
      </RouterLink>
      <RouterLink
        to="/admin/history"
        class="bg-blue-800 text-white px-6 py-2 rounded-lg"
      >
        Histórico Jogos
      </RouterLink>

      <RouterLink
        to="/admin/transacoes"
        class="bg-blue-800 text-white px-6 py-2 rounded-lg"
      >
        Transações
      </RouterLink>

      
      <RouterLink
        to="/admin/summary-stats"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Estatisticas
      </RouterLink>
    </div>
    

    <!-- TÍTULO -->
    <h2 class="text-4xl font-extrabold text-blue-700 mb-6 text-center">
      Transações de Moedas
    </h2>

    <!-- TABELA -->
    <div class="rounded-xl border border-blue-200 overflow-hidden shadow-lg">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-blue-100 text-blue-800">
            <th class="border px-4 py-2">ID</th>
            <th class="border px-4 py-2">User ID</th>
            <th class="border px-4 py-2">Tipo ID</th>
            <th class="border px-4 py-2">Valor</th>
            <th class="border px-4 py-2">Game ID</th>
            <th class="border px-4 py-2">Match ID</th>
            <th class="border px-4 py-2">Data</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="tx in transactions"
            :key="tx.id"
            class="hover:bg-blue-50 transition"
          >
            <td class="border px-4 py-2">{{ tx.id }}</td>
            <td class="border px-4 py-2">{{ tx.user_id }}</td>
            <td class="border px-4 py-2">{{ tx.type }}</td>
            <td
              class="border px-4 py-2 font-bold"
              :class="tx.amount >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ tx.amount }}
            </td>
            <td class="border px-4 py-2">{{ tx.game_id ?? '—' }}</td>
            <td class="border px-4 py-2">{{ tx.match_id ?? '—' }}</td>
            <td class="border px-4 py-2">{{ tx.date }}</td>
          </tr>

          <tr v-if="!transactions.length">
            <td colspan="7" class="text-center py-5 text-gray-500">
              Nenhuma transação encontrada
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINAÇÃO -->
    <div class="flex justify-center mt-6 gap-3">
      <button
        @click="prevPage"
        :disabled="currentPage <= 1"
        class="px-5 py-2 border rounded-lg bg-white hover:bg-blue-50 disabled:opacity-50"
      >
        Anterior
      </button>

      <button
        @click="nextPage"
        :disabled="currentPage >= lastPage"
        class="px-5 py-2 border rounded-lg bg-white hover:bg-blue-50 disabled:opacity-50"
      >
        Próxima
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'

const apiStore = useAPIStore()

const transactions = ref([])
const currentPage = ref(1)
const lastPage = ref(1)

const fetchTransactions = async () => {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/admin/coins/transactions?page=${currentPage.value}`,
      {
        headers: {
          Authorization: `Bearer ${apiStore.token}`
        }
      }
    )

    const data = await res.json()
    // A API retorna os dados do Resource com meta para paginação
    transactions.value = data.data
    currentPage.value = data.meta.current_page
    lastPage.value = data.meta.last_page
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchTransactions()
  }
}

const nextPage = () => {
  if (currentPage.value < lastPage.value) {
    currentPage.value++
    fetchTransactions()
  }
}

onMounted(fetchTransactions)
</script>
