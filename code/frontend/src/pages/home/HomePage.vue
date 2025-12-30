<template>
  <Toaster richColors />
  <div class="w-full min-h-[85vh] flex flex-col items-center justify-center px-4">
    
    <main class="w-full max-w-5xl flex flex-col items-center text-center space-y-12">
      
      <div class="space-y-4">
        <h1 class="text-6xl md:text-7xl font-black text-indigo-700 tracking-tighter animate-bounce uppercase">
          Bem-vindo à Bisca!
        </h1>
        <p class="text-xl font-medium text-slate-500 max-w-2xl mx-auto">
          O jogo clássico de cartas português, agora online.
        </p>
      </div>

      <div class="flex gap-6 justify-center flex-wrap py-4">
        <div v-for="(simbolo, index) in ['♠️', '♥️', '♣️', '♦️']" :key="index"
          class="w-24 h-36 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-4xl font-black text-indigo-600 transform transition-all duration-300 hover:-translate-y-4 hover:rotate-6 hover:shadow-xl cursor-pointer select-none">
          {{ simbolo }}
        </div>
      </div>

      <div class="flex gap-6 flex-wrap justify-center w-full max-w-3xl pt-6">
        
        <RouterLink v-if="authStore.isLoggedIn" to="/lobby"
          class="flex-1 min-w-[280px] px-8 py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl hover:bg-indigo-700 hover:scale-105 transform transition-all duration-300 shadow-lg uppercase tracking-widest text-center">
          🃏 Entrar no Lobby
        </RouterLink>

        <template v-else>
          <RouterLink to="/bot-game"
            class="flex-1 min-w-[280px] px-8 py-5 bg-slate-800 text-white font-black text-xl rounded-2xl hover:bg-slate-900 hover:scale-105 transform transition-all duration-300 shadow-lg uppercase tracking-widest text-center">
            🤖 Treinar vs Bot
          </RouterLink>

          <RouterLink to="/login"
            class="flex-1 min-w-[280px] px-8 py-5 bg-green-500 text-white font-black text-xl rounded-2xl hover:bg-green-600 hover:scale-105 transform transition-all duration-300 shadow-lg uppercase tracking-widest text-center">
            Entrar no Jogo 💰
          </RouterLink>
        </template>
      </div>

      <p v-if="authStore.isLoggedIn" class="text-indigo-400 font-bold text-sm uppercase tracking-widest">
        Pronto para o desafio, {{ authStore.currentUser?.name }}? 
      </p>
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

</style>
