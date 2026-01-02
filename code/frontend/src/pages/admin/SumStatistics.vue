<template>
  <div class="max-w-6xl mx-auto py-10">

    <!-- NAVBAR ADMIN -->
    <div class="flex gap-4 justify-center mb-10">
      <RouterLink
        to="/admin/users"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Utilizadores
      </RouterLink>

      <RouterLink
        to="/admin/transacoes"
        class="bg-blue-800 text-white px-6 py-2 rounded-lg"
      >
        Transações
      </RouterLink>

      <RouterLink
        to="/admin/match-partidas"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
      >
        Match Partidas
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
            <th class="border px-4 py-2">Utilizador</th>
            <th class="border px-4 py-2">Tipo</th>
            <th class="border px-4 py-2">Valor</th>
            <th class="border px-4 py-2">Jogo</th>
            <th class="border px-4 py-2">Match</th>
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

            <td class="border px-4 py-2 font-semibold">
              {{ tx.user?.nickname ?? '—' }}
            </td>

            <td class="border px-4 py-2">
              {{ tx.type?.name ?? '—' }}
            </td>

            <td
              class="border px-4 py-2 font-bold"
              :class="tx.amount >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ tx.amount }}
            </td>

            <td class="border px-4 py-2">
              {{ tx.game?.name ?? '—' }}
            </td>

            <td class="border px-4 py-2">
              {{ tx.match?.id ?? '—' }}
            </td>

            <td class="border px-4 py-2">
              {{ tx.transaction_datetime }}
            </td>
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
  const res = await fetch(
    `http://127.0.0.1:8000/api/admin/coins/transactions?page=${currentPage.value}`,
    {
      headers: {
        Authorization: `Bearer ${apiStore.token}`
      }
    }
  )

  const data = await res.json()
  transactions.value = data.data
  currentPage.value = data.meta.current_page
  lastPage.value = data.meta.last_page
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
