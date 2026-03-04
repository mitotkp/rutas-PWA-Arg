<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, totalMontoPedido, subirPedidoActual, eliminarItemDelPedido, actualizarCantidadItem, cancelarPedidoActual } from '@/store.js';
import EditOrderItemModal from '@/components/EditOrderItemModal.vue';
// 1. Importamos los iconos de Lucide
import { ShoppingCart, Pencil, Trash2, CloudUpload, Loader2, CheckCircle } from 'lucide-vue-next';

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
        <div v-if="!store.pedido.cliente || store.pedido.items.length === 0" class="empty-state">
            <ShoppingCart :size="64" />
            <h2>Tu pedido está vacío</h2>
            <p>Añade productos desde el catálogo para empezar.</p>
            <button @click="goToCatalog" class="primary-action primary-action-left">Ir al Catálogo</button>
        </div>
        
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
                                <button @click="openEditModal(item)" class="icon-btn edit-btn" title="Editar">
                                    <Pencil :size="18" />
                                </button>
                                <button @click="eliminarItemDelPedido(item.producto.codArticulo)" class="icon-btn delete-btn" title="Eliminar">
                                    <Trash2 :size="18" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
           </div>
        </template>

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
                    <Trash2 :size="20" />
                    <span>{{ isCancelConfirmVisible ? '¿Confirmar?' : 'Cancelar' }}</span>
                </button>
                
                <button v-if="store.pedido.status === 'Pendiente'" @click="handleSubirPedido" :disabled="store.isSubiendoPedido" class="primary-action">
                    <CloudUpload v-if="!store.isSubiendoPedido" :size="20" />
                    <Loader2 v-else :size="20" class="spinner-lucide" />
                    <span>{{ store.isSubiendoPedido ? 'Subiendo...' : 'Subir Pedido' }}</span>
                </button>
                
                <div v-if="store.pedido.status === 'Subido'" class="uploaded-indicator">
                    <CheckCircle :size="20" />
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
    transition: background-color 0.2s, color 0.2s;
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
    transition: background-color 0.2s;
}
.primary-action { background-color: #28a745; color: white; }
.primary-action:hover:not(:disabled) { background-color: #218838; }
.secondary-action { background-color: #e9ecef; color: #495057; }
.secondary-action:hover { background-color: #dee2e6; }
.cancel-action { background-color: #fff; color: #e74c3c; border: 1px solid #e74c3c; }
.cancel-action:hover { background-color: #fdf2f2; }
.cancel-action.confirm { background-color: #e74c3c; color: white; }
.uploaded-indicator { background-color: #2ecc71; color: white; cursor: default; }

/* Empty State */
.empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 60vh; color: #718096; text-align: center; padding: 20px;
}
.empty-state > svg { margin-bottom: 20px; color: #cbd5e0; }
.primary-action-left { margin-top: 20px; flex: 0; width: 200px; }

/* Spinner animado para Lucide */
.spinner-lucide {
    animation: spin 1s linear infinite;
}
@keyframes spin { 
    100% { transform: rotate(360deg); } 
}

/* --- RESPONSIVE TABLET Y DESKTOP --- */
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