<script setup>

import { useRoute, useRouter } from 'vue-router';
import { store, isAuthenticated, logout, openIpConfigModal, retryConnection, toggleSidenav } from '../store.js';
import { computed } from 'vue';
import { APP_NAME } from '../../backurl.js';

const route = useRoute();
const router = useRouter(); 

console.log(store.clientes)

const title = computed(() => {
    if(route.name === 'login') return `RutasAPP | ${APP_NAME}`; 
    if(route.name === 'dashboard') return `RutasAPP | Dashboard`;
    if(route.name === 'clientes') return 'RutasAPP | Clientes'; 
    if(route.name === 'cliente-detalle') return 'RutasAPP | Clientes';
    if(route.name === 'cliente-cuentas-por-cobrar') return 'RutasAPP | Cliente-CxC';
    if(route.name === 'catalogo') return 'RutasAPP | Catálogo'; 
    if(route.name === 'pedidos') return 'RutasAPP | Lista Pedidos'; 
    if(route.name === 'pedido') return 'RutasAPP | Pedido';
    if(route.name === 'rutas') return 'RutasAPP | Rutas'; 
    return 'App'; 
})

const handleLogout = () => {
    logout();
    router.push('/'); 
}

</script>

<template>
  <header class="app-header">
    <div class="left-section">
      <button v-if="isAuthenticated" @click="toggleSidenav" class="icon-button">
        <!-- Icono SVG para Menú -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <h1 class="title">{{ title }}</h1>
    </div>
    <div class="right-section">
      <!-- Iconos para cuando NO está logueado -->
      <template v-if="!isAuthenticated">
        <!-- <button @click="openIpConfigModal"  class="icon-button">
          
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button> -->
        <button   class="icon-button">
          <!-- Icono SVG para Refrescar -->
          <svg @click="retryConnection" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
        </button>
      </template>
      <!-- Iconos para cuando SÍ está logueado -->
      <template v-else>
        <button @click="retryConnection" class="icon-button">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
        </button>
        <button @click="handleLogout" class="icon-button">
          <!-- Icono SVG para Logout -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  width: 100%;
  height: 60px;
  background-color: #28a745;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-sizing: border-box;
  /* CORRECCIÓN: Añadir flex-shrink para evitar que se encoja */
  flex-shrink: 0;
}
.left-section, .right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}
.title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.icon-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  /* CORRECCIÓN: Alinear los SVG correctamente */
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-button svg {
  width: 24px;
  height: 24px;
}

.is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>