<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { setPreselectedClient } from '@/store';
import ClientMapModal from './ClientMapModal.vue';
// 1. Importamos los iconos de Lucide
import { User, X, MapPin, Info, ShoppingBag, DollarSign } from 'lucide-vue-next';

const props = defineProps({
  isVisible: Boolean,
  cliente: Object
});

console.log(props)

const emit = defineEmits(['close']);
const router = useRouter()

const isMapModalVisible = ref(false);

function goToDetail() {
  if (props.cliente) {
    router.push({ name: 'cliente-detalle', params: { id: props.cliente.codCliente } });
    emit('close'); 
  }
}

function goToCxC() {
    if(props.cliente) {
        router.push({ name: 'cliente-cuentas-por-cobrar', params: { id: props.cliente.codCliente } });
        emit('close');
    }
}

function goToCatalog() {
  if(props.cliente) {
    setPreselectedClient(props.cliente.codCliente);
    router.push({ name: 'catalogo' });
    emit('close');
  }
}

function openMapModal() {
  isMapModalVisible.value = true; 
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <div class="avatar-placeholder">
            <User :size="40" />
          </div>
          <h2 v-if="cliente">{{ cliente.nombreComercial }}</h2>
          <button class="close-button" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>
        
        <div class="actions-grid">
          <div class="action-button" @click="openMapModal">
            <div class="icon-wrapper location">
              <MapPin :size="24" />
            </div>
            <span>UBICACIÓN</span>
          </div>
          
          <div class="action-button" @click="goToDetail()">
            <div class="icon-wrapper info">
              <Info :size="24" />
            </div>
            <span>INFORMACIÓN</span>
          </div>
    
          <div class="action-button" @click="goToCatalog()">
            <div class="icon-wrapper order">
              <ShoppingBag :size="24" />
            </div>
            <span>REALIZAR PEDIDOS</span>
          </div>

          <div class="action-button" @click="goToCxC()">
            <div class="icon-wrapper payment">
              <DollarSign :size="24" />
            </div>
            <span>PAGOS PENDIENTES</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <ClientMapModal 
    :is-visible="isMapModalVisible"
    :cliente="cliente"
    @close="isMapModalVisible = false"
  />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.modal-header {
  text-align: center;
  position: relative;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f0f2f5;
  margin: 0 auto 15px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
}
.modal-header h2 {
  font-size: 18px;
  margin: 0;
  color: #333;
}
.close-button {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  color: #718096;
  /* Centrado perfecto para la X de Lucide */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}
.close-button:hover {
  background-color: #e2e8f0;
  color: #2d3748;
}
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
}
.action-button {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}
.action-button:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}
.icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 0 auto 10px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.icon-wrapper.location { background-color: #e67e22; }
.icon-wrapper.info { background-color: #3498db; }
.icon-wrapper.order { background-color: #e74c3c; }
.icon-wrapper.payment { background-color: #2ecc71; }
.action-button span {
  font-size: 12px;
  font-weight: 600;
  color: #34495e;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>