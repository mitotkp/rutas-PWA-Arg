<script setup>
import { store } from '@/store.js';
import { watchEffect } from 'vue';

watchEffect(() => {
  store.isOfflineBannerVisible = !store.isServerOnline; 
});

</script>

<template>
  <Transition name="slide-up">
    <div v-if="!store.isServerOnline" class="status-banner">
      <div class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
          <path d="M5 12.55a8 8 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a4 4 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      </div>
      <p>Sin conexión. Trabajando en modo local.</p>
    </div>
  </Transition>
</template>

<style scoped>
.status-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #718096; /* Gris oscuro */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 500;
  z-index: 3000;
}
.icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
}
p {
  margin: 0;
}

/* Transición para que aparezca desde abajo */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.5s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>