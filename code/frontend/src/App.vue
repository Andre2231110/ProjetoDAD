<template>
  <Toaster richColors />

  <nav class="max-w-[85%] w-full mx-auto p-5 flex justify-between items-center bg-white shadow-md rounded-[2rem] mt-4 border border-slate-100">
    
    <div class="flex items-center gap-4">
      <RouterLink to="/"
        class="text-2xl font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors tracking-tighter italic">
        Bisca Online 🎴
      </RouterLink>

      <RouterLink v-if="authStore.isLoggedIn" to="/lobby"
        class="ml-4 px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
        🃏 Jogar
      </RouterLink>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center mr-2">
        <RouterLink to="/ranking"
          class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          Leaderboards
        </RouterLink>
        <RouterLink to="/stats"
          class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          Estatísticas
        </RouterLink>

        <template v-if="authStore.isLoggedIn">
          <RouterLink to="/shop"
            class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            Loja
          </RouterLink>
          <RouterLink to="/history"
            class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            Histórico
          </RouterLink>
          <RouterLink v-if="authStore.currentUser?.type === 'A'" to="/administration"
            class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            Administração
          </RouterLink>
        </template>
      </div>

      <div v-if="authStore.isLoggedIn" class="h-8 w-[1px] bg-slate-200 mx-2"></div>

      <div v-if="authStore.isLoggedIn" class="flex items-center gap-4">
        <RouterLink to="/profile" class="group flex items-center gap-3">
          <div class="relative">
            <img :src="computedAvatar" class="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-indigo-500 object-cover transition-all" />
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <span class="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors text-sm">
            {{ authStore.currentUser?.name }}
          </span>
        </RouterLink>

        <div class="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
          <span class="text-sm font-bold text-indigo-700">{{ authStore.currentUser?.coins_balance ?? 0 }}</span>
          <span class="text-xs">💰</span>
        </div>

        <button @click="handleLogout" class="p-2 text-slate-400 hover:text-red-500 transition-all cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <RouterLink v-else to="/login"
        class="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">
        Entrar
      </RouterLink>

    </div>
  </nav>

  <main class="max-w-[95%] mx-auto py-8">
    <RouterView />
  </main>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
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
const router = useRouter()

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

const handleLogout = async () => {
  // 1. Mostramos o carregamento
  const toastId = toast.loading('A fazer logout...')

  try {
    // 2. Tentamos avisar o servidor (opcional, se falhar não faz mal)
    await authStore.logout()
  } catch (err) {
    console.warn('Servidor não respondeu ao logout, mas vamos sair na mesma!')
  } finally {
    // 3. LIMPEZA OBRIGATÓRIA (Acontece sempre, com ou sem erro do servidor!)
    localStorage.removeItem('token')

    // 4. Redirecionamos para a Homepage
    router.push('/')

    // 5. Atualizamos o Toast para sucesso
    toast.dismiss(toastId)
    toast.success('Logout efetuado com sucesso!')
  }
}
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}
</style>
