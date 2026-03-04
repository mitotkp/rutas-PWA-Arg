<script setup>
import { store, toggleSidenav, triggerInstallPrompt } from '@/store.js';
import { RouterLink } from 'vue-router';
// 1. Importaciones de Lucide actualizadas
import { Home, Users, Truck, BookOpen, FileText, CloudDownload } from 'lucide-vue-next'
</script>

<template>
  <aside class="sidenav" :class="{ 'is-open': store.isSidenavOpen }">
    <div class="profile-section">
      <img src="/user-icon-placeholder.png" alt="User Avatar" class="avatar">
      <h3 class="username">{{ store.user?.nombre || 'Usuario' }}</h3>
    </div>
    
    <nav class="nav-links">
      <RouterLink to="/dashboard" class="nav-link" @click="toggleSidenav">
        <Home :size="20" />
        <span>Dashboard</span>
      </RouterLink>
      
      <RouterLink to="/clientes" class="nav-link" @click="toggleSidenav">
        <Users :size="20" />
        <span>Mis Clientes</span>
      </RouterLink>
      
      <RouterLink to="/rutas" class="nav-link" @click="toggleSidenav">
        <Truck :size="24" />
        <span>Mis Rutas</span>
      </RouterLink>

      <RouterLink to="/catalogo" class="nav-link" @click="toggleSidenav">
        <BookOpen :size="20" />
        <span>Catálogo</span>
      </RouterLink>

      <RouterLink to="/pedidos" class="nav-link" @click="toggleSidenav">
        <FileText :size="20" />
        <span>Pedidos</span>
      </RouterLink>
    </nav>
    
    <div class="sidenav-footer">
      <button v-if="store.showInstallButton" @click="triggerInstallPrompt" class="install-btn">
          <CloudDownload :size="20" />
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
  background-color: #00695c;
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
.sidenav-footer {
  margin-top: auto; 
  padding: 20px;
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
    background-color: #28a745;
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