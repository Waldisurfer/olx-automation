import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/auth', component: () => import('@/views/AuthView.vue') },
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/listings/new', component: () => import('@/views/NewListingView.vue'), meta: { requiresAuth: true } },
    { path: '/listings/:id', component: () => import('@/views/ListingDetailView.vue'), meta: { requiresAuth: true } },
    { path: '/settings', component: () => import('@/views/SettingsView.vue'), meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/auth';
  if (to.path === '/auth' && auth.isAuthenticated) return '/dashboard';
});

export default router;
