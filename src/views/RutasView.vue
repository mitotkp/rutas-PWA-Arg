<script setup>
import { ref, onUnmounted, onMounted, computed, watch, nextTick } from 'vue';
import { setAlert, store, markClientAsVisited } from '@/store';
import { useRouter } from 'vue-router';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; 
import 'leaflet-routing-machine'; 

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

const nearbyClient = ref(null); 

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const router = useRouter();

const mapContainer = ref(null);
const mapInstance = ref(null);
const userMarker = ref(null);
const clientMarkersCluster = ref(null);
const userLocation = ref(null);
const userAddress = ref('Obteniendo ubicación...');
const isLoadingLocation = ref(true);
const isLoadingClients = ref(true);

const routingControl  = ref(null); 
const isCalculatingRoute = ref(false); 

const localClientes = ref([]); 
const isRouteVisible = ref(false);

let watchId = null; 

let proximidadCheck = null; 

const clientsWithCoords = computed(() => {
    if (!store.user || !store.rutas || localClientes.value.length === 0) return [];

    const misRutasIds = store.rutas
        .filter(ruta => ruta.codVendedor === store.user.codVendedor)
        .map(ruta => ruta.codRuta);

    return localClientes.value.filter(cliente => {
        const hasCoords = cliente.coordenadas && typeof cliente.coordenadas === 'string' && cliente.coordenadas.includes(',');
        return misRutasIds.includes(cliente.codRuta) && hasCoords;
    });
});

