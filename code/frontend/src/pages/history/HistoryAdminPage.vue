<template>
  <div class="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
    <div class="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10">
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
      
      <div class="mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 class="text-4xl font-black text-indigo-900 tracking-tight uppercase italic">Gestão de Históricos</h1>
          <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">Painel de Controlo Administrativo</p>
        </div>
        
        <div class="relative w-full md:w-96">
          <input 
            v-model="searchQuery" 
            @input="debounceSearch"
            type="text" 
            placeholder="Pesquisar por nome ou nickname..." 
            class="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none ring-2 ring-slate-100 focus:ring-indigo-500 font-bold transition-all shadow-sm"
          />
          <span class="absolute right-5 top-4 opacity-30 text-xl">🔍</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div class="lg:col-span-1 space-y-4">
          <div class="flex items-center justify-between px-2 mb-2">
            <h2 class="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Jogadores Encontrados</h2>
            <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">{{ players.length }}</span>
          </div>

          <div v-if="loadingPlayers" class="text-center py-10 italic text-slate-300">A procurar jogadores...</div>
          
          <div v-else class="space-y-3 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            <div 
              v-for="player in players" 
              :key="player.id"
              @click="selectPlayer(player)"
              :class="[
                'p-5 rounded-[1.8rem] border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 group',
                selectedPlayer?.id === player.id 
                  ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 scale-[1.02]' 
                  : 'bg-white border-slate-50 hover:border-indigo-100 hover:bg-slate-50'
              ]"
            >
              <div class="w-12 h-12 rounded-2xl overflow-hidden border-2" :class="selectedPlayer?.id === player.id ? 'border-indigo-400' : 'border-slate-100'">
                <img :src="player.photo_avatar_filename ? `http://${API_BASE}/storage/` + player.photo_avatar_filename : '/default.jpg'" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <p :class="['font-black text-sm uppercase italic', selectedPlayer?.id === player.id ? 'text-white' : 'text-slate-800']">
                  {{ player.nickname }}
                </p>
                <p :class="['text-[10px] font-bold', selectedPlayer?.id === player.id ? 'text-indigo-200' : 'text-slate-400']">
                  ID: #{{ player.id }} • {{ player.type === 'A' ? 'Admin' : 'Jogador' }}
                </p>
              </div>
              <span v-if="player.blocked" class="text-[8px] bg-rose-500 text-white px-2 py-1 rounded-md font-black">BLOQUEADO</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div v-if="selectedPlayer" class="animate-in slide-in-from-right duration-500">
            
            <div class="flex items-center justify-between mb-8 bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
              <div class="flex items-center gap-4">
                <div class="text-2xl">📁</div>
                <div>
                  <h3 class="text-xl font-black text-slate-800 uppercase italic">Histórico de <span class="text-indigo-600">{{ selectedPlayer.nickname }}</span></h3>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exibindo partidas multijogador finalizadas</p>
                </div>
              </div>
            </div>
            
            <div v-if="loadingHistory" class="flex flex-col items-center justify-center py-20 text-indigo-600 font-black italic">
              A carregar registos...
            </div>

            <div v-else-if="matches.length > 0" class="space-y-4">
              <div v-for="match in matches" :key="match.id" 
                   class="border border-slate-100 rounded-[2rem] overflow-hidden transition-all bg-white mb-4 hover:shadow-md">

                <div @click="toggleMatch(match.id)"
                  class="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-all"
                  :class="{ 'border-b border-slate-50 bg-slate-50/30': expandedMatchId === match.id }">

                  <div class="flex items-center gap-6">
                    <div class="text-center min-w-[60px]">
                      <p class="text-[9px] font-black text-slate-400 uppercase">Data</p>
                      <p class="font-bold text-[11px] text-slate-600">{{ formatDate(match.began_at) }}</p>
                    </div>

                    <div class="flex flex-col">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-black text-slate-800 uppercase italic text-sm">vs {{ getOpponentNickname(match) }}</span>
                        <div class="flex gap-1">
                          <span v-for="ach in getMatchAchievements(match)" :key="ach.type"
                            class="flex items-center gap-1 bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">
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
                      <span :class="match.winner_user_id === selectedPlayer.id ? 'text-green-500' : 'text-rose-500'"
                        class="font-black uppercase text-[10px] tracking-tight text-center">
                        {{ match.winner_user_id === selectedPlayer.id ? 'Vitória 🏆' : 'Derrota' }}
                      </span>
                      <span class="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{{ match.total_time }}s</span>
                    </div>

                    <span class="text-slate-300 text-[10px] w-4 text-center transition-transform duration-500"
                      :class="{ 'rotate-180': expandedMatchId === match.id }">▼</span>
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
                      <h4 class="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest px-2 italic">Rondas desta Match:</h4>
                      
                      <div v-if="match.games && match.games.length > 0" class="space-y-3">
                        <div v-for="(game, gIndex) in match.games" :key="game.id"
                          class="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex justify-between items-center group transition-all">

                          <div class="flex items-center gap-4">
                            <span class="font-black text-slate-300 text-sm italic">#{{ gIndex + 1 }}</span>
                            <div class="flex flex-col">
                              <span :class="game.winner_user_id === selectedPlayer.id ? 'text-green-600' : 'text-rose-600'"
                                    class="font-black uppercase text-[11px]">
                                {{ game.winner_user_id === selectedPlayer.id ? 'Vitória' : 'Derrota' }}
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
                                {{ match.player1_user_id === selectedPlayer.id ? game.player1_points : game.player2_points }}
                                <span class="text-slate-300 mx-1">-</span>
                                {{ match.player1_user_id === selectedPlayer.id ? game.player2_points : game.player1_points }}
                              </p>
                            </div>
                            <div class="text-right min-w-[50px]">
                              <p class="text-[9px] font-black text-slate-400 uppercase">Tempo</p>
                              <p class="text-xs font-bold text-slate-500">{{ game.total_time }}s</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
            
            <div v-else class="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 italic text-slate-400">
              Este jogador ainda não participou em partidas.
            </div>
          </div>
          
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem] py-32">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-3xl">👈</div>
            <p class="font-black uppercase text-xs tracking-[0.3em]">Seleciona um jogador para auditar</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'
