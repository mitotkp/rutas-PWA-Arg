<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { store, loadDataIntoMemory, toggleSidenav, restoreSession, isAuthenticated, setInstallPrompt } from './store.js';
import { startHeartbeat } from './services/connectionService.js';

import DynamicHeader from './components/dynamicHeader.vue';
import AlertComponent from './components/alertComponent.vue';
import IpConfigModal from './components/IpConfigModal.vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import SideNav from './components/SideNav.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';

onMounted(() => {
  loadDataIntoMemory();
  startHeartbeat();
  restoreSession();

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenimos que el navegador muestre su propio mini-banner
    e.preventDefault();
    // Guardamos el evento en nuestro store para usarlo después
    setInstallPrompt(e);
    console.log('La PWA es instalable. Evento guardado.');
  });
});
</script>

<template>
  <div id="app-layout">
    <SideNav v-if="isAuthenticated" />
    
    <div v-if="store.isSidenavOpen" @click="toggleSidenav" class="overlay"></div>
    
    <div class="main-content-wrapper">
        <DynamicHeader />
        <main>
          <RouterView />
        </main>
    </div>
    
    <AlertComponent />
    <IpConfigModal />
    <ConnectionStatus />
    <ReloadPrompt />
  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #f7f8fc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 4999; /* Justo debajo del sidenav */
}

.main-content-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>