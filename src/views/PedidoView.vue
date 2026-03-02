<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, totalMontoPedido, subirPedidoActual, eliminarItemDelPedido, actualizarCantidadItem, cancelarPedidoActual } from '@/store.js';
import EditOrderItemModal from '@/components/EditOrderItemModal.vue';

const router = useRouter();

const isEditModalVisible = ref(false);
const itemToEdit = ref(null);

const isCancelConfirmVisible = ref(false);
let cancelTimeout = null;

async function handleSubirPedido() {

    const exito = await subirPedidoActual();

    if (exito) {
        
        setTimeout(() => {
            
            router.push({ name: 'catalogo' });
        }, 1500);
    }
   
}

async function handleCancelClick() {
    if (!isCancelConfirmVisible.value) {
        // Primer clic: mostramos la confirmación
        isCancelConfirmVisible.value = true;
        // Si no confirma en 3 segundos, volvemos al estado normal
        cancelTimeout = setTimeout(() => {
            isCancelConfirmVisible.value = false;
        }, 3000);
    } else {
        clearTimeout(cancelTimeout); 
        const exito = await cancelarPedidoActual();
        if (exito) {
            router.push({ name: 'pedidos-lista' });
        }
        isCancelConfirmVisible.value = false; 
    }
}

function openEditModal(item) {
  if (store.pedido.status !== 'Pendiente') return;
  itemToEdit.value = item;
  isEditModalVisible.value = true;
}

function handleUpdateItem(updateData) {
  actualizarCantidadItem(updateData.codArticulo, updateData.cantidad);
}

function goToCatalog() {
    router.push({ name: 'catalogo' });
}

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}
</script>

