<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, setPreselectedClient } from '@/store.js';

const props = defineProps({
  isVisible: Boolean,
});

const emit = defineEmits(['close']);
const router = useRouter();

// Estado local para el cliente seleccionado dentro de la modal
const selectedClientId = ref(null);

function startOrder() {
  if (selectedClientId.value) {
    // Usamos la función que ya teníamos para preseleccionar el cliente
    setPreselectedClient(selectedClientId.value);
    // Navegamos al catálogo
    router.push({ name: 'catalogo' });
    // Cerramos la modal
    emit('close');
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Iniciar Nuevo Pedido</h2>
          <button class="close-button" @click="emit('close')">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="cliente-selector">Selecciona un cliente para comenzar</label>
            <select id="cliente-selector" v-model="selectedClientId" class="client-selector">
              <option :value="null" disabled>-- Elige un cliente --</option>
              <option v-for="cliente in store.clientes" :key="cliente.codCliente" :value="cliente.codCliente">
                {{ cliente.nombreComercial }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
            <button @click="startOrder" :disabled="!selectedClientId" class="start-button">
              Ir al Catálogo
            </button>
        </div>
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
  background: white; padding: 20px; border-radius: 12px;
  width: 90%; max-width: 400px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 15px; border-bottom: 1px solid #eee; margin-bottom: 20px;
}
.modal-header h2 { font-size: 18px; margin: 0; color: #333; }
.close-button {
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: #888;
}
.form-group label {
  display: block; font-weight: 500; color: #555; margin-bottom: 8px; font-size: 14px;
}
.client-selector {
  width: 100%; padding: 12px; border: 1px solid #ccc;
  border-radius: 8px; font-size: 16px; background-color: #f8f9fa;
}
.modal-footer {
  margin-top: 20px;
}
.start-button {
  width: 100%; background-color: #28a745; color: white; border: none;
  padding: 12px; border-radius: 8px; font-weight: bold;
  font-size: 16px; cursor: pointer; transition: background-color 0.2s;
}
.start-button:disabled {
  background-color: #95a5a6; cursor: not-allowed;
}
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>