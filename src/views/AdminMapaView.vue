<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { BACK_URL } from '../../backurl.js'; 
import { io } from 'socket.io-client';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, MapPin, Clock, Navigation } from 'lucide-vue-next';

// Referencias y Estado
const mapContainer = ref(null);
const mapInstance = ref(null);
const vendedoresConectados = ref([]);
const marcadoresMap = new Map(); // Para guardar los pines de Leaflet y poder moverlos
let socket = null;

// Formatear la hora de última actualización
const formatTime = (isoString) => {
    if (!isoString) return 'Desconocido';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Función para centrar la cámara en un vendedor específico
const centrarEnVendedor = (vendedor) => {
    if (mapInstance.value && vendedor.lat && vendedor.lng) {
        mapInstance.value.setView([vendedor.lat, vendedor.lng], 16, { animate: true, duration: 1 });
        const marker = marcadoresMap.get(vendedor.codVendedor);
        if (marker) marker.openPopup();
    }
};

// Lógica de actualización de pines en el mapa
const actualizarMarcadores = (listaVendedores) => {
    if (!mapInstance.value) return;

    listaVendedores.forEach(vendedor => {
        const { codVendedor, lat, lng, nombre, timestamp } = vendedor;
        const posicion = [lat, lng];

        if (marcadoresMap.has(codVendedor)) {
            // Si el pin ya existe, solo lo deslizamos a la nueva coordenada
            const marker = marcadoresMap.get(codVendedor);
            marker.setLatLng(posicion);
            marker.setPopupContent(`<b>${nombre}</b><br>Última act: ${formatTime(timestamp)}`);
        } else {
            // Si es un vendedor nuevo, creamos un pin visual atractivo con sus iniciales
            const iniciales = nombre ? nombre.substring(0, 2).toUpperCase() : 'V';
            const icon = L.divIcon({
                className: 'custom-vendor-icon',
                html: `
                    <div class="pin-bounce">
                        <div class="pin-body">
                            <span class="pin-text">${iniciales}</span>
                        </div>
                        <div class="pin-shadow"></div>
                    </div>
                `,
                iconSize: [40, 50],
                iconAnchor: [20, 50],
                popupAnchor: [0, -40]
            });

            const marker = L.marker(posicion, { icon }).addTo(mapInstance.value);
            marker.bindPopup(`<b>${nombre}</b><br>Última act: ${formatTime(timestamp)}`);
            marcadoresMap.set(codVendedor, marker);
        }
    });
};

onMounted(() => {
    // 1. Inicializar el mapa de Leaflet
    nextTick(() => {
        if (mapContainer.value && !mapInstance.value) {
            // Centrado por defecto en Venezuela (o ajusta a tu ciudad)
            mapInstance.value = L.map(mapContainer.value, { zoomControl: false }).setView([11.0186, -63.8711], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
                attribution: '&copy; OpenStreetMap' 
            }).addTo(mapInstance.value);
            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.value);
        }

        // 2. Conectar al WebSocket para recibir los datos en tiempo real
        const serverUrl = BACK_URL.split('/VentaRuta')[0];
        socket = io(serverUrl);

        socket.on('connect', () => {
            console.log('📡 Administrador conectado al radar (WebSocket)');
        });

        socket.on('ubicacionesActualizadas', (data) => {
            vendedoresConectados.value = data;
            actualizarMarcadores(data);
        });
    });
});

onUnmounted(() => {
    if (socket) {
        socket.disconnect();
    }
    if (mapInstance.value) {
        mapInstance.value.remove();
    }
});
</script>

<template>
    <div class="admin-map-container">
        <div class="sidebar card">
            <div class="sidebar-header">
                <h2><Users :size="24" /> Monitoreo en Vivo</h2>
                <p>Vendedores activos: <strong>{{ vendedoresConectados.length }}</strong></p>
            </div>

            <div class="vendedores-list">
                <div v-if="vendedoresConectados.length === 0" class="empty-state">
                    <MapPin :size="40" class="icon-empty" />
                    <p>No hay vendedores transmitiendo ubicación en este momento.</p>
                </div>

                <div 
                    v-for="vendedor in vendedoresConectados" 
                    :key="vendedor.codVendedor" 
                    class="vendedor-card"
                    @click="centrarEnVendedor(vendedor)"
                >
                    <div class="vendedor-info">
                        <h3>{{ vendedor.nombre }}</h3>
                        <span class="vendedor-id">ID: {{ vendedor.codVendedor }}</span>
                    </div>
                    <div class="vendedor-meta">
                        <div class="meta-item text-green">
                            <Navigation :size="14" /> Transmitiendo
                        </div>
                        <div class="meta-item text-gray">
                            <Clock :size="14" /> {{ formatTime(vendedor.timestamp) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="map-wrapper">
            <div class="rutas-map" ref="mapContainer"></div>
        </div>
    </div>
</template>

<style scoped>
.admin-map-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
    background-color: #f4f7f9;
}

.card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Sidebar Estilos */
.sidebar {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 20px;
    flex-shrink: 0;
    max-height: 300px; /* Para móviles */
    overflow: hidden;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    background-color: #1e293b;
    color: white;
    border-radius: 12px 12px 0 0;
}

.sidebar-header h2 {
    margin: 0;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.sidebar-header p {
    margin: 5px 0 0 0;
    color: #94a3b8;
    font-size: 14px;
}

.vendedores-list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 15px;
}

.empty-state {
    text-align: center;
    padding: 30px 10px;
    color: #64748b;
}

.icon-empty {
    color: #cbd5e1;
    margin-bottom: 10px;
}

.vendedor-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.vendedor-card:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
    transform: translateY(-2px);
}

.vendedor-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.vendedor-info h3 {
    margin: 0;
    font-size: 16px;
    color: #1e293b;
}

.vendedor-id {
    font-size: 12px;
    background-color: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    color: #475569;
}

.vendedor-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.text-green { color: #10b981; font-weight: 600; }
.text-gray { color: #64748b; }

/* Mapa Estilos */
.map-wrapper {
    flex-grow: 1;
    margin: 0 20px 20px 20px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #dee2e6;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.rutas-map {
    width: 100%;
    height: 100%;
    z-index: 1;
}

/* Pines Personalizados (CSS Global para Leaflet) */
:global(.custom-vendor-icon) {
    background: transparent;
    border: none;
}

:global(.pin-bounce) {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

:global(.pin-body) {
    width: 36px;
    height: 36px;
    background-color: #3b82f6;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

:global(.pin-text) {
    transform: rotate(45deg);
    color: white;
    font-weight: 800;
    font-size: 14px;
}

@media (min-width: 768px) {
    .admin-map-container {
        flex-direction: row;
        overflow: hidden;
    }

    .sidebar {
        width: 380px;
        margin: 0;
        border-radius: 0;
        max-height: none;
        border-right: 1px solid #e2e8f0;
        z-index: 2;
    }
    
    .sidebar-header { border-radius: 0; }
    
    .map-wrapper {
        margin: 0;
        border-radius: 0;
        border: none;
    }
}
</style>