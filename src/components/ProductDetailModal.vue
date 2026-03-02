<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { db } from '@/database.js';

const props = defineProps({
  isVisible: Boolean,
  producto: Object,
  clienteTarifaId: Number // Recibimos la tarifa del cliente seleccionado
});

const emit = defineEmits(['close', 'add-to-order']);

// --- ESTADO LOCAL DE LA MODAL ---
const unidades = ref(1);
const selectedTariffId = ref(null);
const todasLasTarifas = ref([]);
const precioCalculado = ref(0);

// Función para buscar el precio de forma asíncrona
async function getPrice(codArticulo, idTarifa) {
    const precioObj = await db.precios
        .where({ codArticulo: codArticulo, idTarifa: idTarifa })
        .first();
    return precioObj ? precioObj.precio : 0;
}

// Observa cuando la modal se abre o el producto cambia
watch(() => props.producto, async (newProduct) => {
    if (newProduct) {
        // Al abrir, reseteamos las unidades y seleccionamos la tarifa del cliente
        unidades.value = 1;
        selectedTariffId.value = props.clienteTarifaId;
        // Cargamos las tarifas si no lo hemos hecho
        if (todasLasTarifas.value.length === 0) {
            todasLasTarifas.value = await db.tarifas.toArray();
        }
    }
});

// Observa cuando la tarifa seleccionada cambia para recalcular el precio
watch([selectedTariffId, () => props.producto], async ([newTariffId, product]) => {
    if (product && newTariffId) {
        precioCalculado.value = await getPrice(product.codArticulo, newTariffId);
    } else if (product) {
        // Si no hay tarifa, usamos el pvp por defecto que ya viene con el producto
        precioCalculado.value = product.pvp;
    }
}, { immediate: true });

function handleAddToOrder() {
  if (unidades.value > 0) {
    emit('add-to-order', {
      producto: props.producto,
      cantidad: unidades.value,
      precio: precioCalculado.value,
      tarifaId: selectedTariffId.value
    });
    emit('close');
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content" v-if="producto">
        <div class="product-layout">
          <div class="product-image-large">
            <img 
                v-if="producto.foto" 
                :src="producto.foto" 
                :alt="producto.descripcion" 
                class="real-product-img"
                loading="lazy"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </div>
          <div class="product-details">
            <h2 class="product-title">{{ producto.descripcion }}</h2>
            <div class="info-grid">
              <span>Cod. Artículo</span><strong>{{ producto.codArticulo }}</strong>
              <span>Referencia</span><strong>{{ producto.referencia }}</strong>
              <span>Marca</span><strong>{{ producto.marcaNombre }}</strong>
              <span>Stock Actual</span><strong>{{ producto.stock }} Unds.</strong>
            </div>
          </div>
        </div>
        
        <div class="actions-section">
            <div class="form-group">
                <label for="tarifa">Tarifa</label>
                <select id="tarifa" v-model="selectedTariffId">
                    <option v-for="tarifa in todasLasTarifas" :key="tarifa.idTarifa" :value="tarifa.idTarifa">
                        {{ tarifa.idTarifa }} - {{ tarifa.descripcion }}
                    </option>
                </select>
            </div>
            <div class="form-group price-display">
                <label>Precio</label>
                <strong>{{ precioCalculado.toLocaleString('es-VE', { style: 'currency', currency: 'USD' }) }}</strong>
            </div>
        </div>

        <div class="order-section">
            <div class="form-group quantity-group">
                <label for="unidades">UNDS A SOLICITAR</label>
                <input id="unidades" type="number" v-model.number="unidades" min="1">
            </div>
            <button @click="handleAddToOrder" class="add-button">AGREGAR</button>
        </div>

        <button class="close-button" @click="emit('close')">&times;</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6); display: flex;
  align-items: center; justify-content: center; z-index: 2000;
}
.modal-content {
  background: white; padding: 25px; border-radius: 12px;
  width: 90%; max-width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  position: relative;
}
.close-button {
  position: absolute; top: 10px; right: 10px; background: none; border: none;
  font-size: 28px; cursor: pointer; color: #888;
}
.product-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}
@media (min-width: 500px) {
  .product-layout { flex-direction: row; }
}
.product-image-large {
  flex-shrink: 0; width: 120px; height: 120px; margin: 0 auto;
  background-color: #f0f2f5; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: #a0aec0;
}
.product-details { flex-grow: 1; }
.product-title {
  font-size: 20px; font-weight: 600; color: #2d3748; margin: 0 0 15px 0;
}
.info-grid {
  display: grid; grid-template-columns: auto 1fr; gap: 8px 15px;
  font-size: 14px; color: #718096;
}
.info-grid strong {
  color: #2d3748; font-weight: 500;
}
.actions-section, .order-section {
  display: flex; gap: 15px; align-items: flex-end;
  padding-top: 15px; border-top: 1px solid #eee;
}
.order-section { margin-top: 15px; }
.form-group {
  display: flex; flex-direction: column; flex-grow: 1;
}
.form-group label {
  font-size: 12px; font-weight: 600; color: #718096; margin-bottom: 5px;
}
.form-group select, .form-group input {
  width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;
  font-size: 16px; box-sizing: border-box;
}
.price-display {
  align-items: flex-start;
}
.price-display strong {
  font-size: 20px; font-weight: bold; color: #28a745;
}
.quantity-group {
    max-width: 150px;
}
.add-button {
  background-color: #28a745; color: white; border: none;
  padding: 12px 20px; border-radius: 8px; font-weight: bold;
  cursor: pointer; font-size: 16px; flex-grow: 1;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.real-product-img {
  width: 100%;
  height: 100%;
  object-fit: contain; 
  display: block;
}
</style>