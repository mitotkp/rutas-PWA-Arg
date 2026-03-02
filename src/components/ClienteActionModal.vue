<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { setPreselectedClient } from '@/store';
import ClientMapModal from './ClientMapModal.vue';
// defineProps es la forma en que un componente hijo declara los datos
// que espera recibir de su componente padre.
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
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </div>
          <h2 v-if="cliente">{{ cliente.nombreComercial }}</h2>
          <button class="close-button" @click="emit('close')">&times;</button>
        </div>
        
        <div class="actions-grid">
          <div class="action-button"  @click="openMapModal">
            <div class="icon-wrapper location">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <span>UBICACIÓN</span>
          </div>
          
            <div class="action-button" @click="goToDetail()">
                <div class="icon-wrapper info">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <span>INFORMACIÓN</span>
            </div>
    
          <div class="action-button" @click="goToCatalog()">
            <div class="icon-wrapper order">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path><line x1="12" y1="16" x2="12" y2="22"></line><line x1="8" y1="20" x2="16" y2="20"></line></svg>
            </div>
            <span>REALIZAR PEDIDOS</span>
          </div>
          <div class="action-button" @click="goToCxC()">
            <div class="icon-wrapper payment">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
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
  font-size: 20px;
  cursor: pointer;
  color: #718096;
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