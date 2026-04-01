import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '@/api/ApiClient.js';

interface User { id: number; email: string; }

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'));
  const user = ref<User | null>(JSON.parse(localStorage.getItem('authUser') ?? 'null'));
  const sessionId = ref<string>(localStorage.getItem('sessionId') ?? '');

  const isLoggedIn = computed(() => !!token.value);
  const isGuest = computed(() => !token.value && !!sessionId.value);
  const isAuthenticated = computed(() => isLoggedIn.value || isGuest.value);

  function initGuest() {
    if (!sessionId.value) {
      sessionId.value = uuidv4();
      localStorage.setItem('sessionId', sessionId.value);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await apiClient.post('/users/login', { email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
  }

  async function register(email: string, password: string) {
    const { data } = await apiClient.post('/users/register', { email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // keep sessionId so guest session is preserved
  }

  return { token, user, sessionId, isLoggedIn, isGuest, isAuthenticated, initGuest, login, register, logout };
});
