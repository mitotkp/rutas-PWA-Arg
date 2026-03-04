<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, setPreselectedClient, markClientAsVisited } from '@/store';
import ClientMapModal from '@/components/ClientMapModal.vue';
// 1. Importamos los iconos de Lucide
import { ArrowLeft, Phone, Mail, MapPin, CheckCircle, ShoppingBag, DollarSign } from 'lucide-vue-next';

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
        <ArrowLeft :size="24" />
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
      
      <div class="info-grid" style="margin-top: 15px;">
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

    <div class="card">
      <div class="card-header">
        <h2>Contacto y Ubicación</h2>
      </div>
      <div class="info-list">
        <div class="info-row">
          <Phone :size="20" />
          <span>{{ cliente.telefono1 || 'No disponible' }}</span>
        </div>
        <div class="info-row">
          <Mail :size="20" />
          <span>{{ cliente.email || 'No disponible' }}</span>
        </div>
        <div class="info-row">
          <MapPin :size="20" />
          <span>{{ cliente.direccion }}</span>
        </div>
      </div>
    </div>
    
    <div class="actions-grid">
       <button class="action-button check-in" @click="markClientAsVisited(cliente.codCliente)">
         <CheckCircle :size="24" />
         <span>MARCAR VISITA</span>
       </button>
       <button class="action-button location" @click="openMapModal">
         <MapPin :size="24" />
         <span>UBICACIÓN</span>
       </button>
       <button class="action-button order" @click="goToCatalog">
         <ShoppingBag :size="24" />
         <span>REALIZAR PEDIDO</span>
       </button>
       <button class="action-button payment" @click="goToCuentas">
         <DollarSign :size="24" />
         <span>PAGOS PENDIENTES</span>
       </button>
     </div>
  </div>
  
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
.detail-container { padding: 20px; background-color: #f4f7f9; flex-grow: 1; }
.view-header { display: flex; align-items: center; margin-bottom: 20px; }
/* Aseguramos que el botón de retroceso esté centrado si cambias de icono */
.back-button { 
  background: none; border: none; cursor: pointer; margin-right: 15px; color: #333; 
  display: flex; align-items: center; justify-content: center;
}
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