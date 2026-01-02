<template>
  <Toaster richColors />

  <nav class="max-w-[75%] w-full mx-auto p-5 flex justify-between items-center bg-white shadow-md rounded-lg">
  <nav class="max-w-[75%] w-full mx-auto p-5 flex justify-between items-center bg-white shadow-md rounded-lg">
    <div class="flex items-center gap-4">
      <RouterLink to="/" class="text-2xl font-extrabold text-indigo-600 hover:text-indigo-800">
        Página Inicial 🎴
      </RouterLink>

      <!-- Botão Lobby -->
      <RouterLink v-if="authStore.isLoggedIn" to="/lobby"
        class="ml-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
      <RouterLink v-if="authStore.isLoggedIn" to="/lobby"
        class="ml-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
        🃏 Jogar
      </RouterLink>
    </div>
    <div class="flex items-center gap-6">
      <div v-if="authStore.isLoggedIn" class="flex items-center">
        <RouterLink v-if="authStore.currentUser?.type === 'A'" to="/admin/history"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <span>Gestão de Históricos </span>
        </RouterLink>
        <RouterLink v-else to="/history"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <span>O Meu Histórico</span>
        </RouterLink>
        <RouterLink to="/ranking"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300">
          <span>Leaderboards</span>
        </RouterLink>

        <RouterLink to="/shop"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300">
          <span>Loja</span>
        </RouterLink>

        <RouterLink v-if="authStore.currentUser?.type === 'A'" to="/administration"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300">
          <span>Administração</span>
        </RouterLink>

        <div class="h-8 w-[1px] bg-slate-200 mx-4"></div>

        <div class="flex items-center gap-6">

          <RouterLink to="/profile" class="group flex items-center gap-3">
            <div class="relative">
              <img :src="computedAvatar" alt="Avatar"
                class="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-indigo-500 object-cover transition-all shadow-sm" />
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div class="flex flex-col items-start leading-tight">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Jogador</span>
              <span class="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                {{ authStore.currentUser?.name }}
              </span>
            </div>
          </RouterLink>

          <div class="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
            <span class="text-lg">💰</span>
            <div class="flex flex-col leading-none">
              <span class="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Saldo</span>
              <span class="font-bold text-indigo-700 text-sm">
                {{ authStore.currentUser?.coins_balance ?? 0 }}
              </span>
            </div>
          </div>

        </div>

        <button @click="handleLogout"
          class="ml-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
          title="Sair da conta">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 cursor-pointer" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <RouterLink v-else to="/login"
        class="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold shadow-lg shadow-green-200 hover:scale-105 transition-all">
        Entrar
      </RouterLink>
    </div>
  </nav>

  <main class="w-[95%] mx-auto py-8">
    <RouterView />
  </main>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'
import { onMounted, computed } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useSocketStore } from '@/stores/socket'

const socketStore = useSocketStore()
const authStore = useAuthStore()
const apiStore = useAPIStore()

const API_URL = 'http://127.0.0.1:8000'

// Carregar token ao montar a app
onMounted(async () => {
  const savedToken = localStorage.getItem('token')
  if (savedToken) {
    apiStore.token = savedToken
    await authStore.getUser()
  }
  socketStore.handleConnection()
  socketStore.handleGameEvents()

  if (authStore.currentUser) {
    socketStore.emitJoin(authStore.currentUser)
  }
})

const computedAvatar = computed(() => {
  const avatar = authStore.currentUser?.current_avatar
  if (!avatar) return '/default.jpg'
  return `${API_URL}/storage/photos_avatars/${avatar}`
})

// Função de logout
const handleLogout = () => {
  toast.promise(authStore.logout(), {
    loading: 'A fazer logout...',
    success: () => {
      localStorage.removeItem('token') // Limpa o token
      return 'Logout efetuado com sucesso!'
    },
    error: 'Erro ao fazer logout',
  })
}
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}
</style>
