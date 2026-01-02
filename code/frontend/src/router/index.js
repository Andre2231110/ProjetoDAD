import HomePage from '@/pages/home/HomePage.vue'
import LobbyPage from '@/pages/game/LobbyPage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
import GamePage from '@/pages/game/GamePage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminPage from '@/pages/admin/AdminPage.vue'
import TransacoesAdmin from '@/pages/admin/TransacoesAdmin.vue'
import MatchPartidasAdmin from '@/pages/admin/MatchPartidasAdmin.vue'
import SumStatistics from '@/pages/admin/SumStatistics.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'HomePage',
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
      path: '/admin/history',
      name: 'AdminHistory',
      component: () => import('@/pages/history/HistoryAdminPage.vue'), 
      meta: { requiresAuth: true, requiresAdmin: true } 
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('@/pages/ranking/RankingPage.vue'),
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
      path: '/administration',
      name: 'Administration',
      component: AdminPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop',
      name: 'Shop',
      component: () => import('@/pages/shop/ShopPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/transacoes',
      name: 'TransacoesAdmin',
      component: TransacoesAdmin,
    },
    {
      path: '/admin/match-partidas',
      name: 'MatchPartidasAdmin',
      component: MatchPartidasAdmin,
    },
    {
      path: '/admin/summary-stats',
      name: 'SummaryStatsAdmin',
      component: SumStatistics,
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
