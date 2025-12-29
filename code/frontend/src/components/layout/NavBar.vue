<template>
  <div class="max-w-8xl mx-auto w-full flex items-center gap-4">
    <div v-if="authStore.isLoggedIn" class="flex items-center gap-2">
      <!-- Avatar -->
      <img
        v-if="authStore.currentUser"
        :src="avatarPreview || `/storage/${authStore.currentUser.current_avatar}` || defaultAvatar"
        alt="Avatar"
        class="w-20 h-20 rounded-full border-2 border-indigo-600 object-cover"
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
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const defaultAvatar = '/default.jpg'

const handleLogout = () => {
  toast.promise(authStore.logout(), {
    loading: 'A fazer logout...',
    success: () => {
      localStorage.removeItem('token')
      return 'Logout efetuado com sucesso!'
    },
    error: 'Erro ao fazer logout',
  })
}
</script>
