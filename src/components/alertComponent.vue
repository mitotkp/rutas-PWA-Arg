<script setup>
import { store } from '../store.js';
import { computed } from 'vue';
// 1. Importamos los iconos
import { X, CheckCircle, AlertCircle } from 'lucide-vue-next';

// Clase dinamica segun el tipo de alerta 
const alertClass = computed(() => {
  return store.alert.type === 'error' ? 'alert-error' : 'alert-success'; 
})

// 2. Icono dinámico según el tipo de alerta
const AlertIcon = computed(() => {
  return store.alert.type === 'error' ? AlertCircle : CheckCircle;
})
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="store.alert.show" class="alert-box" :class="alertClass">
      
      <component :is="AlertIcon" :size="20" class="alert-icon" />
      
      <span class="alert-message">{{ store.alert.message }}</span>
      
      <span class="close-btn" @click="store.alert.show = false">
        <X :size="20" />
      </span>
      
    </div>
  </Transition>
</template>

<style scoped>
.alert-box {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  /* Mejoramos la distribución usando gap */
  gap: 12px; 
  min-width: 300px;
  max-width: 90%;
}

.alert-message {
  flex-grow: 1; /* Permite que el texto tome todo el espacio disponible en el centro */
  font-size: 15px;
}

.alert-error {
  background-color: #e53e3e; /* Rojo */
}

.alert-success {
  background-color: #38a169; /* Verde */
}

.alert-icon {
  flex-shrink: 0; /* Evita que el icono se aplaste si el mensaje es muy largo */
}

.close-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  opacity: 1;
}

/* Transiciones */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translate(-50%, -100px);
  opacity: 0;
}
</style>