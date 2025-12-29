import HomePage from '@/pages/home/HomePage.vue'
import LobbyPage from '@/pages/game/LobbyPage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
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
      meta: { requiresAuth: true },
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
      meta: { requiresAuth: true },
    },
    {
      path: '/register',
      name: 'RegisterPage',
      component: () => import('@/pages/register/RegisterPage.vue'),
    },
    {
      path: '/profile',
      name: 'Profile',
      component: ProfilePage,
      meta: { requiresAuth: true },
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

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return '/login'
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    return '/lobby'
  }
})

export default router
