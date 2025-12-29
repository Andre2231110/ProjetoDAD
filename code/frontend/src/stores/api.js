import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
})

export const useAPIStore = defineStore('api', () => {
  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  const token = ref(localStorage.getItem('token'))

  // aplicar token logo no arranque
  if (token.value) {
    api.defaults.headers.common.Authorization = `Bearer ${token.value}`
  }

  // -----------------------------
  // AUTH
  // -----------------------------
  const postLogin = async (credentials) => {
    const response = await api.post('/login', credentials)
    token.value = response.data.token
    localStorage.setItem('token', token.value)
    api.defaults.headers.common.Authorization = `Bearer ${token.value}`
    return response
  }

  const postRegister = async (formData) => {
    const response = await api.post('/register', formData)
    token.value = response.data.token
    localStorage.setItem('token', token.value)
    api.defaults.headers.common.Authorization = `Bearer ${token.value}`
    return response
  }

  const postLogout = async () => {
    await api.post('/logout')
    token.value = null
    localStorage.removeItem('token')
    delete api.defaults.headers.common.Authorization
  }

  const getAuthUser = () => {
    return api.get('/users/me')
  }

  // -----------------------------
  // Atualizar Perfil
  // -----------------------------
  const postUpdateProfile = async (formData) => {
    if (!token.value) throw new Error('Usuário não autenticado')

    const response = await api.post('/profile/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token.value}`,
      },
    })

    return response.data
  }

  const deleteProfile = (password) => {
    if (!token.value) throw new Error('Usuário não autenticado')
    return api.delete('/profile/delete', { data: { password } })
  }

  // -----------------------------
  // Jogos
  // -----------------------------
  const getGames = (resetPagination = false) => {
    if (resetPagination) {
      gameQueryParameters.value.page = 1
    }

    const queryParams = new URLSearchParams({
      page: gameQueryParameters.value.page,
      ...(gameQueryParameters.value.filters.type && {
        type: gameQueryParameters.value.filters.type,
      }),
      ...(gameQueryParameters.value.filters.status && {
        status: gameQueryParameters.value.filters.status,
      }),
      sort_by: gameQueryParameters.value.filters.sort_by,
      sort_direction: gameQueryParameters.value.filters.sort_direction,
    }).toString()

    return api.get(`/games?${queryParams}`)
  }

  return {
    token,
    api,
    postLogin,
    postRegister,
    deleteProfile,
    postLogout,
    getAuthUser,
    postUpdateProfile, // <- adicionado
    getGames,
    gameQueryParameters,
  }
})
