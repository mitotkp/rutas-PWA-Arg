<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  item: Object
});

const emit = defineEmits(['close', 'update']);

const newQuantity = ref(1);

watch(() => props.item, (newItem) => {
  if (newItem) {
    newQuantity.value = newItem.cantidad;
  }
});

function handleUpdate() {
  emit('update', { 
    codArticulo: props.item.producto.codArticulo, 
    cantidad: newQuantity.value 
  });
  emit('close');
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Editar Cantidad</h3>
          <button class="close-button" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body" v-if="item">
          <p class="item-name">{{ item.producto.descripcion }}</p>
          <div class="input-group">
            <label for="quantity">Nuevas Unidades</label>
            <input 
              id="quantity" 
              type="number" 
              v-model.number="newQuantity" 
              min="0" 
              class="quantity-input"
            >
            <p class="info-text">Si la cantidad es 0, el artículo se eliminará del pedido.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="handleUpdate" class="update-button">Actualizar</button>
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
  width: 90%; max-width: 350px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 20px;
}
.modal-header h3 { font-size: 18px; margin: 0; color: #333; }
.close-button {
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: #888;
}
.item-name {
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 20px 0;
}
.input-group label {
    display: block;
    font-size: 14px;
    color: #718096;
    margin-bottom: 8px;
}
.quantity-input {
    width: 100%;
    padding: 12px;
    font-size: 18px;
    text-align: center;
    border-radius: 8px;
    border: 1px solid #ccc;
    box-sizing: border-box;
}
.info-text {
    font-size: 12px;
    color: #718096;
    text-align: center;
    margin-top: 10px;
}
.modal-footer {
    margin-top: 20px;
}
.update-button {
    width: 100%;
    background-color: #28a745;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>