import axios from 'axios'

const apiStore = useAPIStore()
const players = ref([])
const searchQuery = ref('')
const selectedPlayer = ref(null)
const matches = ref([])
const loadingPlayers = ref(true)
const loadingHistory = ref(false)
const expandedMatchId = ref(null)
const API_BASE = `http://${import.meta.env.VITE_API_DOMAIN}/api/admin`

// 1. Fetch Players
const fetchPlayers = async () => {
  loadingPlayers.value = true
  try {
    const res = await axios.get(`${API_BASE}/users?search=${searchQuery.value}`, {
      headers: { 'Authorization': `Bearer ${apiStore.token}` }
    })
    players.value = res.data.data || []
  } catch (err) { console.error(err) }
  finally { loadingPlayers.value = false }
}

// 2. Fetch Match History
const selectPlayer = async (player) => {
  selectedPlayer.value = player
  expandedMatchId.value = null
  loadingHistory.value = true
  try {
    const res = await axios.get(`${API_BASE}/users/${player.id}/history`, {
      headers: { 'Authorization': `Bearer ${apiStore.token}` }
    })
    matches.value = res.data.data || []
  } catch (err) { console.error(err) }
  finally { loadingHistory.value = false }
}

// Lógica de Helpers
const getOpponentNickname = (m) => {
  if (m.player1_user_id === selectedPlayer.value.id) return m.player2?.nickname || '???'
  return m.player1?.nickname || '???'
}

const displayMarks = (marks) => marks > 4 ? 4 : marks

const getMatchAchievements = (match) => {
  if (!match.games) return []
  const achievements = []
  let hasBandeira = false, hasCapote = false
  for (const game of match.games) {
    const myPoints = match.player1_user_id === selectedPlayer.value.id ? game.player1_points : game.player2_points
    if (myPoints === 120 && !hasBandeira) { achievements.push({ type: 'bandeira', icon: '🚩', label: 'Bandeira' }); hasBandeira = true }
    if (myPoints >= 90 && myPoints <= 119 && !hasCapote) { achievements.push({ type: 'capote', icon: '🧥', label: 'Capote' }); hasCapote = true }
  }
  return achievements
}

const getGameAchievement = (game, match) => {
  const myPoints = match.player1_user_id === selectedPlayer.value.id ? game.player1_points : game.player2_points
  const oppPoints = match.player1_user_id === selectedPlayer.value.id ? game.player2_points : game.player1_points
  if (myPoints === 120) return { label: 'Bandeira!', icon: '🚩', color: 'text-rose-600 bg-rose-50' }
  if (myPoints >= 90 && myPoints <= 119) return { label: 'Capote!', icon: '🧥', color: 'text-amber-600 bg-amber-50' }
  if (oppPoints === 120) return { label: 'Oponente fez Bandeira', icon: '💀', color: 'text-slate-400 bg-slate-100' }
  return null
}

const toggleMatch = (id) => expandedMatchId.value = expandedMatchId.value === id ? null : id
const formatDate = (d) => d ? new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'

let timeout = null
const debounceSearch = () => { clearTimeout(timeout); timeout = setTimeout(fetchPlayers, 500) }

onMounted(fetchPlayers)
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.rotate-180 { transform: rotate(180deg); }
</style>