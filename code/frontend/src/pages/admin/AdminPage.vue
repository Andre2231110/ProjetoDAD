<template>
  <div
    class="container mx-auto p-6 flex flex-col min-h-[90vh] items-center justify-start space-y-10"
  >
    <!-- Criar Admin -->
    <div
      class="w-full max-w-[80%] bg-white rounded-3xl shadow-xl border border-slate-100 p-10 space-y-8"
    >
      <div class="text-center md:text-left">
        <h2 class="text-4xl font-black text-indigo-900 tracking-tight uppercase">Criar Admin</h2>
        <p class="mt-2 text-sm font-medium text-slate-400">
          Crie uma nova conta de administrador para gerir a aplicação.
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Nome Completo</label>
            <input
              v-model="formData.name"
              type="text"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="Nome completo"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Nickname</label>
            <input
              v-model="formData.nickname"
              type="text"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="Nickname"
            />
          </div>
          <div class="md:col-span-2 space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Email</label>
            <input
              v-model="formData.email"
              type="email"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="email@dominio.com"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1">Palavra-passe</label>
            <input
              v-model="formData.password"
              type="password"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="••••••••"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1"
              >Confirmar Palavra-passe</label
            >
            <input
              v-model="formData.password_confirmation"
              type="password"
              class="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              required
              placeholder="••••••••"
            />
          </div>
          <div class="md:col-span-2 space-y-1">
            <label class="block text-base font-bold text-indigo-600 ml-1"
              >Foto de Perfil (Opcional)</label
            >
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 h-auto p-2"
            />
          </div>
        </div>

        <div class="pt-6">
          <button
            type="submit"
            class="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-100 rounded-xl transition-all active:scale-95 uppercase tracking-widest cursor-pointer"
          >
            Criar Admin
          </button>
        </div>

        <p
          v-if="message"
          :class="messageType === 'success' ? 'text-green-600 mt-2' : 'text-red-600 mt-2'"
        >
          {{ message }}
        </p>
      </form>
    </div>

    <!-- Lista de Usuários -->
    <div
      class="w-full max-w-[80%] bg-white rounded-3xl shadow-xl border border-slate-100 p-10 space-y-4"
    >
      <h2 class="text-3xl font-black text-indigo-900 tracking-tight uppercase">Usuários</h2>

      <p v-if="usersStore.error" class="text-red-500">{{ usersStore.error }}</p>
      <div v-if="usersStore.loading" class="my-4">Carregando usuários...</div>

      <table v-else class="w-full table-auto border-collapse border border-gray-200 mt-4">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-4 py-2">Avatar</th>
            <th class="border px-4 py-2">Nickname</th>
            <th class="border px-4 py-2">Nome</th>
            <th class="border px-4 py-2">Email</th>
            <th class="border px-4 py-2">Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersStore.users" :key="user.id" class="hover:bg-gray-50">
            <td class="border px-4 py-2">
              <img
                v-if="user.current_avatar"
                :src="storageUrl(user.current_avatar)"
                alt="Avatar"
                class="w-10 h-10 rounded-full object-cover"
              />
            </td>
            <td class="border px-4 py-2">{{ user.nickname }}</td>
            <td class="border px-4 py-2">{{ user.name }}</td>
            <td class="border px-4 py-2">{{ user.email }}</td>
            <td class="border px-4 py-2">{{ user.type }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Paginação -->
      <div class="flex justify-between mt-4">
        <button
          class="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          :disabled="!usersStore.meta?.current_page || usersStore.meta?.current_page <= 1"
          @click="fetchPage((usersStore.meta?.current_page || 1) - 1)"
        >
          Anterior
        </button>

        <button
          class="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          :disabled="
            !usersStore.meta?.current_page ||
            usersStore.meta?.current_page >= (usersStore.meta?.last_page || 1)
          "
          @click="fetchPage((usersStore.meta?.current_page || 1) + 1)"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'
import { useUsersStore } from '@/stores/users'

const api = useAPIStore()
const usersStore = useUsersStore()

// Funções de criação de admin
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

const handleFileChange = (e) => (avatarFile.value = e.target.files[0])

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
      headers: { Authorization: `Bearer ${api.token}` },
      body: dataToSend,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Erro ao criar admin')
    }

    message.value = 'Admin criado com sucesso!'
    messageType.value = 'success'
    formData.value = { name: '', nickname: '', email: '', password: '', password_confirmation: '' }
    avatarFile.value = null

    // Atualiza lista de usuários
    usersStore.fetchUsers()
  } catch (err) {
    message.value = err.message
    messageType.value = 'error'
  }
}

// Funções de usuários
const fetchPage = (page) => {
  usersStore.fetchUsers(page)
}
const storageUrl = (path) =>
  path ? `${import.meta.env.VITE_APP_STORAGE_URL || '/storage'}/${path}` : ''

onMounted(() => {
  usersStore.fetchUsers()
})
</script>
