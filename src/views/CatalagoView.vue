<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { store, syncCatalogo, setAlert, setPreselectedClient, iniciarOAgregarItem, totalItemsPedido, setPedidoCliente } from '@/store.js';
import { db } from '@/database.js';
import FiltroCatalogoModal from '@/components/FiltroCatalogoModal.vue';
import ProductDetailModal from '@/components/ProductDetailModal.vue';
// 1. Importamos los iconos de Lucide
import { RefreshCw, ShoppingCart, Filter, CheckCircle, Image as ImageIcon, Search, Loader2 } from 'lucide-vue-next';

const router = useRouter(); 

// --- ESTADO LOCAL ---
const searchTerm = ref('');
const productosMostrados = ref([]);
const stockFilter = ref('todos');
const isFilterModalVisible = ref(false);
const advancedFilters = ref({
  departamento: null,
  marca: null
});
const selectedProduct = ref(null);
const isProductModalVisible = ref(false);

// --- CONEXIÓN AL ESTADO GLOBAL DEL CLIENTE ---
const selectedClientId = computed({
  get() {
    return store.pedido.cliente?.codCliente || null;
  },
  set(newClientId) {
    const newClient = store.clientes.find(c => c.codCliente === newClientId);
    if (newClient) {
      setPedidoCliente(newClient);
    }
  }
});

const selectedClient = computed(() => {
    if (!selectedClientId.value) return null;
    return store.clientes.find(c => c.codCliente === selectedClientId.value);
});

// --- LÓGICA DE DATOS ---
async function buildProductList(tariffId = 2) {
    const articulos = await db.articulos.toArray();
    const stock = await db.stock.toArray();
    const precios = await db.precios.toArray();
    const marcas = await db.marca.toArray();

    if (articulos.length === 0) {
        productosMostrados.value = [];
        return;
    }

    const stockMap = new Map(stock.map(item => [item.codArticulo, item.stock]));
    const preciosMap = new Map(precios.map(item => [`${item.codArticulo}-${item.idTarifa}`, item.precio]));
    const marcasMap = new Map(marcas.map(item => [item.marca, item.nombreMarca]));

    const listaCompleta = articulos.map(articulo => ({
        ...articulo,
        stock: stockMap.get(articulo.codArticulo) || 0,
        pvp: preciosMap.get(`${articulo.codArticulo}-${tariffId}`) || preciosMap.get(`${articulo.codArticulo}-2`) || 0,
        marcaNombre: marcasMap.get(articulo.codMarca) || 'N/A'
    }));
    
    productosMostrados.value = listaCompleta;
}

const filteredProducts = computed(() => {
    let productos = productosMostrados.value;
    if (advancedFilters.value.departamento) productos = productos.filter(p => p.numDpto == advancedFilters.value.departamento);
    if (advancedFilters.value.marca) productos = productos.filter(p => p.codMarca == advancedFilters.value.marca);
    if (stockFilter.value === 'conStock') productos = productos.filter(p => p.stock > 0);
    else if (stockFilter.value === 'sinStock') productos = productos.filter(p => p.stock === 0);
    
    const trimmedSearch = searchTerm.value.trim().toLowerCase();
    if (!trimmedSearch) return productos;
    
    return productos.filter(p => 
        String(p.descripcion || '').toLowerCase().includes(trimmedSearch) ||
        String(p.referencia || '').toLowerCase().includes(trimmedSearch) ||
        String(p.marcaNombre || '').toLowerCase().includes(trimmedSearch)
    );
});

// --- MANEJADORES DE EVENTOS ---
function handleApplyFilters(newFilters) { 
    advancedFilters.value = newFilters; 
}
async function handleResync() {
    if (!store.isServerOnline) {
        setAlert('error', 'Necesitas conexión a internet para sincronizar.');
        return;
    }
    await syncCatalogo();
    await buildProductList(store.pedido.cliente?.codTarifa);
}
function openProductModal(producto) {
    if (!selectedClientId.value) {
        setAlert('error', 'Por favor, selecciona un cliente primero.');
        return;
    }
    if(store.pedido.status === 'Subido') {
      setAlert('error', 'El pedido para este cliente ya fue subido. Seleccione otro cliente para iniciar uno nuevo.');
      return;
    }
    selectedProduct.value = producto;
    isProductModalVisible.value = true;
}
function handleAddToOrder(pedidoItem) {
    if (!store.pedido.cliente) {
        setAlert('error', 'Error: No hay un cliente seleccionado.');
        return;
    }
    iniciarOAgregarItem(store.pedido.cliente, pedidoItem);
    setAlert('success', `${pedidoItem.cantidad} x ${pedidoItem.producto.descripcion} añadido.`);
}
function goToPedido() {
    router.push({ name: 'pedido' });
}

