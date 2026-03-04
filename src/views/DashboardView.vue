<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '@/store.js';
import { getTotalDeudaVendedor, countPedidosDeHoy } from '@/database';
import QuickPedidoModal from '@/components/QuickPedidoModal.vue';
// 1. Importar los iconos de Lucide
import { Play, Users, BookOpen, FilePlus } from 'lucide-vue-next';

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
            <Play :size="20" />
            <span>Iniciar Ruta</span>
          </button>
        </div>
      </div>
    </div>

    <div class="metrics-grid">
        <div class="card metric-card">
            <h3>Cuentas por Cobrar</h3>
            <p v-if="isLoading" class="metric-value">Calculando...</p>
            <p v-else class="metric-value debt">{{ totalCuentasFormateado }}</p>
        </div>
        <div class="card metric-card">
            <h3>Pedidos de Hoy</h3>
            <p class="metric-value orders">{{ pedidosDeHoy }}</p>
        </div>
    </div>

    <h2 class="section-title">Acciones Rápidas</h2>
    <div class="quick-actions-grid">
        <RouterLink to="/clientes" class="quick-actions-link">
            <div class="card action-card">
                <Users :size="24" />
                <span>Mis Clientes</span>
            </div>
        </RouterLink>
        <RouterLink to="/catalogo" class="quick-actions-link">
          <div class="card action-card">
            <BookOpen :size="24" />
            <span>Catálogo</span>
          </div>
        </RouterLink>
      
        <div @click="quickPedidoModalVisible = true" class="card action-card" >
          <FilePlus :size="24" />
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
  /* IMPORTANTE: Añadimos flexbox para asegurar que el contenido se centre correctamente con Lucide */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
/* Modificamos esta clase para apuntar directamente a los iconos de Lucide (que generan un svg interno) */
.action-card > svg {
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