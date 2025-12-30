<template>
  <Toaster richColors />

  <nav class="max-w-5xl w-full mx-auto p-5 flex justify-between items-center bg-white shadow-md rounded-lg">
    <div class="flex items-center gap-4">
      <RouterLink to="/" class="text-2xl font-extrabold text-indigo-600 hover:text-indigo-800">
        Página Inicial 🎴
      </RouterLink>

      <!-- Botão Lobby -->
      <RouterLink
        v-if="authStore.isLoggedIn"
        to="/lobby"
        class="ml-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        🃏 Jogar
      </RouterLink>
    </div>

    <!-- Área do utilizador -->
    <div class="flex items-center gap-4">
      <div v-if="authStore.isLoggedIn" class="flex items-center gap-2">
        <!-- Avatar -->
        <img
          :src="authStore.currentUser?.profile_image || defaultAvatar"
          alt="Avatar"
          class="w-10 h-10 rounded-full border-2 border-indigo-600"
        />

        <!-- Nome do utilizador -->
        <RouterLink
          to="/profile"
          class="font-medium text-slate-700 hover:text-indigo-600 transition-colors"
        >
          {{ authStore.currentUser?.name }}
        </RouterLink>

        <!-- Logout -->
        <button
          @click="handleLogout"
          class="ml-4 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      <!-- Login caso não esteja logado -->
      <RouterLink
        v-else
        to="/login"
        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Login
      </RouterLink>
    </div>
  </nav>

  <main class="container m-auto">
    <RouterView />
  </main>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'
import { onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useSocketStore } from '@/stores/socket'

const socketStore = useSocketStore()
const authStore = useAuthStore()
const apiStore = useAPIStore()

const defaultAvatar = '/default.jpg'

// Carregar token ao montar a app
onMounted(async () => {
  const savedToken = localStorage.getItem('token')
  if (savedToken) {
    apiStore.token = savedToken
    await authStore.getUser()
  }
  socketStore.handleConnection()
  socketStore.handleGameEvents()
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
