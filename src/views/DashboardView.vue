<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '@/store.js';
import { getTotalDeudaVendedor, countPedidosDeHoy } from '@/database';
import QuickPedidoModal from '@/components/QuickPedidoModal.vue';

// Calcula el total de la deuda de todos los clientes
let totalCuentasPorCobrar = ref(null)
const pedidosDeHoy = ref(0); 
const isLoading = ref(true); 
const quickPedidoModalVisible = ref(false)

async function loadDashboard(vendedor) {
   if (vendedor && vendedor.codVendedor) {
    isLoading.value = true;
    // Usamos Promise.all para ejecutar ambas consultas en paralelo
    const [totalDeuda, totalPedidosHoy] = await Promise.all([
      getTotalDeudaVendedor(vendedor.codVendedor),
      countPedidosDeHoy(vendedor.codVendedor)
    ]);
    
    totalCuentasPorCobrar.value = totalDeuda;
    pedidosDeHoy.value = totalPedidosHoy; // 2. Actualizamos el nuevo estado
    isLoading.value = false;
  }
}

watch(() => store.user, (newUser) => {
  loadDashboard(newUser)
}, {
  immediate: true,
  deep: true
})

// Obtiene solo el primer nombre del vendedor para un saludo más personal
const nombreVendedor = computed(() => {
  return store.user?.nombre?.split(' ')[0] || 'Vendedor';
});

// Obtiene la primera ruta del vendedor como la "ruta principal" del día
const rutaPrincipal = computed(() => {
  if (!store.user) return null;
  return store.rutas.find(ruta => ruta.codVendedor === store.user.codVendedor);
});

// Cuenta los clientes asignados a la ruta principal
const clientesEnRuta = computed(() => {
  if (!rutaPrincipal.value) return 0;
  return store.clientes.filter(cliente => cliente.codRuta === rutaPrincipal.value.codRuta).length;
});

// Formatea la fecha actual
const fechaActual = computed(() => {
    return new Date().toLocaleDateString('es-VE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

const totalCuentasFormateado = computed(() => {
  // Obtenemos el valor actual del ref
  const valor = totalCuentasPorCobrar.value;

  // Si el valor todavía es null o no es un número, mostramos '0,00'
  if (typeof valor !== 'number') {
    return '0,00';
  }

  // Si ya tenemos un número, lo formateamos correctamente
  return valor.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

console.log(totalCuentasPorCobrar)

const router = useRouter();
</script>

<template>
  <div class="dashboard-container">
    <div class="header">
      <h1 class="greeting">Hola, {{ nombreVendedor }}</h1>
      <p class="subtitle">{{ fechaActual }}</p>
    </div>

    <!-- Tarjeta de Acción Principal -->
    <div class="card primary-card">
      <div class="card-header">
        <h2>Mi Ruta de Hoy</h2>
      </div>
      <div class="card-content">
        <p class="route-name">{{ rutaPrincipal?.descripcion || 'Sin ruta asignada' }}</p>
        <div class="stats">
          <div class="stat-item">
            <span>Clientes</span>
            <strong>{{ clientesEnRuta }}</strong>
          </div>
          <button class="action-button" @click="router.push({ name: 'rutas' })">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Iniciar Ruta</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tarjetas de Métricas -->
    <div class="metrics-grid">
        <div class="card metric-card">
            <h3>Cuentas por Cobrar</h3>
            <p v-if="isLoadingDebt" class="metric-value">Calculando...</p>
            <p v-else class="metric-value debt">{{ totalCuentasFormateado }}</p>
        </div>
        <div class="card metric-card">
            <h3>Pedidos de Hoy</h3>
            <p class="metric-value orders">{{ pedidosDeHoy }}</p>
        </div>
    </div>

    <!-- Cuadrícula de Acciones Rápidas -->
    <h2 class="section-title">Acciones Rápidas</h2>
    <div class="quick-actions-grid">
        <RouterLink to="/clientes" class="quick-actions-link">
            <div class="card action-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Mis Clientes</span>
            </div>
        </RouterLink>
        <RouterLink to="/catalogo" class="quick-actions-link">
          <div class="card action-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="22" height="12" rx="2" ry="2"></rect><path d="M6 12h12"></path></svg>
            <span>Catálogo</span>
          </div>
        </RouterLink>
      
        <div @click="quickPedidoModalVisible = true" class="card action-card" >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
          <span>Crear Pedido</span>
        </div>

     
    </div>
  </div>

   <QuickPedidoModal
      :is-visible="quickPedidoModalVisible"
      @close="quickPedidoModalVisible = false"
    />
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f4f7f9;
  flex-grow: 1;
}

.quick-actions-link{
    text-decoration: none;
}

.header {
  margin-bottom: 20px;
}
.greeting {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}
.subtitle {
  font-size: 16px;
  color: #718096;
  margin: 4px 0 0 0;
  text-transform: capitalize;
}
.card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}
.primary-card {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.card-header h2 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}
.route-name {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 15px 0;
}
.stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-item span {
  font-size: 14px;
  opacity: 0.8;
  display: block;
}
.stat-item strong {
  font-size: 32px;
  font-weight: bold;
}
.action-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.action-button:hover {
  background-color: #218838;
}
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}
.metric-card h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
.metric-value {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}
.metric-value.debt { color: #e74c3c; }
.metric-value.orders { color: #2980b9; }

.section-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  margin-top: 10px;
}
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
}
.action-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
  padding: 20px 15px;
}
.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.action-card svg {
  margin-bottom: 10px;
  color: #34495e;
}
.action-card span {
  font-weight: 500;
  color: #333;
}

@media (min-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr); 
  }

  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .dashboard-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 30px;
  }
}
</style>