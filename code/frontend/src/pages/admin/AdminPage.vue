<template>
  <div class="max-w-6xl mx-auto py-10">
    <h2 class="text-4xl font-extrabold text-blue-700 mb-6 text-center">
      Adminsistração de Utilizadores
    </h2>
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
    <!-- Criar Admin -->
    <div class="bg-white border border-blue-200 rounded-xl shadow-lg p-8 mb-12">
      <h3 class="text-2xl font-semibold text-blue-700 mb-6">Criar Novo Administrador</h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            v-model="formData.name"
            type="text"
            placeholder="Nome completo"
            class="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            v-model="formData.nickname"
            type="text"
            placeholder="Nickname"
            class="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            v-model="formData.email"
            type="email"
            placeholder="Email"
            class="border rounded-lg p-3 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            v-model="formData.password"
            type="password"
            placeholder="Palavra-passe"
            class="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            v-model="formData.password_confirmation"
            type="password"
            placeholder="Confirmar Palavra-passe"
            class="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <input
            type="file"
            accept="image/*"
            @change="handleFileChange"
            class="border rounded-lg p-3 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          class="bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg px-8 py-3 mt-4"
        >
          Criar Admin
        </button>

        <p
          v-if="message"
          :class="messageType === 'success' ? 'text-green-600' : 'text-red-600'"
          class="mt-3"
        >
          {{ message }}
        </p>
      </form>
    </div>

    <!-- Filtros -->
    <div class="flex gap-4 mb-6">
      <select
        v-model="selectedType"
        @change="fetchUsers(true)"
        class="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Todos</option>
        <option value="A">Admins</option>
        <option value="P">Players</option>
      </select>

      <select
        v-model="selectedBlocked"
        @change="fetchUsers(true)"
        class="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Todos</option>
        <option value="0">Ativos</option>
        <option value="1">Bloqueados</option>
      </select>
    </div>

    <!-- Tabela -->
    <div class="rounded-xl border border-blue-200 overflow-hidden shadow-lg">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-blue-100 text-blue-800">
            <th class="border px-4 py-2">ID</th>
            <th class="border px-4 py-2">Nickname</th>
            <th class="border px-4 py-2">Nome</th>
            <th class="border px-4 py-2">Email</th>
            <th class="border px-4 py-2">Tipo</th>
            <th class="border px-4 py-2">Estado</th>
            <th class="border px-4 py-2">Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in users" :key="user.id" class="hover:bg-blue-50 transition">
            <td class="border px-4 py-2">{{ user.id }}</td>
            <td class="border px-4 py-2 font-semibold">{{ user.nickname }}</td>
            <td class="border px-4 py-2">{{ user.name }}</td>
            <td class="border px-4 py-2">{{ user.email }}</td>
            <td class="border px-4 py-2">{{ user.type }}</td>

            <td class="border px-4 py-2">
              <span
                :class="user.blocked ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'"
                class="px-3 py-1 rounded-full text-sm font-semibold"
              >
                {{ user.blocked ? 'Bloqueado' : 'Ativo' }}
              </span>
            </td>

            <td class="border px-4 py-2 flex gap-3 justify-center">
              <!-- Toggle Block -->
              <button
                @click="toggleBlocked(user)"
                :class="
                  user.blocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                "
                class="text-white px-4 py-1 rounded-lg transition"
              >
                {{ user.blocked ? 'Desbloquear' : 'Bloquear' }}
              </button>

              <!-- Delete -->
              <button
                @click="deleteUser(user)"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg transition"
              >
                Apagar
              </button>
            </td>
          </tr>

          <tr v-if="!users.length">
            <td colspan="7" class="text-center py-5 text-gray-500">Nenhum usuário encontrado</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
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

const formData = ref({
  name: '',
  nickname: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const avatarFile = ref(null)
const message = ref('')
const messageType = ref('success')

const users = ref([])
const currentPage = ref(1)
const lastPage = ref(1)
const selectedType = ref('')
const selectedBlocked = ref('')

const handleFileChange = (e) => (avatarFile.value = e.target.files[0])

/* ========= CREATE ADMIN ========= */
const handleSubmit = async () => {
  message.value = ''
  if (formData.value.password !== formData.value.password_confirmation) {
    message.value = 'As palavras-passe não coincidem!'
    messageType.value = 'error'
    return
  }

  try {
    const dataToSend = new FormData()
    for (const key in formData.value) dataToSend.append(key, formData.value[key])
    if (avatarFile.value) dataToSend.append('avatar', avatarFile.value)

    const res = await fetch('http://127.0.0.1:8000/api/admin/create-user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiStore.token}` },
      body: dataToSend,
    })

    if (!res.ok) throw new Error('Erro ao criar admin')

    message.value = 'Admin criado com sucesso!'
    messageType.value = 'success'

    formData.value = { name: '', nickname: '', email: '', password: '', password_confirmation: '' }
    avatarFile.value = null

    fetchUsers(true)
  } catch (err) {
    message.value = err.message
    messageType.value = 'error'
  }
}

/* ========= FETCH USERS ========= */
const fetchUsers = async (reset = false) => {
  if (reset) currentPage.value = 1
  const params = new URLSearchParams({
    page: currentPage.value,
    type: selectedType.value,
    blocked: selectedBlocked.value,
  })

  const res = await fetch(`http://127.0.0.1:8000/api/admin/users?${params}`, {
    headers: { Authorization: `Bearer ${apiStore.token}` },
  })

  const data = await res.json()
  users.value = data.data
  currentPage.value = data.meta.current_page
  lastPage.value = data.meta.last_page
}

/* ========= BLOCK / UNBLOCK ========= */
const toggleBlocked = async (user) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${user.id}/toggle-block`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiStore.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blocked: user.blocked ? 0 : 1 }),
    })

    if (!res.ok) throw new Error('Erro ao atualizar status')

    const data = await res.json()
    user.blocked = data.data.blocked
  } catch (err) {
    alert(err.message)
  }
}

/* ========= DELETE USER ========= */
const deleteUser = async (user) => {
  if (!confirm(`Tens a certeza que queres apagar ${user.nickname}?`)) return

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiStore.token}`,
      },
    })

    if (!res.ok) throw new Error('Erro ao apagar utilizador')

    users.value = users.value.filter((u) => u.id !== user.id)
  } catch (err) {
    alert(err.message)
  }
}

/* ========= PAGINATION ========= */
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchUsers()
  }
}

const nextPage = () => {
  if (currentPage.value < lastPage.value) {
    currentPage.value++
    fetchUsers()
  }
}

onMounted(fetchUsers)
</script>
