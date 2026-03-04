<script setup>
import { ref, watch } from 'vue';
// 1. Importamos los iconos de Lucide
import { X, Pencil, Save, Info } from 'lucide-vue-next';

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
          <h3><Pencil :size="18" /> Editar Cantidad</h3>
          
          <button class="close-button" @click="emit('close')">
            <X :size="24" />
          </button>
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
            <p class="info-text">
              <Info :size="14" /> 
              Si la cantidad es 0, el artículo se eliminará del pedido.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="handleUpdate" class="update-button">
            <Save :size="18" /> Actualizar
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
  width: 90%; max-width: 350px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 20px;
}
.modal-header h3 { 
  font-size: 18px; 
  margin: 0; 
  color: #333;
  /* Alineación del icono del título */
  display: flex;
  align-items: center;
  gap: 8px;
}
.close-button {
  background: none; border: none; 
  cursor: pointer; color: #888;
  /* Alineación del botón cerrar */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.close-button:hover {
  color: #333;
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
    margin-top: 10px;
    /* Alineación del icono de información */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
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
    /* Alineación del icono del botón */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.2s;
}
.update-button:hover {
  background-color: #218838;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>