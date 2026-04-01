import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let _id = 0;

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);

  function add(message: string, type: Notification['type'] = 'info', duration = 4000) {
    const id = ++_id;
    notifications.value.push({ id, message, type });
    setTimeout(() => remove(id), duration);
  }

  function remove(id: number) {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }

  return { notifications, add, remove };
});
