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

    return response.data // <-- precisa ter { user: ..., message: ... }
  }


  const deleteProfile = (password) => {
    if (!token.value) throw new Error('Usuário não autenticado')
    return api.delete('/profile/delete', { data: { password } })
  }

  const postCreateAdmin = async (adminData) => {
    if (!token.value) throw new Error('Usuário não autenticado');

    // FormData para enviar avatar + dados
    const data = new FormData();
    Object.keys(adminData).forEach((key) => {
      if (adminData[key] !== null && adminData[key] !== undefined) {
        data.append(key, adminData[key]);
      }
    });

    const response = await api.post('/admin/create-user', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token.value}`,
      },
    });

    return response.data; // { user: {...} }
  };

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

  // -----------------------------
  // Loja de Coins
  // -----------------------------
  const postBuyCoins = async (payload) => {
    // payload: { euros, type, reference }
    const response = await api.post('/coins/purchase', {
      value: payload.euros,      // backend espera "value"
      type: payload.type,        // MBWAY/PAYPAL/IBAN/MB/VISA
      reference: payload.reference,
    })
    return response
  }

  const getBalance = () => {
    return api.get('/coins/balance')
  }

  return {
    token,
    api,
    postLogin,
    postRegister,
    deleteProfile,
    postLogout,
    postCreateAdmin,
    getAuthUser,
    postUpdateProfile, // <- adicionado
    getGames,
    gameQueryParameters,
    postBuyCoins,
    getBalance,
  }
})
