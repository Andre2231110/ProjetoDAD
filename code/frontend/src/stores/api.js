import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  // 1. Tentar recuperar o token do localStorage logo no arranque
  const token = ref(localStorage.getItem('token'))

  // 2. Se houver um token guardado, configurar o Axios imediatamente
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  // AUTH
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    token.value = response.data.token
    
    // Guardar no localStorage para sobreviver ao F5
    localStorage.setItem('token', token.value)
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return response // Importante retornar para o authStore
  }

  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/logout`)
    token.value = undefined
    
    // Limpar do localStorage
    localStorage.removeItem('token')
    
    delete axios.defaults.headers.common['Authorization']
  }

  // Resto das funções (getAuthUser, getGames...) mantém-se igual
  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  //Games
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
    return axios.get(`${API_BASE_URL}/games?${queryParams}`)
  }

  return {
    token,
    postLogin,
    postLogout,
    getAuthUser,
    getGames,
    gameQueryParameters,
  }
})
