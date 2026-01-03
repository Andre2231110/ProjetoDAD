<template>
  <div class="container mx-auto p-6 max-w-4xl space-y-8 animate-in fade-in duration-700">

    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 class="text-3xl font-black text-indigo-900 tracking-tight uppercase italic">
        Loja 🛒
      </h1>

      <div class="bg-white px-6 py-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-3">
        <span class="font-bold text-gray-500 text-sm uppercase tracking-wider">Teu Saldo:</span>
        <span class="font-black text-2xl text-indigo-600">
          {{ authStore.currentUser?.coins_balance ?? 0 }} 🪙
        </span>
      </div>
    </div>

    <div class="flex justify-center">
      <div class="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
        <button @click="currentTab = 'coins'"
          class="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
          :class="currentTab === 'coins' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'">
          <span>💰</span> Coins
        </button>
        <button @click="currentTab = 'decks'"
          class="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
          :class="currentTab === 'decks' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'">
          <span>🃏</span> Decks
        </button>
        <button @click="currentTab = 'avatars'"
          class="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2"
          :class="currentTab === 'avatars' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-slate-600'">
          <span>👤</span> Avatares
        </button>
      </div>
    </div>

    <div v-if="currentTab === 'coins'" class="max-w-lg mx-auto">
      <form @submit.prevent="handleCoinPurchase"
        class="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
        <h2 class="text-xl font-bold text-slate-700 text-center mb-4">Carregar Carteira</h2>

        <div>
          <label class="block mb-2 font-bold text-slate-600 text-xs uppercase tracking-wider">Tipo de Pagamento
            💳</label>
          <select v-model="form.type" @change="form.reference = ''"
            class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none transition bg-slate-50 font-medium">
            <option value="MBWAY">📱 MBWAY</option>
            <option value="PAYPAL">📧 PAYPAL</option>
            <option value="IBAN">🏦 IBAN</option>
            <option value="MB">🏧 MB (Multibanco)</option>
            <option value="VISA">💳 VISA</option>
          </select>
        </div>

        <div>
          <label class="block mb-2 font-bold text-slate-600 text-xs uppercase tracking-wider">Referência #️⃣</label>
          <input type="text" v-model="form.reference" :placeholder="placeholderReference"
            class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none transition bg-slate-50"
            required />
          <p class="text-[10px] text-slate-400 mt-1 ml-1 font-bold uppercase">{{ helperText }}</p>
        </div>

        <div>
          <label class="block mb-2 font-bold text-slate-600 text-xs uppercase tracking-wider">Valor (€) 💶</label>
          <div class="relative">
            <input type="number" v-model.number="form.euros" min="1" max="99" step="1" @keydown="preventInvalidKeys"
              @paste="handlePaste"
              class="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none transition bg-slate-50 font-bold text-lg"
              required />

            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                +{{ Math.floor((form.euros || 0) * 10) }} Coins 🪙
              </span>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-1 ml-1">Apenas valores inteiros (1€ a 99€)</p>
        </div>

        <button type="submit" :disabled="isLoading"
          class="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-indigo-700 active:scale-95 transition transform shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="isLoading">A processar... ⏳</span>
          <span v-else>Comprar Coins 🚀</span>
        </button>
      </form>
    </div>

    <div v-if="currentTab === 'decks'">
      <div v-if="loadingItems" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        <p class="text-slate-400 font-bold uppercase text-xs">A carregar Decks...</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="deck in availableDecks" :key="deck.resourceName"
          class="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col items-center hover:shadow-xl transition-all relative overflow-hidden group">

          <div
            class="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md z-10">
            {{ deck.price === 0 ? 'GRÁTIS' : deck.price + ' 🪙' }}
          </div>

          <div
            class="w-full h-48 bg-slate-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative p-2">
            <img :src="getAssetUrl(deck.resourceName)" :alt="deck.name"
              class="h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-md" />
          </div>

          <h3 class="font-black text-slate-700 uppercase italic mb-1 text-center">{{ deck.name }}</h3>

          <button @click="handleItemPurchase(deck, 'deck')" :disabled="deck.isPurchased || isLoading"
            class="mt-auto w-full py-2 rounded-xl font-bold text-sm transition-colors"
            :class="deck.isPurchased ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-slate-900 text-white hover:bg-indigo-600'">
            {{ deck.isPurchased ? 'Adquirido ✅' : 'Comprar' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="currentTab === 'avatars'">
      <div v-if="loadingItems" class="text-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
        <p class="text-slate-400 font-bold uppercase text-xs">A carregar Avatares...</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="avatar in availableAvatars" :key="avatar.resourceName"
          class="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col items-center hover:shadow-xl transition-all group">
          <div class="relative mb-3">
            <div
              class="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors bg-slate-50">
              <img :src="getAssetUrl(avatar.resourceName)" :alt="avatar.name" class="w-full h-full object-cover" />
            </div>
            <div
              class="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              {{ avatar.price === 0 ? 'FREE' : avatar.price }}
            </div>
          </div>

          <h3
            class="font-black text-slate-700 text-xs uppercase tracking-wider mb-3 text-center leading-tight h-8 flex items-center">
            {{ avatar.name }}</h3>

          <button @click="handleItemPurchase(avatar, 'avatar')" :disabled="avatar.isPurchased || isLoading"
            class="w-full py-1.5 rounded-lg font-bold text-xs transition-colors"
            :class="avatar.isPurchased ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-slate-900 text-white hover:bg-indigo-600'">
            {{ avatar.isPurchased ? 'Adquirido' : 'Comprar' }}
          </button>
        </div>
      </div>
    </div>

    <transition name="slide-fade">
      <div v-if="toast.show"
        :class="['fixed top-5 right-5 px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 z-50 border backdrop-blur-sm',
          toast.type === 'success' ? 'bg-green-50/90 text-green-800 border-green-200' : 'bg-rose-50/90 text-rose-800 border-rose-200']">
        <span class="text-xl">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'

const authStore = useAuthStore()
const apiStore = useAPIStore()

// --- ESTADO ---
const isLoading = ref(false)
const loadingItems = ref(false)
const currentTab = ref('coins')
const shopItems = ref([])

// --- COMPUTED: Filtros para as Abas ---
const availableDecks = computed(() => shopItems.value.filter(i => i.type === 'deck'))
const availableAvatars = computed(() => shopItems.value.filter(i => i.type === 'avatar'))

// --- HELPERS IMAGENS ---
const getAssetUrl = (resourceName) => {
  const jpgFiles = [
    'deck2_preview',
    'deck6_preview',
    'deck7_preview',
    'avatar1',
    'avatar2',
    'avatar3',
    'avatar4',
    'avatar5',
    'avatar6',
    'avatar7',
    'avatar8',
    'avatar14',
    'avatar16'
  ];
  if (jpgFiles.includes(resourceName)) return `/assets/${resourceName}.jpg`;
  return `/assets/${resourceName}.png`;
}

// --- INICIALIZAÇÃO ---
onMounted(async () => {
  await authStore.getUser()
  await fetchShopItems()
})

// --- BUSCAR ITENS DA LOJA ---
const fetchShopItems = async () => {
  loadingItems.value = true
  try {
    const res = await apiStore.getShopItems()
    shopItems.value = res.data
    console.log('Shop items carregados:', shopItems.value)
  } catch (err) {
    console.error('Erro ao carregar loja:', err)
    showToast('Erro ao carregar loja', 'error')
  } finally {
    loadingItems.value = false
  }
}

// --- COMPRA DE DECKS E AVATARES (CORRIGIDO) ---
const handleItemPurchase = async (item, type) => {
  const userBalance = authStore.currentUser?.coins_balance ?? 0;

  if (userBalance < item.price) {
    showToast('Saldo insuficiente! Compra mais coins na aba "Coins".', 'error')
    return;
  }

  isLoading.value = true;

  try {
    console.log('A comprar item:', { item_id: item.resourceName, type })

    const response = await apiStore.postBuyItem({
      item_id: item.resourceName,
      type: type
    });

    console.log('Resposta da compra:', response.data)

    // Atualizar saldo no store
    if (authStore.currentUser) {
      authStore.currentUser.coins_balance = response.data.new_balance;
    }

    // Marcar visualmente como comprado
    item.isPurchased = true;

    showToast(`Compraste ${item.name} com sucesso!`, 'success')

  } catch (error) {
    console.error('Erro na compra:', error);
    let msg = 'Erro ao comprar item.'
    if (error.response?.data?.message) {
      msg = error.response.data.message
    } else if (error.message) {
      msg = error.message
    }
    showToast(msg, 'error')
  } finally {
    isLoading.value = false;
  }
}

// --- COMPRA DE MOEDAS ---
const form = ref({ euros: 5, type: 'MBWAY', reference: '' })

const preventInvalidKeys = (e) => {
  if (['.', ',', '-', '+', 'e', 'E'].includes(e.key)) e.preventDefault()
}

const handlePaste = (e) => {
  if (/[.,]/.test(e.clipboardData.getData('text'))) e.preventDefault()
}

const placeholderReference = computed(() => {
  switch (form.value.type) {
    case 'MBWAY': return 'Ex: 91xxxxxxx'
    case 'PAYPAL': return 'email@exemplo.com'
    case 'IBAN': return 'PT50...'
    case 'MB': return '12345-123456789'
    case 'VISA': return '4xxxxxxxxxxxxxxx'
    default: return 'Referência'
  }
})

const helperText = computed(() => {
  switch (form.value.type) {
    case 'MBWAY': return 'Deve começar por 9 e ter 9 dígitos.'
    case 'VISA': return 'Deve começar por 4 e ter 16 dígitos.'
    default: return 'Insira os dados corretos para simulação.'
  }
})

const handleCoinPurchase = async () => {
  isLoading.value = true
  try {
    await apiStore.postBuyCoins(form.value)

    const balanceResponse = await apiStore.getBalance()
    if (authStore.currentUser) {
      authStore.currentUser.coins_balance = balanceResponse.data.coins_balance
    }

    showToast(`Sucesso! Compraste ${form.value.euros * 10} coins.`, 'success')
    form.value.reference = ''
  } catch (error) {
    let msg = 'Erro ao processar a compra.'
    if (error.response?.status === 422 && error.response.data?.errors) {
      if (typeof error.response.data.errors.message === 'string') {
        msg = error.response.data.errors.message
      } else {
        const firstField = Object.keys(error.response.data.errors)[0]
        const fieldError = error.response.data.errors[firstField]
        msg = Array.isArray(fieldError) ? fieldError[0] : String(fieldError)
      }
    } else if (error.response?.data?.message) {
      msg = error.response.data.message
    }
    showToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}

// --- TOAST ---
const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 4000)
}
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
