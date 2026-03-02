<script setup>

import { store } from '../store.js';
import { computed } from 'vue';

//Clase dinamica segun el tipo de alerta 
const alertClass = computed(() => {
    return store.alert.type === 'error' ? 'alert-error' : 'alert-success'; 
})

</script>

<template>
  <Transition name="slide-fade">
    <div v-if="store.alert.show" class="alert-box" :class="alertClass">
      {{ store.alert.message }}
      <span class="close-btn" @click="store.alert.show = false">&times;</span>
    </div>
  </Transition>
</template>

<style scoped>
.alert-box {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 25px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-error {
  background-color: #e53e3e; /* Rojo */
}

.alert-success {
  background-color: #38a169; /* Verde */
}

.close-btn {
  margin-left: 20px;
  cursor: pointer;
  font-size: 22px;
  font-weight: bold;
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