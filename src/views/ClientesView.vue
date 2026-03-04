<script setup>
import { ref, computed } from 'vue';
import { store } from '@/store.js';
import ClienteActionModal from '@/components/ClienteActionModal.vue';
// 1. Importamos los iconos de Lucide
import { Search, User, Check } from 'lucide-vue-next';

const searchTerm = ref(''); 
const selectedClient = ref(null); 
const isModalVisible = ref(false); 

// Esto es una propiedad computada que obtiene solo los clientes del vendedor logueado.
const clientesDelVendedor = computed(() => {
  if (!store.user || !store.rutas || !store.clientes) {
    return [];
  }

  const misRutasIds = store.rutas
    .filter(ruta => ruta.codVendedor === store.user.codVendedor)
    .map(ruta => ruta.codRuta);

  return store.clientes.filter(cliente => misRutasIds.includes(cliente.codRuta));
});

const filteredClients = computed(() => {
  const trimmedSearch = searchTerm.value.trim().toLowerCase();

  if (!trimmedSearch) {
    return clientesDelVendedor.value; 
  }

  return clientesDelVendedor.value.filter(cliente => {
    const nombre = String(cliente.nombreComercial || '').toLowerCase();
    const rif = String(cliente.rif || '').toLowerCase();
    const alias = String(cliente.alias || '').toLowerCase();

    return (
      nombre.includes(trimmedSearch) ||
      rif.includes(trimmedSearch) ||
      alias.includes(trimmedSearch)
    );
  });
});

function openActionModal(cliente) {
  selectedClient.value = cliente;
  isModalVisible.value = true;
}

function closeActionModal() {
  isModalVisible.value = false;
  selectedClient.value = null;
}

function wasVisitedToday(cliente) {
  if(!cliente.lastVisited) return false; 
  const visitDate = new Date(cliente.lastVisited); 
  const today = new Date(); 

  return visitDate.toDateString() === today.toDateString(); 
}
</script>

<template>
  <div class="clientes-container">
    <div class="header">
      <h1>Mis Clientes Asignados</h1>
      <div class="search-wrapper">
        <input type="text" v-model="searchTerm" placeholder="Buscar en mis clientes..." class="search-input">
        <Search class="search-icon" :size="20" />
      </div>
    </div>

    <div class="client-list">
      <div v-for="(cliente, index) in filteredClients" :key="`${cliente.codCliente}-${index}`" class="client-card" @click="openActionModal(cliente)">
        <div class="client-avatar">
          <div v-if="wasVisitedToday(cliente)" class="visited-indicator">
            <Check :size="16" color="white" :stroke-width="3" />
          </div>
          <User :size="32" />
        </div>
        <div class="client-info">
          <h2 class="client-name">{{ cliente.nombreComercial }}</h2>
          <p class="client-details">RIF: {{ cliente.rif }}</p>
          <p v-if="cliente.telefono1" class="client-details">Telf: {{ cliente.telefono1 }}</p>
        </div>
        <div class="client-status">
          <span :class="cliente.bloqueado ? 'status-inactive' : 'status-active'">
            {{ cliente.bloqueado ? 'Bloqueado' : 'Activo' }}
          </span>
        </div>
      </div>
      <div v-if="clientesDelVendedor.length === 0" class="no-results">
        <p>No tienes clientes asignados.</p>
      </div>
      <div v-else-if="filteredClients.length === 0 && searchTerm" class="no-results">
        <p>No se encontraron clientes para "<strong>{{ searchTerm }}</strong>".</p>
      </div>
    </div>

    <ClienteActionModal
      :is-visible="isModalVisible"
      :cliente="selectedClient"
      @close="closeActionModal"
    />
  </div>
</template>

<style scoped>
.clientes-container {
  padding: 20px;
  background-color: #f4f7f9;
  flex-grow: 1;
}
.header {
  margin-bottom: 20px;
}
.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 15px 0;
}
.search-wrapper {
  position: relative;
}
.search-input {
  width: 100%;
  padding: 12px 15px 12px 40px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  box-sizing: border-box;
  margin-bottom: 10px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 38%;
  transform: translateY(-50%);
  color: #718096;
}
.client-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.client-card {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.client-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.client-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  margin-right: 15px;
  flex-shrink: 0;
  position: relative;
}
.client-info {
  flex-grow: 1;
}
.client-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #2d3748;
}
.client-details {
  font-size: 14px;
  color: #718096;
  margin: 0;
}
.client-status span {
  font-size: 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 12px;
}
.status-active {
  color: #2f855a;
  background-color: #c6f6d5;
}
.status-inactive {
  color: #9b2c2c;
  background-color: #fed7d7;
}
.no-results {
  text-align: center;
  padding: 40px;
  color: #718096;
}
.visited-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  background-color: #28a745;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}
</style>