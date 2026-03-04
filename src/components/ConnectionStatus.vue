<script setup>
import { store } from '@/store.js';
import { watchEffect } from 'vue';
// 1. Importamos el icono de Lucide
import { WifiOff } from 'lucide-vue-next';

watchEffect(() => {
  store.isOfflineBannerVisible = !store.isServerOnline; 
});
</script>

<template>
  <Transition name="slide-up">
    <div v-if="!store.isServerOnline" class="status-banner">
      <div class="icon-wrapper">
        <WifiOff :size="20" />
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
.icon-wrapper {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
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