async function handlePositionUpdate(position) {
    console.log('[DEBUG] Nueva ubicación recibida:', position.coords);
    const { latitude, longitude } = position.coords;
    const newLocation = [latitude, longitude];

    if (!userLocation.value) {
        try {
            const response = await fetch(`/nominatim/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            userAddress.value = data.display_name || 'Ubicación actual';
        } catch (error) {
            console.error("Error obteniendo dirección:", error);
            userAddress.value = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
        } finally {
            isLoadingLocation.value = false;
        }
    }

    userLocation.value = newLocation;

    if (mapInstance.value) {
        if (userMarker.value) {
            userMarker.value.setLatLng(newLocation);
        } else {
            const userIcon = L.divIcon({
                html: '<div class="user-marker-pulse"></div>',
                className: 'user-marker-icon',
                iconSize: [24, 24]
            });
            userMarker.value = L.marker(newLocation, { icon: userIcon }).addTo(mapInstance.value);
            mapInstance.value.setView(newLocation, 15); 
        }
    }
    if (!proximidadCheck) {
        console.log('[DEBUG] Configurando intervalo de proximidad.');
        checkProximity(); 
        proximidadCheck = setInterval(checkProximity, 15000);
    }
}

function handlePositionError(error) {
    let errorMessage = "No se pudo obtener la ubicación.";
    if (error.code === 1) errorMessage = "Permiso de ubicación denegado.";
    else if (error.code === 2) errorMessage = "Ubicación no disponible. Revisa tu GPS.";
    userAddress.value = errorMessage;
    isLoadingLocation.value = false;
    console.error('[DEBUG] Error de geolocalización:', error.message);
}

function startWatchingLocation() {
    console.log('[DEBUG] Iniciando seguimiento de ubicación...');
    isLoadingLocation.value = true;
    if (!navigator.geolocation) {
        userAddress.value = "Geolocalización no soportada.";
        isLoadingLocation.value = false;
        return;
    }
    
    watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function parseCoordinates(coordStr) {
    const parts = coordStr.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [lat, lng] = parts;
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng];
    }
    return null;
}

function toggleRuta() {
    if (isRouteVisible.value) {
        routingControl.value.setWaypoints([]);
        if(clientMarkersCluster.value && !mapInstance.value.hasLayer(clientMarkersCluster.value)) {
            mapInstance.value.addLayer(clientMarkersCluster.value);
        }
        isRouteVisible.value = false;
    } else {
        if (!userLocation.value || clientsWithCoords.value.length === 0) {
            setAlert('error', 'Se necesita la ubicación del usuario y al menos un cliente para calcular la ruta.'); 
            //alert("Se necesita la ubicación del usuario y al menos un cliente para calcular la ruta.");
            return;
        }
        isCalculatingRoute.value = true;

        const validClientCoords = clientsWithCoords.value
            .map(cliente => parseCoordinates(cliente.coordenadas))
            .filter(Boolean); 

        if (validClientCoords.length === 0) {
            setAlert('error', 'Ninguno de los clientes aptos tiene un formato de coordenadas válido para trazar la ruta.'); 
            //alert("Ninguno de los clientes aptos tiene un formato de coordenadas válido para trazar la ruta.");
            isCalculatingRoute.value = false;
            return;
        }
        
        const waypoints = [
            L.latLng(userLocation.value[0], userLocation.value[1]),
            ...validClientCoords.map(coords => L.latLng(coords[0], coords[1]))
        ];

        routingControl.value.setWaypoints(waypoints);
        
        setTimeout(() => {
            isCalculatingRoute.value = false;
            isRouteVisible.value = true;
        }, 1500);
    }
}

function getDistance(coords1, coords2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371e3; // Radio de la Tierra en metros
    const lat1 = coords1[0];
    const lon1 = coords1[1];
    const lat2 = coords2[0];
    const lon2 = coords2[1];

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en metros
}

function checkProximity() {
    if (!userLocation.value || clientsWithCoords.value.length === 0) {
        if (nearbyClient.value) {
            nearbyClient.value = null;
        }
        return;
    }

    const today = new Date().toDateString();
    let clientFoundNearby = null;

    for (const client of clientsWithCoords.value) {
        const lastVisitDate = client.lastVisited ? new Date(client.lastVisited).toDateString() : null;
        if (lastVisitDate === today) continue; 

        const clientCoords = parseCoordinates(client.coordenadas);
        if (clientCoords) {
            const distance = getDistance(userLocation.value, clientCoords);
            if (distance < 50) {
                clientFoundNearby = client; 
                break;
            }
        }
    }

    nearbyClient.value = clientFoundNearby;
}

onMounted(() => {
    nextTick(() => {
        if (mapContainer.value && !mapInstance.value) {
            mapInstance.value = L.map(mapContainer.value, { zoomControl: false }).setView([11.0186, -63.8711], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapInstance.value);
            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.value);
            clientMarkersCluster.value = L.markerClusterGroup();
            mapInstance.value.addLayer(clientMarkersCluster.value);
            
            routingControl.value = L.Routing.control({
                waypoints: [], 
                routeWhileDragging: false,
                lineOptions: { styles: [{ color: '#28a745', opacity: 1, weight: 5 }] },
                createMarker: function(i, waypoint, n) {
                    
                    if (i === 0) {
                        return null; 
                    }

                    const marker = L.marker(waypoint.latLng);
                    console.log(n); 

                    const client = i > 0 ? clientsWithCoords.value[i-1] : null;
                    const label = `Parada ${i}: ${client?.nombreComercial}`;
                    marker.bindPopup(label);
                    return marker;
                },
                show: false, 
                addWaypoints: false
            }).addTo(mapInstance.value);
            
            mapInstance.value.invalidateSize();
            startWatchingLocation();
        }

        if (store.clientes && store.clientes.length > 0) {
            //console.log("Datos del store encontrados. Creando copia reactiva local.");
            localClientes.value = store.clientes;
        }
    });
});

watch(localClientes, (newClientList) => {
    //console.log("El watch de localClientes se ha disparado.");
    console.log(newClientList); 
    isLoadingClients.value = false;

    if (!clientMarkersCluster.value) return;

    clientMarkersCluster.value.clearLayers();
    
    const clientsToDraw = clientsWithCoords.value;
    //console.log(`Clientes aptos para dibujar (según computed): ${clientsToDraw.length}`);

    if (clientsToDraw.length > 0) {
        //console.log('--- ANÁLISIS DE PARSEO DE COORDENADAS ---');
        
        const markers = clientsToDraw.map(cliente => {
            const coordString = cliente.coordenadas;
            const parsedResult = parseCoordinates(coordString);
            
            console.log(`Cliente: ${cliente.nombreComercial} | Coordenadas de entrada: "${coordString}" | Resultado del parseo:`, parsedResult);

            if (parsedResult) {
                return L.marker(parsedResult).bindPopup(`<b>${cliente.nombreComercial}</b><br>${cliente.direccion}`);
            }
            return null; 
        }).filter(Boolean); 

        if (markers.length > 0) {
            clientMarkersCluster.value.addLayers(markers);
            if (!userLocation.value) {
                mapInstance.value.fitBounds(clientMarkersCluster.value.getBounds().pad(0.5));
            }
        }
    } else {
        console.log("No se crearon marcadores porque no hay clientes que pasen el filtro inicial.");
    }
}, { 
    deep: true,
});

function confirmVisit() {
  if (nearbyClient.value) {
    markClientAsVisited(nearbyClient.value.codCliente);
    nearbyClient.value = null; 
  }
}

function dismissNotification() {
  nearbyClient.value = null; 
}

onUnmounted(() => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        console.log('[DEBUG] Seguimiento de ubicación detenido.');
    }
    if (proximidadCheck) {
        clearInterval(proximidadCheck);
        proximidadCheck = null;
    }
    if (mapInstance.value) {
        mapInstance.value.remove();
        mapInstance.value = null;
    }
});
</script>

<template>
    <div class="rutas-container">
        <div class="rutas-info card">
            <div class="rutas-tittle">
                <h1>Mis Rutas</h1>
            </div>
            <div class="rutas-user-ubicacion">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span :class="{ 'loading': isLoadingLocation }">{{ userAddress }}</span>
            </div>
            <div class="rutas-user-accion">
                 <button class="action-btn primary" @click="toggleRuta" :disabled="isCalculatingRoute">
                    <span v-if="!isCalculatingRoute">Iniciar Ruta</span>
                    <span v-else>Calculando...</span>
                </button>
                <button class="action-btn secondary" @click="router.push({ name: 'clientes' })">Libreta de Clientes</button>
            </div>
        </div>

        <div class="map-wrapper">
            <Transition name="slide-down">
                <div v-if="nearbyClient" class="proximity-notification">
                    <span>Estás cerca de <strong>{{ nearbyClient.nombreComercial }}</strong>. ¿Registrar visita?</span>
                    <div class="notification-actions">
                        <button @click="confirmVisit" class="btn-confirm">Sí, Visité</button>
                        <button @click="dismissNotification" class="btn-dismiss">Omitir</button>
                    </div>
                </div>
            </Transition>

            <div class="rutas-map" ref="mapContainer"></div>
            <div v-if="isLoadingClients" class="loading-overlay">
                <div class="spinner"></div>
                <p>Cargando clientes en el mapa...</p>
            </div>
        </div>
        
        <div class="rutas-footer">
            <p>La ubicación del vendedor es un estimado. Las ubicaciones de los clientes dependen de los datos registrados.</p>
        </div>
    </div>
</template>

<style scoped>
.rutas-container {
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
.rutas-info {
    padding: 20px;
    margin: 20px;
    flex-shrink: 0;
}
.rutas-tittle h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 15px 0;
}
.rutas-user-ubicacion {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 15px;
    color: #495057;
}
.rutas-user-ubicacion .loading {
    font-style: italic;
    color: #718096;
}
.rutas-user-accion {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
}
.action-btn {
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}
.action-btn:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
}
.action-btn.primary { background-color: #28a745; color: white; }
.action-btn.secondary { background-color: #e9ecef; color: #495057; }

.map-wrapper {
    position: relative;
    flex-grow: 1;
    margin: 0 20px 20px 20px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #dee2e6;
}

.rutas-map {
    width: 100%;
    height: 100%;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    border-radius: 12px;
    transition: opacity 0.3s ease;
}

.loading-overlay p {
    margin-top: 15px;
    font-weight: 600;
    color: #34495e;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.rutas-footer {
    padding: 15px 20px;
    text-align: center;
    font-size: 12px;
    color: #718096;
    flex-shrink: 0;
}

.proximity-notification {
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 12px 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    flex-wrap: wrap;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #333;
    flex-grow: 1;
}

.notification-content svg {
    color: #28a745;
    flex-shrink: 0;
}

.notification-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.notification-actions button {
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}

.btn-confirm {
    background-color: #28a745;
    color: white;
}

.btn-dismiss {
    background-color: #f1f1f1;
    color: #555;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-150%);
  opacity: 0;
}

:global(.user-marker-icon) {
    background-color: #007bff;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
}
:global(.user-marker-pulse) {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #007bff;
    border: 3px solid white;
    box-shadow: 0 0 0 rgba(0, 123, 255, 0.4);
    animation: pulse 2s infinite;
}

:global(.leaflet-routing-container) {
    display: none;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
}

@media (min-width: 768px) {
  .rutas-container {
    flex-direction: row; /* Lado a lado */
    height: calc(100vh - 60px);
    overflow: hidden; /* Evita doble scroll */
  }

  .rutas-info {
    width: 350px; /* Panel lateral fijo */
    margin: 0;
    border-right: 1px solid #e2e8f0;
    border-radius: 0;
    box-shadow: 2px 0 10px rgba(0,0,0,0.05);
    z-index: 2;
    overflow-y: auto; /* Scroll solo en el panel */
  }

  .map-wrapper {
    margin: 0;
    border-radius: 0;
    border: none;
    flex-grow: 1; /* El mapa ocupa todo el resto */
  }

  .rutas-footer { display: none; }
}

@media (max-width: 480px) {
  .proximity-notification {
    flex-direction: column; 
    align-items: flex-start; 
    gap: 10px;
  }

  .notification-actions {
    width: 100%; 
    display: grid;
    grid-template-columns: 1fr 1fr; 
  }
}
</style>