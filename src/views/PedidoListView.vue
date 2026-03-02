<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { store, loadPedidosGuardados, loadPedidoById } from '@/store.js';
import { exportOrdersToExcel } from '@/utils/excelExporter';

const router = useRouter();

onMounted(() => {
    if(store.user?.codVendedor){
        loadPedidosGuardados(store.user.codVendedor);
    }
});

function selectPedido(pedido) {
    loadPedidoById(pedido); 

    router.push({ name: 'catalogo' })

}

function handleExport() {
    exportOrdersToExcel(store.pedidosGuardadosList)
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}
</script>

<template>
    <div class="pedidos-list-container">
        <div class="view-header">
            <h1 class="view-title">Pedidos Guardados</h1>
            <button @click="handleExport" class="export-btn" title="Descargar historial en Excel">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Exportar</span>
            </button>
        </div>

        <div class="info-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>
                Para mantener la aplicación rápida, el historial de pedidos se elimina automáticamente después de <strong>2 semanas</strong>.
            </span>
        </div>

        <div v-if="store.pedidosGuardadosList.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <h2>No hay pedidos</h2>
            <p>Los pedidos que inicies aparecerán aquí.</p>
        </div>
        
        <div v-else class="pedidos-list">
            <div v-for="pedido in store.pedidosGuardadosList" :key="pedido.id" class="card pedido-card" @click="selectPedido(pedido)">
                <div class="pedido-icon">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                </div>
                <div class="pedido-info">
                    <strong class="cliente-nombre">{{ pedido.clienteNombre }}</strong>
                    <span class="pedido-id">Pedido #{{ pedido.id }}</span>
                    <div class="info-footer">
                        <span class="pedido-fecha">Guardado: {{ formatDate(pedido.fecha) }}</span>
                        <span 
                            class="status-badge" 
                            :class="pedido.status === 'Subido' ? 'status-subido' : 'status-pendiente'"
                        >
                            {{ pedido.status }}
                        </span>
                    </div>
                </div>
                <div class="pedido-summary">
                    <strong class="pedido-total">{{ pedido.total.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</strong>
                    <span class="pedido-items">{{ pedido.items.length }} Items</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pedidos-list-container {
    padding: 20px;
    background-color: #f4f7f9;
    flex-grow: 1;
}
.view-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 20px 0;
}
.empty-state {
    text-align: center;
    padding-top: 100px;
    color: #718096;
}
.empty-state svg {
    margin-bottom: 20px;
    color: #a0aec0;
}
.empty-state h2 {
    color: #2c3e50;
}
.card {
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.pedidos-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.pedido-card {
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    justify-content: space-between;
}
.pedido-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.pedido-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #495057;
}
.pedido-info {
    flex-grow: 1;
    min-width: 0; 
}
.cliente-nombre {
    display: block;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 4px;
    word-break: break-word;
}
.info-footer {
    display: flex;
    align-items: center;
    gap: 10px;
}
.pedido-fecha {
    font-size: 14px;
    color: #718096;
}
.pedido-summary {
    text-align: right;
    flex-shrink: 0;
    margin-left: 10px;
}
.pedido-total {
    font-size: 18px;
    font-weight: 700;
    color: #2c3e50;
    display: block;
    margin-bottom: 4px;
}
.pedido-items {
    font-size: 14px;
    color: #718096;
}

/* --- NUEVOS ESTILOS PARA LA ETIQUETA DE ESTADO --- */
.status-badge {
    font-size: 12px;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 12px;
    text-transform: capitalize;
}
.status-pendiente {
    color: #b98100;
    background-color: #fff8e1;
}
.status-subido {
    color: #2f855a;
    background-color: #c6f6d5;
}
.pedido-id { /* Estilo para el nuevo ID */
    font-size: 12px;
    color: #718096;
    background-color: #f1f5f9;
    padding: 2px 8px;
    border-radius: 10px;
}
.info-banner {
    display: flex;
    align-items: center;
    gap: 15px;
    background-color: #e6f7ff;
    color: #005f8d;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    border: 1px solid #b3e0ff;
}
.info-banner svg {
    flex-shrink: 0;
}
.view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.view-title {
    margin: 0;
}
.export-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #1d6f42; /* Un verde más oscuro para diferenciar */
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}
.export-btn:hover {
    background-color: #165934;
}
</style>