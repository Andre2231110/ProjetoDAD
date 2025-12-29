import HomePage from '@/pages/home/HomePage.vue'
import LobbyPage from '@/pages/game/LobbyPage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import GamePage from '@/pages/game/GamePage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/login',
      component: LoginPage,
    },
    {
      path: '/lobby',
      component: LobbyPage,
    },
    {
      path: '/game',
      name: 'Game',
      component: GamePage,
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/history/HistoryPage.vue'),
      meta: { requiresAuth: true } 
    },
    {
      path: '/testing',
      children: [
        {
          path: 'laravel',
          component: LaravelPage,
        },
        {
          path: 'websockets',
          component: WebsocketsPage,
        },
      ],
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Se o Pinia está vazio mas achamos que o user pode estar logado (página refrescada)
  if (!authStore.isLoggedIn) {
    try {
      // Tentamos recuperar o utilizador da API antes de carregar a rota
      await authStore.getUser()
    } catch (error) {
      // Não estava logado no servidor, não fazemos nada
    }
  }

  // 2. Proteção de rotas: Se a rota for o Lobby e o user continuar a não estar logado
  if (to.path === '/lobby' && !authStore.isLoggedIn) {
    next('/login') // Força o login
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/lobby') // Se já está logado e vai para o login, manda para o lobby
  } else {
    next() // Deixa passar
  }
})

export default router
