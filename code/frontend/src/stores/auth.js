// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)

  const isLoggedIn = computed(() => currentUser.value !== undefined)
  const currentUserID = computed(() => currentUser.value?.id)

  // -----------------------------
  // Métodos do authStore
  // -----------------------------

  const login = async (credentials) => {
    const response = await apiStore.postLogin(credentials)
    localStorage.setItem('token', apiStore.token) // salva token
    await getUser()
    return currentUser.value
  }

  const register = async (formData) => {
    const response = await apiStore.postRegister(formData)
    localStorage.setItem('token', apiStore.token)
    await getUser()
    return currentUser.value
  }

  const updateProfile = async (formData) => {
    if (!apiStore.token) throw new Error('Usuário não autenticado')

    const response = await apiStore.postUpdateProfile(formData)
    currentUser.value = response.user || response.data.user
    return response
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

  const deleteAccount = async (password) => {
    if (!currentUser.value) throw new Error('Usuário não autenticado')
    if (currentUser.value.type === 'A')
      throw new Error('Administradores não podem deletar sua própria conta.')

    try {
      await apiStore.deleteProfile(password)
      currentUser.value = undefined
      localStorage.removeItem('token')
      if (apiStore.api?.defaults?.headers?.common) {
        delete apiStore.api.defaults.headers.common.Authorization
      }
      return true
    } catch (err) {
      // Maneira segura de pegar a mensagem
      let message = 'Erro ao deletar conta'
      if (err?.response?.data?.message) {
        message = err.response.data.message
      } else if (err?.message) {
        message = err.message
      }
      throw new Error(message)
    }
  }

  return {
    currentUser,
    isLoggedIn,
    currentUserID,
    register,
    login,
    logout,
    getUser,
    updateProfile,
    deleteAccount,
  }
})