<template>
    <div class="pedido-container">
        <!-- Estado Vacío -->
        <div v-if="!store.pedido.cliente || store.pedido.items.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <h2>Tu pedido está vacío</h2>
            <p>Añade productos desde el catálogo para empezar.</p>
            <button @click="goToCatalog" class="primary-action primary-action-left">Ir al Catálogo</button>
        </div>
        
        <!-- Contenido del Pedido -->
        <template v-else>
           <div class="items-section-wrapper">
                <div class="header-card">
                    <h2>Resumen del Pedido</h2>
                    <div class="info-row">
                        <span>Cliente:</span>
                        <strong>{{ store.pedido.cliente.nombreComercial }}</strong>
                    </div>
                    <div class="info-row">
                        <span>Fecha:</span>
                        <strong>{{ formatDate(new Date()) }}</strong>
                    </div>
                </div>

                <div class="items-list">
                    <div v-for="item in store.pedido.items" :key="item.producto.codArticulo" class="card item-card">
                        <div class="item-details">
                            <strong class="item-name">{{ item.producto.descripcion }}</strong>
                            <span class="item-ref">Ref: {{ item.producto.referencia }}</span>
                            <span class="item-calc">{{ item.cantidad }} Unds. &times; {{ item.precio.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</span>
                        </div>
                        <div class="item-summary">
                            <strong>{{ (item.cantidad * item.precio).toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</strong>
                            <div v-if="store.pedido.status === 'Pendiente'" class="item-actions">
                                <button @click="openEditModal(item)" class="icon-btn edit-btn" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                                <button @click="eliminarItemDelPedido(item.producto.codArticulo)" class="icon-btn delete-btn" title="Eliminar"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                            </div>
                        </div>
                    </div>
                </div>
           </div>
        </template>

        <!-- Footer de Acciones Fijo (Rediseñado) -->
        <div v-if="store.pedido.cliente" class="summary-footer" :class="{ 'with-offline-banner': store.isOfflineBannerVisible }">
            <div class="total-section">
                <span class="total-label">Total del Pedido</span>
                <span class="total-amount">{{ totalMontoPedido.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</span>
            </div>
            
            <div class="footer-actions">
                <button @click="goToCatalog" class="secondary-action">
                    {{ store.pedido.status === 'Subido' ? 'Volver' : 'Volver' }}
                </button>
                
                <button v-if="store.pedido.status === 'Pendiente'" @click="handleCancelClick" class="cancel-action" :class="{ 'confirm': isCancelConfirmVisible }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>{{ isCancelConfirmVisible ? '¿Confirmar?' : 'Cancelar' }}</span>
                </button>
                
                <button v-if="store.pedido.status === 'Pendiente'" @click="handleSubirPedido" :disabled="store.isSubiendoPedido" class="primary-action">
                    <svg v-if="!store.isSubiendoPedido" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <svg v-else class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
                    <span>{{ store.isSubiendoPedido ? 'Subiendo...' : 'Subir Pedido' }}</span>
                </button>
                
                <div v-if="store.pedido.status === 'Subido'" class="uploaded-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span>Pedido Subido</span>
                </div>
            </div>
        </div>

        <EditOrderItemModal 
            :is-visible="isEditModalVisible"
            :item="itemToEdit"
            @close="isEditModalVisible = false"
            @update="handleUpdateItem" 
        />
    </div>
</template>

<style scoped>
.pedido-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    background-color: #f4f7f9;
    min-height: 100vh;
    padding-bottom: 80px; /* Espacio para el footer fijo en móvil */
}

/* Estilos Base (Móvil First) */
.items-section-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.header-card {
    margin: 20px;
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.header-card h2 { font-size: 20px; font-weight: 600; margin: 0 0 15px 0; }
.info-row { display: flex; justify-content: space-between; font-size: 14px; color: #555; }
.info-row + .info-row { margin-top: 8px; }

.items-list {
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.item-card {
    background-color: white;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    display: flex;
    gap: 15px;
    align-items: center; 
    justify-content: space-between; 
}

.item-details { flex-grow: 1; min-width: 0; }
.item-name { font-weight: 600; margin: 0 0 5px 0; color: #2d3748; word-break: break-word; display: block; }
.item-ref { font-size: 12px; color: #718096; display: block; }
.item-calc { font-size: 13px; color: #34495e; display: block; margin-top: 5px; }

.item-summary { text-align: right; flex-shrink: 0; }
.item-summary strong { font-size: 16px; display: block; margin-bottom: 10px; font-weight: 700; color: #2c3e50; }

.item-actions { display: flex; gap: 10px; justify-content: flex-end; }
.icon-btn {
    background: #f0f2f5; border: none; border-radius: 50%;
    width: 32px; height: 32px; display: flex; align-items: center;
    justify-content: center; cursor: pointer; color: #718096;
}
.delete-btn:hover { background-color: #fed7d7; color: #c53030; }
.edit-btn:hover { background-color: #dbeafe; color: #2563eb; }

/* Footer Fijo en Móvil/Tablet Vertical */
.summary-footer {
    position: fixed; bottom: 0; left: 0; right: 0;
    background-color: white;
    padding: 15px 20px;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -4px 15px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    gap: 15px;
    z-index: 100;
    transition: transform 0.3s ease-in-out;
}
.summary-footer.with-offline-banner { transform: translateY(-40px); }

.total-section {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;
}
.total-label { font-size: 14px; color: #718096; }
.total-amount { font-size: 20px; font-weight: bold; color: #2c3e50; }

.footer-actions { display: flex; gap: 10px; }
.primary-action, .secondary-action, .cancel-action, .uploaded-indicator {
    border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1;
    font-size: 14px;
}
.primary-action { background-color: #28a745; color: white; }
.secondary-action { background-color: #e9ecef; color: #495057; }
.cancel-action { background-color: #fff; color: #e74c3c; border: 1px solid #e74c3c; }
.cancel-action.confirm { background-color: #e74c3c; color: white; }
.uploaded-indicator { background-color: #2ecc71; color: white; cursor: default; }

/* Empty State */
.empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 60vh; color: #718096; text-align: center; padding: 20px;
}
.empty-state svg { margin-bottom: 20px; color: #cbd5e0; }
.primary-action-left { margin-top: 20px; flex: 0; width: 200px; }

/* Spinner */
.spinner { animation: rotate 2s linear infinite; width: 20px; height: 20px; }
.spinner .path { stroke: white; stroke-linecap: round; animation: dash 1.5s ease-in-out infinite; }
@keyframes rotate { 100% { transform: rotate(360deg); } }
@keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }

/* --- RESPONSIVE TABLET Y DESKTOP --- */
/* Cambiamos el breakpoint a 900px. Antes de esto, se verá como móvil (columna única) */
@media (min-width: 900px) {
    .pedido-container {
        flex-direction: row; /* Layout horizontal */
        align-items: flex-start;
        padding: 40px;
        gap: 30px;
        max-width: 1200px;
        margin: 0 auto;
        padding-bottom: 40px; /* Reset padding inferior */
    }

    .items-section-wrapper {
        flex: 1; /* Ocupa el espacio restante */
        gap: 20px;
    }

    .header-card { margin: 0; }
    .items-list { padding: 0; }

    /* Footer Lateral "Sticky" */
    .summary-footer {
        position: sticky;
        top: 90px; /* Debajo del header de la app */
        bottom: auto; left: auto; right: auto;
        width: 320px; /* Ancho fijo */
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        padding: 25px;
        transform: none !important; /* Anular transformaciones de móvil */
    }

    .total-section {
        flex-direction: column; text-align: center; gap: 5px; padding-bottom: 20px; margin-bottom: 20px;
    }
    .total-amount { font-size: 28px; }
    
    .footer-actions {
        flex-direction: column; /* Botones uno debajo del otro en lateral */
    }
    .primary-action, .secondary-action, .cancel-action {
        width: 100%;
        padding: 14px;
    }
}
</style>