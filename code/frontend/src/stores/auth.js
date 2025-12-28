import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id
  })

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)
    await getUser()
    socketStore.emitJoin(currentUser.value)
    return currentUser.value
  }

  const logout = async () => {
    await apiStore.postLogout()
    currentUser.value = undefined
  }

 const getUser = async () => {
  try {
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data
    return response.data
  } catch (error) {
    currentUser.value = undefined
    throw error // Importante para o Router saber que falhou
  }
}

  return {
    currentUser,
    isLoggedIn,
    currentUserID,
    login,
    logout,
    getUser,
  }
})
