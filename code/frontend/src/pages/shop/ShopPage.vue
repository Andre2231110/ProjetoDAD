<template>
  <div class="container mx-auto p-6 max-w-lg space-y-6">

    <h1 class="text-3xl font-bold text-indigo-700 text-center">
      Loja de Coins 🪙
    </h1>

    <div class="bg-white p-5 rounded-xl shadow-md flex justify-between items-center border-l-4 border-indigo-500">
      <span class="font-semibold text-gray-700 text-lg">Saldo atual 💰:</span>
      <span class="font-bold text-2xl text-indigo-600">
        {{ authStore.currentUser?.coins_balance ?? 0 }} coins
      </span>
    </div>

    <form @submit.prevent="handlePurchase" class="bg-white p-8 rounded-xl shadow-lg space-y-6">

      <div>
        <label class="block mb-2 font-semibold text-gray-700">Tipo de Pagamento 💳</label>
        <select v-model="form.type" @change="form.reference = ''"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition bg-white">
          <option value="MBWAY">📱 MBWAY</option>
          <option value="PAYPAL">📧 PAYPAL</option>
          <option value="IBAN">🏦 IBAN</option>
          <option value="MB">🏧 MB (Multibanco)</option>
          <option value="VISA">💳 VISA</option>
        </select>
      </div>

      <div>
        <label class="block mb-2 font-semibold text-gray-700">Referência #️⃣</label>
        <input type="text" v-model="form.reference" :placeholder="placeholderReference"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
          required />
        <p class="text-xs text-gray-500 mt-1 ml-1">{{ helperText }}</p>
      </div>

      <div>
        <label class="block mb-2 font-semibold text-gray-700">Valor (€) 💶</label>
        <div class="relative">
          <input type="number" v-model.number="form.euros" min="1" max="99" step="1" @keydown="preventInvalidKeys"
            @paste="handlePaste"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
            required />

          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span class="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
              +{{ Math.floor((form.euros || 0) * 10) }} Coins 🪙
            </span>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-1 ml-1">Apenas valores inteiros (1€ a 99€)</p>
      </div>


      <button type="submit" :disabled="isLoading"
        class="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 active:scale-95 transition transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
        <span v-if="isLoading">A processar... ⏳</span>
        <span v-else>Comprar Coins 🚀</span>
      </button>

    </form>

    <transition name="slide-fade">
      <div v-if="toast.show"
        :class="['fixed top-5 right-5 px-6 py-4 rounded-lg shadow-xl font-medium flex items-center gap-3 z-50 border',
          toast.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200']">
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

const isLoading = ref(false)

onMounted(async () => {
  // vai buscar o user autenticado (inclui coins_balance)
  await authStore.getUser()
})

// Bloqueia teclas inválidas no input de euros
const preventInvalidKeys = (event) => {
  const invalidKeys = ['.', ',', '-', '+', 'e', 'E']
  if (invalidKeys.includes(event.key)) {
    event.preventDefault()
  }
}

// Bloqueia colar valores com vírgula/ponto
const handlePaste = (event) => {
  const pastedData = event.clipboardData.getData('text')
  if (/[.,]/.test(pastedData)) {
    event.preventDefault()
  }
}

// Formulário
const form = ref({
  euros: 5,
  type: 'MBWAY',
  reference: '',
})

// Toast
const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

// Placeholders e mensagens de ajuda
const placeholderReference = computed(() => {
  switch (form.value.type) {
    case 'MBWAY':
      return 'Ex: 91xxxxxxx'
    case 'PAYPAL':
      return 'email@exemplo.com'
    case 'IBAN':
      return 'PT50...'
    case 'MB':
      return '12345-123456789'
    case 'VISA':
      return '4xxxxxxxxxxxxxxx'
    default:
      return 'Referência'
  }
})

const helperText = computed(() => {
  switch (form.value.type) {
    case 'MBWAY':
      return 'Deve começar por 9 e ter 9 dígitos.'
    case 'VISA':
      return 'Deve começar por 4 e ter 16 dígitos.'
    default:
      return 'Insira os dados corretos para simulação.'
  }
})

// Lógica de compra
const handlePurchase = async () => {
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

    // 1) erros de validação do Laravel (FormRequest)
    if (error.response?.status === 422 && error.response.data?.errors) {
      // caso especial: erro vindo do gateway dentro de errors.message
      if (typeof error.response.data.errors.message === 'string') {
        msg = error.response.data.errors.message
      } else {
        const firstField = Object.keys(error.response.data.errors)[0]
        const fieldError = error.response.data.errors[firstField]
        msg = Array.isArray(fieldError) ? fieldError[0] : String(fieldError)
      }
    }
    // 2) mensagem genérica
    else if (error.response?.data?.message) {
      msg = error.response.data.message
    }

    showToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>


<style scoped>
/* Animação para o Toast (slide-fade) */
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
