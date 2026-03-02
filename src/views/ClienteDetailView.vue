<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, setPreselectedClient, markClientAsVisited } from '@/store';
import ClientMapModal from '@/components/ClientMapModal.vue';

const route = useRoute();
const router = useRouter();
const isMapModalVisible = ref(false); 

const cliente = computed(() => {
  const clienteId = Number(route.params.id);
  if (!clienteId || store.clientes.length === 0) {
    return null;
  }
  return store.clientes.find(c => c.codCliente === clienteId);
});

const lastVisitedDate = computed(() => {
  if(!cliente.value?.lastVisited) return 'Nunca'; 
  const date = new Date(cliente.value.lastVisited); 
  
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

function goBack() {
  router.back(); 
}

function goToCuentas() {
    if (cliente.value) {
        router.push({ name: 'cliente-cuentas-por-cobrar', params: { id: cliente.value.codCliente } });
    }
}

function goToCatalog() {
  if (cliente.value) {
    setPreselectedClient(cliente.value.codCliente);
    router.push({ name: 'catalogo' });
  }
}

function openMapModal() {
  isMapModalVisible.value = true; 
}

</script>

<template>

  <div class="detail-container" v-if="cliente">
    <div class="view-header">
      <button @click="goBack" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <h1>{{ cliente.nombreComercial }}</h1>
    </div>

  
    <div class="card">
      <div class="card-header">
        <h2>Datos Principales</h2>
      </div>
       <div class="info-grid">
        <div class="info-item">
          <span>Última Visita</span>
          <strong>{{ lastVisitedDate }}</strong>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <span>Nombre Fiscal</span>
          <strong>{{ cliente.nombre }}</strong>
        </div>
        <div class="info-item">
          <span>Cod. Cliente</span>
          <strong>{{ cliente.codCliente }}</strong>
        </div>
        <div class="info-item">
          <span>RIF</span>
          <strong>{{ cliente.rif }}</strong>
        </div>
        <div class="info-item">
          <span>Estado</span>
          <span :class="cliente.bloqueado ? 'status-inactive' : 'status-active'">
            {{ cliente.bloqueado ? 'Bloqueado' : 'Activo' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tarjeta de Contacto y Ubicación -->
    <div class="card">
      <div class="card-header">
        <h2>Contacto y Ubicación</h2>
      </div>
      <div class="info-list">
        <div class="info-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>{{ cliente.telefono1 || 'No disponible' }}</span>
        </div>
        <div class="info-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
          <span>{{ cliente.email || 'No disponible' }}</span>
        </div>
        <div class="info-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>{{ cliente.direccion }}</span>
        </div>
      </div>
    </div>
    
    <!-- Acciones Principales -->
     <div class="actions-grid">
        <button class="action-button check-in" @click="markClientAsVisited(cliente.codCliente)">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
         <span>MARCAR VISITA</span>
       </button>
       <button class="action-button location" @click="openMapModal">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
         <span>UBICACIÓN</span>
       </button>
       <button class="action-button order" @click="goToCatalog">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
         <span>REALIZAR PEDIDO</span>
       </button>
       <button class="action-button payment" @click="goToCuentas">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
         <span>PAGOS PENDIENTES</span>
       </button>
     </div>
  </div>
  <!-- Pantalla de carga mientras se busca el cliente -->
  <div v-else class="loading">
    <p>Cargando datos del cliente...</p>
  </div>

  <ClientMapModal 
    :is-visible="isMapModalVisible"
    :cliente="cliente"
    @close="isMapModalVisible = false"
  />
</template>

<style scoped>
/* Tus estilos no necesitan cambios */
.detail-container { padding: 20px; background-color: #f4f7f9; flex-grow: 1; }
.view-header { display: flex; align-items: center; margin-bottom: 20px; }
.back-button { background: none; border: none; cursor: pointer; margin-right: 15px; color: #333; }
.view-header h1 { font-size: 22px; font-weight: 600; margin: 0; }
.card { background-color: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); margin-bottom: 20px; }
.card-header h2 { font-size: 16px; font-weight: 600; color: #555; margin: 0 0 15px 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.info-item { display: flex; flex-direction: column; }
.info-item span { font-size: 14px; color: #718096; }
.info-item strong { font-size: 15px; color: #2d3748; font-weight: 500; }
.info-list { display: flex; flex-direction: column; gap: 15px; }
.info-row { display: flex; align-items: center; font-size: 15px; color: #2d3748; }
.info-row svg { margin-right: 10px; color: #718096; flex-shrink: 0; }
.status-active { color: #2f855a; font-weight: bold; }
.status-inactive { color: #9b2c2c; font-weight: bold; }
.actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
.action-button { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; border-radius: 10px; border: none; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.2s; color: white; }
.action-button:hover { transform: translateY(-3px); }
.action-button span { margin-top: 10px; font-weight: 600; font-size: 12px; }
.action-button.location { background-color: #e67e22; }
.action-button.order { background-color: #e74c3c; }
.action-button.payment { background-color: #2ecc71; }
.loading { text-align: center; padding: 50px; color: #718096; }
.action-button.check-in { background-color: #3498db; }
</style>