<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCxCByCliente, getCliente } from '@/database.js';

const route = useRoute();
const router = useRouter();

const cliente = ref(null);
const cuentas = ref([]);

// --- onMounted CORREGIDO ---
onMounted(async () => {
  const clienteId = Number(route.params.id);
  if (clienteId) {
    // Se le pasa a Promise.all un array de promesas (sin el 'await' adentro).
    // El 'await' va afuera, esperando a que todas se resuelvan.
    const [clienteData, cuentasData] = await Promise.all([
      getCliente(clienteId),
      getCxCByCliente(clienteId)
    ]);
    cliente.value = clienteData;
    cuentas.value = cuentasData;
  }
});

// --- Lógica simplificada: ya no necesitamos 'selectedCuentas' ni 'totalSeleccionado' ---
const totalDeuda = computed(() => {
  return cuentas.value.reduce((sum, cuenta) => sum + cuenta.deuda, 0);
});

function isOverdue(fechaVencimiento) {
  return new Date(fechaVencimiento) < new Date();
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-VE', options);
}

function goBack() {
  router.back();
}
</script>

<template>
  <div class="cuentas-container" v-if="cliente">
    <div class="view-header">
      <button @click="goBack" class="back-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <div>
        <h1>Cuentas por Cobrar</h1>
        <p class="client-name-subtitle">{{ cliente.nombreComercial }}</p>
      </div>
    </div>

    <div class="summary-card">
      <span>Deuda Total</span>
      <strong>{{ totalDeuda.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</strong>
      <small>{{ cuentas.length }} Documentos Pendientes</small>
    </div>

    <div class="cuentas-list">
      <div v-for="cuenta in cuentas" :key="cuenta.documento" class="cuenta-card">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <div class="cuenta-info">
          <div class="info-header">
            <strong class="documento">{{ cuenta.documento }}</strong>
            <strong class="deuda">{{ cuenta.deuda.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</strong>
          </div>
          <div class="info-footer">
            <span>Vence: {{ formatDate(cuenta.fechaVencimiento) }}</span>
            <span v-if="isOverdue(cuenta.fechaVencimiento)" class="overdue-badge">Vencido</span>
          </div>
        </div>
      </div>
      <div v-if="cuentas.length === 0" class="no-results">
        <p>Este cliente no tiene pagos pendientes.</p>
      </div>
    </div>

    </div>
  <div v-else class="loading">
    <p>Cargando datos del cliente...</p>
  </div>
</template>

<style scoped>
.cuentas-container {
  padding: 20px;
  background-color: #f4f7f9;
  flex-grow: 1;
}
.view-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.back-button {
  background: none; border: none; cursor: pointer; margin-right: 15px; color: #333;
}
.view-header h1 {
  font-size: 22px; font-weight: 600; margin: 0;
}
.client-name-subtitle {
  font-size: 14px; color: #718096; margin: 2px 0 0 0;
}
.summary-card {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}
.summary-card span {
  display: block; font-size: 14px; opacity: 0.8;
}
.summary-card strong {
  display: block; font-size: 32px; font-weight: 700; margin: 5px 0;
}
.summary-card small {
  display: block; font-size: 12px; opacity: 0.7;
}
.cuentas-list {
  display: flex; flex-direction: column; gap: 10px;
}
.cuenta-card {
  display: flex; align-items: center; background-color: white;
  padding: 15px; border-radius: 10px;
  gap: 15px; /* Espacio entre el nuevo icono y la info */
}
.icon-container {
    flex-shrink: 0;
    color: #718096;
}
.cuenta-info {
  flex-grow: 1;
}
.info-header, .info-footer {
  display: flex; justify-content: space-between; align-items: center;
}
.documento {
  font-weight: 600; color: #2d3748;
}
.deuda {
  font-weight: 700; font-size: 16px; color: #2c3e50;
}
.info-footer {
  margin-top: 8px; font-size: 12px; color: #718096;
}
.overdue-badge {
  background-color: #fed7d7; color: #9b2c2c;
  padding: 2px 6px; border-radius: 10px; font-weight: bold;
}
.no-results {
  text-align: center; padding: 40px; color: #718096;
}
.loading {
  text-align: center; padding: 50px; color: #718096;
}
</style>