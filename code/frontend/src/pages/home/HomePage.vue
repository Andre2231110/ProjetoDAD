<template>
  <Toaster richColors />
  <div class="flex min-h-screen items-center justify-center ">

    <!-- Conteúdo principal -->
    <main class="flex-1 flex flex-col justify-center items-center text-center px-4 pt-28 ">
      <h1 class="text-5xl font-bold text-indigo-700 mb-6 animate-bounce">Bem-vindo à Bisca!</h1>
      <p class="text-lg text-slate-600 mb-8">O jogo clássico de cartas, agora online.</p>

      <!-- Cartas animadas -->
      <div class="flex gap-4 mb-10">
        <div v-for="(simbolo, index) in ['♠️', '♥️', '♣️', '♦️']" :key="index"
          class="w-20 h-28 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl font-bold text-indigo-600 transform transition-transform duration-300 hover:-translate-y-3 hover:rotate-3 cursor-pointer">
          {{ simbolo }}
        </div>
      </div>

      <!-- Botões de ação -->
      <div class="flex gap-6 flex-wrap justify-center">
        <!-- Lobby Online -->
        <RouterLink v-if="authStore.isLoggedIn" to="/lobby"
          class="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 hover:scale-105 transform transition-all duration-300 shadow-lg">
          🃏 Entrar no Lobby
        </RouterLink>

        <!-- Jogo contra Bot -->
        <RouterLink v-if="!authStore.isLoggedIn" to="/bot-game"
          class="px-8 py-4 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 hover:scale-105 transform transition-all duration-300 shadow-lg">
          🤖 Jogar contra o Bot
        </RouterLink>

        <!-- Botão Login -->
        <RouterLink v-if="!authStore.isLoggedIn" to="/login"
          class="px-8 py-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 hover:scale-105 transform transition-all duration-300 shadow-lg">
          Faça login para jogar online
        </RouterLink>
      </div>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}

/* Pequena animação para as cartas no hover */
</style>
