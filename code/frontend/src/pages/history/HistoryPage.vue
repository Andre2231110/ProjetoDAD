<template>
  <div class="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
    <div class="max-w-[95%] mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10">

      <h1 class="text-4xl font-black text-indigo-900 tracking-tight uppercase italic mb-10">Histórico de Matches</h1>

      <div v-if="loading" class="py-20 text-center flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="text-slate-400 font-bold uppercase text-xs tracking-widest">A carregar o teu legado...</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="match in matches" :key="match.id"
          class="border border-slate-100 rounded-[2rem] overflow-hidden transition-all duration-500 bg-white mb-4 hover:shadow-md">

          <div @click="toggleMatch(match.id)"
            class="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-all duration-300"
            :class="{ 'border-b border-slate-50 bg-slate-50/30': expandedMatchId === match.id }">

            <div class="flex items-center gap-6">
              <div class="text-center min-w-[60px]">
                <p class="text-[9px] font-black text-slate-400 uppercase">Data</p>
                <p class="font-bold text-[11px] text-slate-600">{{ formatDate(match.began_at) }}</p>
              </div>

              <div class="flex flex-col">
                <div class="flex items-center gap-2 flex-wrap max-w-[300px]">
                  <span class="font-black text-slate-800 uppercase italic text-sm">vs {{ getOpponent(match)?.nickname }}</span>
                  
                  <div class="flex gap-1">
                    <span v-for="ach in getMatchAchievements(match)" :key="ach.type"
                      class="flex items-center gap-1 bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase shadow-sm">
                      {{ ach.icon }} {{ ach.label }}
                    </span>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Bisca {{ match.type }}</span>
              </div>
            </div>

            <div class="flex items-center gap-8">
              <div class="text-center min-w-[100px]">
                <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Marcas</p>
                <div class="flex items-center justify-center gap-2 bg-slate-100 px-4 py-1.5 rounded-2xl border border-slate-200 shadow-inner">
                  <span class="font-black text-indigo-950 text-base leading-none">{{ displayMarks(match.player1_marks) }}</span>
                  <span class="text-slate-300 font-bold">-</span>
                  <span class="font-black text-slate-500 text-base leading-none">{{ displayMarks(match.player2_marks) }}</span>
                </div>
              </div>

              <div class="flex flex-col items-center justify-center w-[80px]">
                <span :class="match.winner_user_id === authStore.currentUserID ? 'text-green-500' : 'text-rose-500'"
                  class="font-black uppercase text-[10px] tracking-tight text-center">
                  {{ match.winner_user_id === authStore.currentUserID ? 'Vitória 🏆' : 'Derrota' }}
                </span>
                <span class="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{{ match.total_time }}s</span>
              </div>

              <span class="text-slate-300 text-[10px] w-4 text-center transition-transform duration-500"
                :class="{ 'rotate-180': expandedMatchId === match.id }">
                ▼
              </span>
            </div>
          </div>

          <transition 
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[1000px] opacity-100"
            leave-active-class="transition-all duration-400 ease-in"
            leave-from-class="max-h-[1000px] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="expandedMatchId === match.id" class="overflow-hidden border-t border-slate-100">
              <div class="p-8 bg-slate-50/50">
                <h4 class="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest px-2 italic">
                  Rondas detalhadas desta Match:
                </h4>

                <div v-if="match.games && match.games.length > 0" class="space-y-3">
                  <div v-for="(game, gIndex) in match.games" :key="game.id"
                    class="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all">

                    <div class="flex items-center gap-4">
                      <span class="font-black text-slate-300 text-sm italic">#{{ gIndex + 1 }}</span>
                      <div class="flex flex-col">
                        <span :class="game.winner_user_id === authStore.currentUserID ? 'text-green-600' : 'text-rose-600'"
                          class="font-black uppercase text-[11px]">
                          {{ game.winner_user_id === authStore.currentUserID ? 'Vitória' : 'Derrota' }}
                        </span>
                        <div v-if="getGameAchievement(game, match)" :class="getGameAchievement(game, match).color"
                          class="mt-1 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                          <span class="text-xs">{{ getGameAchievement(game, match).icon }}</span>
                          <span class="text-[9px] font-black uppercase">{{ getGameAchievement(game, match).label }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-8">
                      <div class="flex flex-col items-end">
                        <p class="text-[9px] font-black text-slate-400 uppercase">Pontuação</p>
                        <p class="font-black text-slate-700 tracking-tighter">
                          {{ match.player1_user_id === authStore.currentUserID ? game.player1_points : game.player2_points }}
                          <span class="text-slate-300 mx-1">-</span>
                          {{ match.player1_user_id === authStore.currentUserID ? game.player2_points : game.player1_points }}
                        </p>
                      </div>
                      <div class="text-right min-w-[50px]">
                        <p class="text-[9px] font-black text-slate-400 uppercase">Tempo</p>
                        <p class="text-xs font-bold text-slate-500">{{ game.total_time }}s</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-6 px-2 flex gap-4 text-[9px] font-bold text-slate-400 uppercase italic border-t border-slate-100 pt-4">
                  <span>Início: {{ formatDate(match.began_at) }}</span>
                  <span>Fim: {{ formatDate(match.ended_at) }}</span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div v-if="!loading && matches.length === 0" class="text-center text-slate-400 italic py-20">
        Ainda não tens histórico de matches. Vai jogar e volta cá depois! 
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import axios from 'axios'

const authStore = useAuthStore()
const apiStore = useAPIStore()
const matches = ref([])
const loading = ref(true)
const expandedMatchId = ref(null)

const toggleMatch = (id) => {
  expandedMatchId.value = expandedMatchId.value === id ? null : id
}

const fetchHistory = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/matches/history', {
      headers: { 'Authorization': `Bearer ${apiStore.token}` }
    })
    matches.value = res.data.data || []
  } catch (err) { console.error(err) }
  finally { loading.value = false }
}

const getGameAchievement = (game, match) => {
  const isP1 = match.player1_user_id === authStore.currentUserID
  const myPoints = isP1 ? game.player1_points : game.player2_points
  const opponentPoints = isP1 ? game.player2_points : game.player1_points

  if (myPoints === 120) return { type: 'bandeira', label: 'Bandeira!', icon: '🚩', color: 'text-rose-600 bg-rose-50' }
  if (myPoints >= 90 && myPoints <= 119) return { type: 'capote', label: 'Capote!', icon: '🧥', color: 'text-amber-600 bg-amber-50' }
  if (opponentPoints === 120) return { type: 'loss-bandeira', label: 'Levaste Bandeira', icon: '💀', color: 'text-slate-400 bg-slate-100' }
  return null
}

const displayMarks = (marks) => {
  return marks > 4 ? 4 : marks
}

const getMatchAchievements = (match) => {
  if (!match.games) return []
  const achievements = []
  let hasBandeira = false
  let hasCapote = false

  for (const game of match.games) {
    const isP1 = match.player1_user_id === authStore.currentUserID
    const myPoints = isP1 ? game.player1_points : game.player2_points

    if (myPoints === 120 && !hasBandeira) {
      achievements.push({ type: 'bandeira', icon: '🚩', label: 'Bandeira' })
      hasBandeira = true
    }
    if (myPoints >= 90 && myPoints <= 119 && !hasCapote) {
      achievements.push({ type: 'capote', icon: '🧥', label: 'Capote' })
      hasCapote = true
    }
  }
  return achievements
}

const getOpponent = (m) => m.player1_user_id === authStore.currentUserID ? m.player2 : m.player1
const formatDate = (d) => d ? new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'

onMounted(fetchHistory)
</script>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.5s ease;
}
</style>