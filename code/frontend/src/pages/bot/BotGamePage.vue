<template>
  <div class="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
    <div class="max-w-[80%] mx-auto space-y-8">

      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800">
        <div>
          <h1 class="text-3xl font-black tracking-tighter italic uppercase">TREINO VS BOT 🤖</h1>
          <p class="text-slate-400 text-sm font-medium">Melhora as tuas táticas sem risco de moedas.</p>
        </div>
        
        <div v-if="authStore.isLoggedIn" class="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <span class="text-amber-400 text-xl">💰</span>
          <div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Saldo Atual</p>
            <p class="text-lg font-black">{{ authStore.currentUser?.coins_balance ?? 0 }} Moedas</p>
          </div>
        </div>
        <div v-else class="bg-indigo-600/10 px-6 py-3 rounded-2xl border border-indigo-500/20">
          <p class="text-indigo-400 font-black text-xs uppercase italic">Modo Convidado Ativo</p>
        </div>
      </div>

      <div class="max-w-2xl mx-auto">
        <Card class="shadow-2xl border-t-8 border-t-slate-600 rounded-[2.5rem] overflow-hidden">
          <CardHeader class="pb-2">
            <CardTitle class="text-2xl font-black flex items-center gap-3 text-slate-800 uppercase italic">
              <span>🎮</span> Configurar Partida Solo
            </CardTitle>
          </CardHeader>
          
          <CardContent class="p-8 space-y-8">
            <div class="space-y-4">
              <label class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                Variante da Bisca
              </label>
              <div class="flex p-1.5 bg-slate-100 rounded-2xl gap-2 border border-slate-200">
                <Button type="button" @click="botGameConfig.type = '3'" :class="[
                  'flex-1 h-14 font-black transition-all border-none shadow-none rounded-xl text-md',
                  botGameConfig.type === '3'
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                ]">
                  Bisca de 3
                </Button>
                <Button type="button" @click="botGameConfig.type = '9'" :class="[
                  'flex-1 h-14 font-black transition-all border-none shadow-none rounded-xl text-md',
                  botGameConfig.type === '9'
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                ]">
                  Bisca de 9
                </Button>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                Estrutura do Jogo
              </label>
              <div class="grid grid-cols-1 gap-3">
                <button @click="botGameConfig.isMatch = false" :class="[
                  'p-5 border-2 rounded-[1.8rem] text-left transition-all duration-300 group',
                  !botGameConfig.isMatch
                    ? 'border-slate-800 bg-slate-50 ring-4 ring-slate-800/5'
                    : 'border-slate-100 bg-white hover:border-slate-300'
                ]">
                  <div class="flex justify-between items-center mb-1">
                    <p :class="['font-black text-lg uppercase italic', !botGameConfig.isMatch ? 'text-slate-900' : 'text-slate-400']">
                      Jogo Único
                    </p>
                    <span v-if="!botGameConfig.isMatch" class="text-slate-800">●</span>
                  </div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partida rápida de 120 pontos</p>
                </button>

                <button @click="botGameConfig.isMatch = true" :class="[
                  'p-5 border-2 rounded-[1.8rem] text-left transition-all duration-300 group',
                  botGameConfig.isMatch
                    ? 'border-slate-800 bg-slate-50 ring-4 ring-slate-800/5'
                    : 'border-slate-100 bg-white hover:border-slate-300'
                ]">
                  <div class="flex justify-between items-center mb-1">
                    <p :class="['font-black text-lg uppercase italic', botGameConfig.isMatch ? 'text-slate-900' : 'text-slate-400']">
                      Match Completa
                    </p>
                    <span v-if="botGameConfig.isMatch" class="text-slate-800">●</span>
                  </div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Série à melhor de 4 marcas</p>
                </button>
              </div>
            </div>

            <div class="pt-6">
              <Button @click="startBotGame"
                class="w-full h-20 bg-slate-800 hover:bg-slate-900 text-white font-black text-2xl rounded-[1.8rem] shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95 uppercase italic tracking-tighter">
                <span>⚔️</span> Começar Treino
              </Button>
              <p class="text-center mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Os jogos contra o bot não contam para o histórico multiplayer
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="flex justify-center pt-8">
        <RouterLink to="/" class="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors">
          ← Voltar ao Menu Principal
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const botGameConfig = ref({ 
  type: '3', 
  isMatch: false 
})

const startBotGame = () => {
  router.push({ 
    name: 'Game', 
    query: { 
      mode: 'bot', 
      type: botGameConfig.value.type, 
      isMatch: botGameConfig.value.isMatch ? 'true' : 'false' 
    } 
  })
}
</script>

<style scoped>
.container {
  min-height: 85vh;
  display: flex;
  align-items: center;
}
</style>