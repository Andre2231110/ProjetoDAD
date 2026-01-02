<template>
  <div class="max-w-8xl mx-auto w-full flex items-center gap-4">

    <div v-if="authStore.isLoggedIn" class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <img :src="computedAvatar" class="w-10 h-10 rounded-full border border-indigo-200 shadow-sm" />
        <RouterLink to="/profile" class="font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
          {{ authStore.currentUser?.name }}
        </RouterLink>
      </div>

      <button @click="handleLogout"
        class="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full hover:bg-red-600 shadow-md hover:shadow-lg transition-all active:scale-95">
        Logout
      </button>
    </div>

    <!-- Login caso não esteja logado -->
    <RouterLink v-else to="/login"
      class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
      Login
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink, useRouter  } from 'vue-router'
import { toast } from 'vue-sonner'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const API_URL = 'http://127.0.0.1:8000'
const router = useRouter()

const computedAvatar = computed(() => {
  const avatar = authStore.currentUser?.current_avatar
  if (!avatar) return '/default.jpg'
  return `${API_URL}/storage/photos_avatars/${avatar}`
})

const handleLogout = async () => {
  // 1. Mostramos o carregamento
  const toastId = toast.loading('A fazer logout...');

  try {
    // 2. Tentamos avisar o servidor (opcional, se falhar não faz mal)
    await authStore.logout();
  } catch (err) {
    console.warn('Servidor não respondeu ao logout, mas vamos sair na mesma!');
  } finally {
    // 3. LIMPEZA OBRIGATÓRIA (Acontece sempre, com ou sem erro do servidor!)
    localStorage.removeItem('token');
    
    // 4. Redirecionamos para a Homepage
    router.push('/'); 
    
    // 5. Atualizamos o Toast para sucesso
    toast.dismiss(toastId);
    toast.success('Logout efetuado com sucesso!');
  }
}
</script>
