<script setup>
import { ref, watch, nextTick } from 'vue';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { saveClientCoordinates } from '@/store.js';
// 1. Importamos los iconos de Lucide
import { X, Search, MapPin } from 'lucide-vue-next';

const props = defineProps({
  isVisible: Boolean,
  cliente: Object
});

const emit = defineEmits(['close']);

const mapContainer = ref(null);
let mapInstance = null;

const searchAddress = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const noResultsFound = ref(false);

function parseCoordinates(coordStr) {
    if (!coordStr || typeof coordStr !== 'string') return null;
    const parts = coordStr.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [lat, lng] = parts;
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return [lat, lng];
        }
    }
    return null;
}

async function searchForAddress() {
    if (!searchAddress.value.trim()) return;
    isSearching.value = true;
    noResultsFound.value = false;
    searchResults.value = [];
    const query = encodeURIComponent(searchAddress.value);
    const url = `/nominatim/search?format=json&q=${query}&countrycodes=ve`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
            searchResults.value = data;
        } else {
            noResultsFound.value = true;
        }
    } catch (error) {
        console.error("Error en la búsqueda de dirección:", error);
        noResultsFound.value = true;
    } finally {
        isSearching.value = false;
    }
}

async function selectAndSaveAddress(result) {
    const newCoords = `${result.lat}, ${result.lon}`;
    const success = await saveClientCoordinates(props.cliente.codCliente, newCoords);
    if (success) {
        emit('close');
    }
}

watch(() => props.isVisible, async (newVal) => {
    if (newVal) {
        await nextTick();
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }
        searchAddress.value = props.cliente?.direccion || '';
        searchResults.value = [];
        isSearching.value = false;
        noResultsFound.value = false;

        const coords = parseCoordinates(props.cliente?.coordenadas);
        if (coords && mapContainer.value) {
            mapInstance = L.map(mapContainer.value).setView(coords, 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapInstance);
            L.marker(coords).addTo(mapInstance)
                .bindPopup(`<b>${props.cliente.nombreComercial}</b>`)
                .openPopup();
            
            // --- CORRECCIÓN CLAVE PARA EL MAPA ---
            // Forzamos al mapa a recalcular su tamaño después de que la modal es visible.
            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 100);
        }
    }
});
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h2><MapPin :size="20" /> Ubicación de {{ cliente?.nombreComercial }}</h2>
          <button class="close-button" @click="emit('close')">
            <X :size="24" />
          </button>
        </div>
        
        <div class="content-wrapper">
          <div v-if="parseCoordinates(cliente?.coordenadas)" ref="mapContainer" class="map-container"></div>
          
          <div v-else class="search-location-container">
            <p class="search-prompt">Este cliente no tiene coordenadas guardadas. Búscalas usando su dirección.</p>
            <div class="search-bar">
              <input type="text" v-model="searchAddress" placeholder="Introduce la dirección a buscar...">
              <button @click="searchForAddress" :disabled="isSearching">
                <Search v-if="!isSearching" :size="18" />
                <span v-else>...</span>
              </button>
            </div>
            <div class="search-results">
                <div v-if="isSearching" class="loading-spinner">Buscando...</div>
                <p v-else-if="noResultsFound" class="no-results">No se encontraron resultados.</p>
                <ul v-else>
                    <li v-for="result in searchResults" :key="result.place_id" @click="selectAndSaveAddress(result)">
                        <strong>{{ result.display_name.split(',')[0] }}</strong>
                        <span>{{ result.display_name.substring(result.display_name.indexOf(',') + 1) }}</span>
                    </li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6); display: flex;
  align-items: center; justify-content: center; z-index: 3000;
}
.modal-content {
  background: white; padding: 20px; border-radius: 12px;
  width: 90%; max-width: 600px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 15px; border-bottom: 1px solid #eee;
  flex-shrink: 0; /* Evita que el header se encoja */
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
.content-wrapper {
    margin-top: 20px;
    height: 400px; /* Altura fija para el contenido */
    border-radius: 8px;
    overflow: hidden;
    display: flex;
}
.map-container {
    width: 100%;
    height: 100%;
}

/* --- ESTILOS CORREGIDOS PARA LA BÚSQUEDA --- */
.search-location-container { 
    display: flex;
    flex-direction: column; /* Apila los elementos verticalmente */
    height: 100%;
    width: 100%;
}
.search-prompt {
    font-size: 14px; color: #718096; text-align: center; margin-bottom: 15px;
    flex-shrink: 0; /* Evita que se encoja */
}
.search-bar {
    display: flex; gap: 10px; margin-bottom: 15px;
    flex-shrink: 0;
}
.search-bar input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
.search-bar button {
    padding: 10px 15px; border: none; background-color: #28a745; color: white; border-radius: 6px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; width: 80px;
    transition: background-color 0.2s;
}
.search-bar button:hover:not(:disabled) {
    background-color: #218838;
}
.search-bar button:disabled { background-color: #95a5a6; }
.search-results {
    flex-grow: 1; /* Ocupa el espacio restante */
    overflow-y: auto; /* Permite scroll si hay muchos resultados */
    border: 1px solid #eee; border-radius: 6px;
    min-height: 0; /* Truco de Flexbox para que el scroll funcione */
}
.search-results ul { list-style: none; padding: 0; margin: 0; }
.search-results li { padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; transition: background-color 0.2s; }
.search-results li:hover { background-color: #f4f7f9; }
.search-results li strong { display: block; font-size: 14px; color: #333; }
.search-results li span { font-size: 12px; color: #718096; }
.loading-spinner, .no-results { text-align: center; padding: 20px; color: #718096; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>