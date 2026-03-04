<script setup>
import { useRoute, useRouter } from 'vue-router';
import { store, isAuthenticated, logout, openIpConfigModal, retryConnection, toggleSidenav } from '../store.js';
import { computed } from 'vue';
import { APP_NAME } from '../../backurl.js';
// 1. Importamos los iconos de Lucide
import { Menu, RefreshCw, LogOut, Settings } from 'lucide-vue-next';

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
        <Menu :size="24" />
      </button>
      <h1 class="title">{{ title }}</h1>
    </div>
    <div class="right-section">
      
      <template v-if="!isAuthenticated">
        <button @click="retryConnection" class="icon-button">
          <RefreshCw :size="24" />
        </button>
      </template>

      <template v-else>
        <button @click="retryConnection" class="icon-button">
           <RefreshCw :size="24" />
        </button>
        <button @click="handleLogout" class="icon-button">
          <LogOut :size="24" />
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
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Al usar el prop :size="24" en los componentes, esta regla ya no es estrictamente necesaria 
   para el tamaño, pero se mantiene por si añades iconos sin tamaño definido */
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