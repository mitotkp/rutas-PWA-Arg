<script setup>
import { ref, watch } from 'vue';
import { store, setAlert, saveServerIp, closeIpConfigModal, fetchAndStoreData } from '@/store.js';
import { BACK_URL } from '../../backurl';

const ipAddress = ref(store.serverIp);
const isLoading = ref(false);
const connectionStatus = ref('');

// Esta función habla con NUESTRO PROPIO backend, no con el del cliente.

watch(() => store.isIpConfigModalVisible, (isVisible) => {
  if (isVisible) {
    // Opcional: Al abrir, nos aseguramos de que la IP mostrada sea la más reciente del store.
    ipAddress.value = store.serverIp;
  } else {
    // Cuando la modal se cierra (isVisible es false), reseteamos su estado interno.
    console.log("Modal cerrada, reseteando estado.");
    isLoading.value = false;
    connectionStatus.value = '';
  }
});

async function checkServerConnection() {
  const proxyUrl = `${BACK_URL}/VentaRuta/recursos/test`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Le enviamos la IP del cliente a nuestro backend
      //body: JSON.stringify({ targetIp: targetIp }),
    });

    const result = await response.json();
    console.log(result)

    if (result.success) {
      console.log('El backend proxy confirmó la conexión.');
      return true;
    } else {
      console.error('El backend proxy reportó un error:', result.message);
      throw new Error(result.message);
    }

  } catch (error) {
    console.error('Error al contactar el backend proxy:', error);
    throw new Error('No se pudo comunicar con el servidor proxy.');
  }
}

async function handleConnect() {
  isLoading.value = true;
  connectionStatus.value = '';
  let isConnectionSuccessful = false;

  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/.test(ipAddress.value)) {
      setAlert('error', 'Formato de IP:PUERTO no válido.');
      isLoading.value = false;
      return;
  }

  store.serverIp = ipAddress.value;

  for (let attempt = 1; attempt <= 3; attempt++) {
    connectionStatus.value = `Conectando a ${ipAddress.value}... (intento ${attempt}/3)`;
    try {
      await checkServerConnection(ipAddress.value);
      isConnectionSuccessful = true;
      
      break;

    } catch (error) {
        console.log(`Intento ${attempt} fallido:`, error);
      if (attempt === 3) {
        setAlert('error', 'No se pudo conectar tras 3 intentos.');
        closeIpConfigModal()
      }
    }
  }

  if (isConnectionSuccessful) {
    try {
      saveServerIp(ipAddress.value);

      setAlert('success', `Conexión con ${ipAddress.value} establecida.`);

      await fetchAndStoreData(false);
      
      closeIpConfigModal();

    } catch (syncError) {
      console.error("Fallo la sincronización después de una conexión exitosa:", syncError);
      connectionStatus.value = 'Fallo la sincronización.';
    }

    isLoading.value = false;
    connectionStatus.value = '';
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="store.isIpConfigModalVisible" class="modal-overlay" @click.self="closeIpConfigModal">
      <div class="modal-content">
        <div class="modal-header">
          <div class="icons-wrapper">
            <svg class="icon-laptop" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4A5568" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>
            <svg class="icon-globe" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <button class="close-button" @click="closeIpConfigModal">&times;</button>
        </div>
        <div class="modal-body">
          <label for="ip-input">DIRECCIÓN DEL SERVIDOR</label>
          <input 
            id="ip-input" 
            type="text" 
            v-model="ipAddress" 
            placeholder="Ej: 192.168.0.1:8080"
          >
          <p v-if="isLoading" class="status-text">{{ connectionStatus }}</p>
        </div>
        <div class="modal-footer">
          <button @click="handleConnect" :disabled="isLoading" class="connect-button">
            {{ isLoading ? 'CONECTANDO...' : 'CONECTAR' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
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
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 350px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  text-align: center;
  position: relative;
}
.modal-header {
  margin-bottom: 20px;
  position: relative;
}
.icons-wrapper {
  position: relative;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-laptop {
  position: absolute;
}
.icon-globe {
  position: absolute;
  left: 55%;
  top: 10%;
}
.close-button {
  position: absolute;
  top: -15px;
  right: -10px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #888;
}
.modal-body label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}
.modal-body input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  box-sizing: border-box;
}
.status-text {
  margin-top: 15px;
  color: #555;
  font-size: 14px;
  height: 20px;
}
.modal-footer {
  margin-top: 10px;
}
.connect-button {
  width: 100%;
  background-color: #28a745;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.connect-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
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