// --- HOOKS DE CICLO DE VIDA ---
watch(() => store.pedido.cliente, (newClient) => {
    buildProductList(newClient ? newClient.codTarifa : 2);
});

onMounted(async () => {
  if (store.preselectedClientId) {
    selectedClientId.value = store.preselectedClientId; 
    setPreselectedClient(null);
  }

  await buildProductList(store.pedido.cliente?.codTarifa);
  if (productosMostrados.value.length === 0 && !store.isLoadingCatalogo) {
    await syncCatalogo();
  }
});
</script>

<template>
  <div class="catalogo-container">
    <div v-if="store.isLoadingCatalogo" class="loading-overlay">
      <div class="loading-content">
        <Loader2 :size="50" class="spinner-lucide" color="#28a745" />
        <h2>Sincronizando Catálogo</h2>
        <p class="loading-status">{{ store.loadingMessage }}</p>
        <div class="progress-bar">
          <div class="progress-bar-inner" :style="{ width: store.loadingProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="sticky-controls">
          <div class="header">
            <div class="header-top">
              <select v-model="selectedClientId" class="client-selector">
                <option :value="null" disabled>-- Seleccionar Cliente --</option>
                <option v-for="cliente in store.clientes" :key="cliente.codCliente" :value="cliente.codCliente">
                  {{ cliente.nombreComercial }}
                </option>
              </select>
              <div class="action-buttons">
                <button @click="handleResync" class="action-btn" title="Sincronizar Catálogo">
                  <RefreshCw :size="20" />
                </button>
                <button @click="goToPedido" class="action-btn" :disabled="!selectedClientId" title="Crear/Ver Pedido">
                    <ShoppingCart :size="20" />
                    <span v-if="totalItemsPedido > 0" class="badge">{{ totalItemsPedido }}</span>
                </button>
                <button @click="isFilterModalVisible = true" class="action-btn" title="Filtros Avanzados">
                  <Filter :size="20" />
                </button>
              </div>
            </div>
            
            <div class="search-wrapper">
              <Search :size="18" class="search-icon" />
              <input type="text" v-model="searchTerm" placeholder="Buscar por descripción, ref. o marca..." class="search-input">
            </div>
            
          </div>
          <div class="filters-bar">
            <div class="stock-filter">
              <button @click="stockFilter = 'todos'" :class="{ active: stockFilter === 'todos' }">Todos</button>
              <button @click="stockFilter = 'conStock'" :class="{ active: stockFilter === 'conStock' }">Con Stock</button>
              <button @click="stockFilter = 'sinStock'" :class="{ active: stockFilter === 'sinStock' }">Sin Stock</button>
            </div>
            <div class="total-results">
              Mostrando <strong>{{ filteredProducts.length }}</strong> de <strong>{{ productosMostrados.length }}</strong> artículos
            </div>
          </div>
      </div>
      
      <div v-if="store.pedido.cliente && store.pedido.status === 'Subido'" class="readonly-banner">
        <CheckCircle :size="24" />
        <span>
            El pedido para <strong>{{ store.pedido.cliente.nombreComercial }}</strong> ya fue subido. Para crear un nuevo pedido, seleccione otro cliente.
        </span>
      </div>

      <div class="product-grid" :class="{ 'readonly': store.pedido.status === 'Subido' }">
        <div v-for="producto in filteredProducts" :key="producto.codArticulo" class="product-card" @click="openProductModal(producto)">
            <div class="product-image">
                <img 
                    v-if="producto.foto" 
                    :src="producto.foto" 
                    :alt="producto.descripcion" 
                    class="real-product-img"
                    loading="lazy"
                />
                <ImageIcon v-else :size="48" />
            </div>
            <div class="product-info">
                <h3 class="product-name">{{ producto.descripcion }}</h3>
                <p class="product-details">Ref: {{ producto.referencia }}</p>
                <p class="product-details">Marca: {{ producto.marcaNombre }}</p>
            </div>
            <div class="product-footer">
                <span class="product-price">{{ producto.pvp.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</span>
                <span class="product-stock" :class="producto.stock > 0 ? 'in-stock' : 'out-of-stock'">
                {{ producto.stock > 0 ? `${producto.stock} Unds.` : 'Agotado' }}
                </span>
            </div>
        </div>
      </div>
      <div v-if="!store.isLoadingCatalogo && filteredProducts.length === 0" class="no-results">
        <p>No se encontraron productos con los filtros actuales.</p>
      </div>
    </template>
    
    <ProductDetailModal 
      :is-visible="isProductModalVisible"
      :producto="selectedProduct"
      :cliente-tarifa-id="selectedClient?.codTarifa"
      @close="isProductModalVisible = false"
      @add-to-order="handleAddToOrder"
    />
  
    <FiltroCatalogoModal 
        :is-visible="isFilterModalVisible"
        v-model="advancedFilters"
        @close="isFilterModalVisible = false"
        @apply="handleApplyFilters"
    />
  </div>
</template>

<style scoped>
.catalogo-container {
  display: flex; 
  flex-direction: column;
  min-height: 100vh;
}
.sticky-controls {
  position: sticky;
  top: 0px; 
  z-index: 10;
  background-color: #f4f7f9;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.loading-overlay {
  position: absolute; top: 60px; left: 0; right: 0; bottom: 0;
  background-color: #f4f7f9; display: flex; align-items: center;
  justify-content: center; z-index: 10;
}
.loading-content {
  text-align: center; color: #2c3e50; width: 80%;
  display: flex; flex-direction: column; align-items: center;
}
/* Animación para el nuevo spinner de Lucide */
.spinner-lucide {
  margin-bottom: 20px;
  animation: spin 1s linear infinite;
}
@keyframes spin { 
  100% { transform: rotate(360deg); } 
}

.loading-content h2 { font-size: 20px; margin: 0 0 10px 0; }
.loading-status { font-size: 14px; color: #718096; margin-bottom: 20px; height: 20px; }
.progress-bar { width: 100%; height: 8px; background-color: #e0e0e0; border-radius: 4px; overflow: hidden; }
.progress-bar-inner { height: 100%; background-color: #28a745; border-radius: 4px; transition: width 0.3s ease; }

.header {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e2e8f0;
}
.header-top {
    display: flex;
    width: 100%;
    gap: 10px;
    justify-content: space-between;
    align-items: center;
}
/* Configuración para contener el icono de búsqueda */
.search-wrapper {
  width: 100%;
  position: relative;
}
.client-selector {
  flex-grow: 1;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  background-color: #fff;
  width: 100%;
  min-width: 0;
  text-overflow: ellipsis;
}
.action-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #34495e;
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
}
.action-btn:hover { background-color: #2c3e50; }
.action-btn:disabled { background-color: #95a5a6; cursor: not-allowed; }

.badge {
  position: absolute; top: -5px; right: -5px;
  background-color: #e74c3c; color: white;
  border-radius: 50%; padding: 2px 6px;
  font-size: 10px; font-weight: bold;
}
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  background-color: #f4f7f9;
  border-bottom: 1px solid #e2e8f0;
}
.search-input {
  width: 100%;
  /* Aumentamos el padding-left para que el texto no pise la lupa */
  padding: 12px 15px 12px 40px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  box-sizing: border-box;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}
.stock-filter {
  display: flex;
  background-color: #e2e8f0;
  border-radius: 8px;
  padding: 4px;
}
.stock-filter button {
  flex: 1;
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  white-space: nowrap;
}
.stock-filter button.active {
  background-color: #fff;
  color: #28a745;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.total-results {
  font-size: 14px;
  color: #718096;
  white-space: nowrap;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 20px;
}
.product-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}
.product-card:active { transform: scale(0.98); }
.product-image {
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #a0aec0;
}
.product-info { padding: 10px; flex-grow: 1; }
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 5px 0;
  line-height: 1.3;
  height: 3.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.product-details {
  font-size: 12px;
  color: #718096;
  margin: 0;
}
.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #f0f2f5;
}
.product-price {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}
.product-stock {
  font-size: 12px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 12px;
}
.in-stock {
  color: #2f855a;
  background-color: #c6f6d5;
}
.out-of-stock {
  color: #9b2c2c;
  background-color: #fed7d7;
}
.no-results {
  text-align: center;
  padding: 40px;
  color: #718096;
}
.readonly-banner {
    display: flex;
    align-items: center;
    gap: 15px;
    background-color: #e9f5e9;
    color: #2f855a;
    padding: 15px 20px;
    margin: 0 20px 20px 20px;
    border-radius: 8px;
    font-size: 14px;
    border: 1px solid #b7e4b7;
}

.product-grid.readonly .product-card {
    cursor: not-allowed;
    opacity: 0.7;
    filter: grayscale(80%);
}

.real-product-img {
  width: 100%;
  height: 100%;
  object-fit: contain; 
  display: block;
}

@media (min-width: 768px) {
  /* En tablet, ponemos el selector y el buscador en una sola línea */
  .header {
    flex-direction: row; 
    align-items: center;
    flex-wrap: nowrap; /* Forzamos una línea */
  }

  .header-top {
    width: 50%; /* La mitad para el cliente y botones */
    margin-right: 15px;
  }

  .search-wrapper {
    width: 50%; /* La otra mitad para buscar */
  }

  /* Grid de productos: 3 columnas en tablet, 4 o 5 en pantallas grandes */
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    padding: 30px;
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  /* Ajustes extra para PC */
  .catalogo-container {
    max-width: 1400px; /* Evita que se estire infinito en monitores ultra-wide */
    margin: 0 auto;
    width: 100%;
  }
}
</style>