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
    const response = await apiStore.postLogin(credentials)
    localStorage.setItem('token', apiStore.token) // guarda o token
    await getUser()
    return currentUser.value
  }

  const logout = async () => {
    await apiStore.postLogout()
    currentUser.value = undefined
  }

  const getUser = async () => {
    if (!apiStore.token) return

    try {
      const response = await apiStore.getAuthUser()
      currentUser.value = response.data
    } catch (e) {
      console.warn('Failed to fetch user, keeping token')
      currentUser.value = undefined
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
