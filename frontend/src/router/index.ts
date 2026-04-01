import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/listings/new', component: () => import('@/views/NewListingView.vue') },
    { path: '/listings/:id', component: () => import('@/views/ListingDetailView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
  ],
});

export default router;
