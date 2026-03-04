<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/database.js';
// 1. Importamos los iconos de Lucide
import { X, Filter, FilterX, Check } from 'lucide-vue-next';

// Definimos las propiedades que el componente recibe
const props = defineProps({
  isVisible: Boolean,
  // Recibimos los filtros actuales para mostrar los valores seleccionados
  modelValue: Object 
});

// Definimos los eventos que el componente puede emitir
const emit = defineEmits(['close', 'update:modelValue', 'apply']);

// Estado local para las opciones de los selectores
const departamentos = ref([]);
const marcas = ref([]);

// Cargamos las opciones desde la base de datos local cuando la modal se monta
onMounted(async () => {
    departamentos.value = await db.departamentos.orderBy('numDpto').toArray();
    marcas.value = await db.marca.orderBy('marca').toArray();
});

function updateFilter(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function applyAndClose() {
    emit('close');
}

function clearFilters() {
    emit('update:modelValue', { departamento: null, marca: null });
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h2><Filter :size="20" /> Filtros Avanzados</h2>
          <button class="close-button" @click="emit('close')">
            <X :size="24" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="filter-group">
            <label for="departamento">DEPARTAMENTO</label>
            <select id="departamento" :value="modelValue.departamento" @change="updateFilter('departamento', $event.target.value)">
              <option v-for="dpto in departamentos" :key="dpto.numDpto" :value="dpto.numDpto">
                {{ dpto.nombreDepartamento }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label for="marca">MARCA</label>
            <select id="marca" :value="modelValue.marca" @change="updateFilter('marca', $event.target.value)">
              <option v-for="marca in marcas" :key="marca.marca" :value="marca.marca">
                {{ marca.nombreMarca }}
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
            <button @click="clearFilters" class="clear-button">
              <FilterX :size="18" /> Limpiar
            </button>
            <button @click="applyAndClose" class="apply-button">
              <Check :size="18" /> Aplicar Filtros
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
.modal-header h2 { 
  font-size: 18px; 
  margin: 0; 
  color: #333;
  /* Centramos el icono del título con el texto */
  display: flex;
  align-items: center;
  gap: 8px;
}
.close-button {
  background: none; border: none; 
  cursor: pointer; color: #888;
  /* Alineación de la X */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.close-button:hover {
  color: #333;
}
.filter-group {
  margin-bottom: 15px;
}
.filter-group label {
  display: block; font-weight: 600; color: #555; margin-bottom: 8px; font-size: 14px;
}
.filter-group select {
  width: 100%; padding: 12px; border: 1px solid #ccc;
  border-radius: 8px; font-size: 16px; background-color: #f8f9fa;
}
.modal-footer {
  display: flex; gap: 10px; margin-top: 20px;
}
.clear-button, .apply-button {
  flex: 1; padding: 12px; border-radius: 8px; font-weight: bold;
  font-size: 16px; cursor: pointer; border: none;
  /* Alineamos los iconos con el texto de los botones */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;
}
.clear-button {
  background-color: #e9ecef; color: #495057;
}
.clear-button:hover {
  background-color: #dee2e6;
}
.apply-button {
  background-color: #28a745; color: white;
}
.apply-button:hover {
  background-color: #218838;
}
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>