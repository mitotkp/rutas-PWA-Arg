<script setup>
import { store, toggleSidenav, triggerInstallPrompt } from '@/store.js';
import { RouterLink } from 'vue-router';
</script>

<template>
  <!-- La clase 'is-open' se añade o quita dinámicamente para la animación -->
  <aside class="sidenav" :class="{ 'is-open': store.isSidenavOpen }">
    <div class="profile-section">
      <img src="/user-icon-placeholder.png" alt="User Avatar" class="avatar">
      <h3 class="username">{{ store.user?.nombre || 'Usuario' }}</h3>
    </div>
    <nav class="nav-links">
      <RouterLink to="/dashboard" class="nav-link" @click="toggleSidenav">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Dashboard</span>
      </RouterLink>
      <RouterLink to="/clientes" class="nav-link" @click="toggleSidenav">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span>Mis Clientes</span>
      </RouterLink>
      <RouterLink to="/rutas" class="nav-link" @click="toggleSidenav">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        <span>Mis Rutas</span>
      </RouterLink>

      <RouterLink to="/catalogo" class="nav-link" @click="toggleSidenav">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        <span>Catálogo</span>
      </RouterLink>

      <RouterLink to="/pedidos" class="nav-link" @click="toggleSidenav">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V21c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V6.5L15.5 2z"></path><path d="M15 2v5h5"></path><path d="M10 16s.8-1 2-1 2 1 2 1"></path><path d="M10 12s.8-1 2-1 2 1 2 1"></path></svg>
        <span>Pedidos</span>
      </RouterLink>
    </nav>
    <div class="sidenav-footer">
      <!-- 2. Botón de Instalación Personalizado -->
      <!-- Solo se muestra si 'store.showInstallButton' es true -->
      <button v-if="store.showInstallButton" @click="triggerInstallPrompt" class="install-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>
          <span>Instalar Aplicación</span>
      </button>
    
      </div>
  </aside>
</template>

<style scoped>
.sidenav {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100%;
  background-color: #00695c; /* Un verde azulado oscuro */
  color: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  z-index: 5000;
  display: flex;
  flex-direction: column;
}
.sidenav.is-open {
  transform: translateX(0);
}
.profile-section {
  padding: 30px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid white;
  margin-bottom: 10px;
}
.username {
  margin: 0;
  font-weight: 500;
}
.nav-links {
  padding: 15px 0;
}
.nav-link {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  transition: background-color 0.2s;
}
.nav-link:hover, .router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}
.nav-link svg {
  margin-right: 15px;
}
.install-btn {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    text-align: left;
    padding: 15px 20px;
    font-size: 16px;
    font-weight: 500;
    border: none;
    background-color: #28a745; /* Verde de tu marca */
    color: white;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background-color 0.2s;
}
.install-btn:hover {
    background-color: #218838;
}
</style>