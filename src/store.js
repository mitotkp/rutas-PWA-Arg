import { reactive, computed } from "vue";
import { db, processAndSaveApiData, processAndSaveCatalogData, saveOrUpdatePedido, getPedidosForVendedor, markPedidoAsSubido, updateClientCoordinates, deletePedido, markClientAsVisited as dbMarkClientAsVisited } from "./database.js";
import { encriptacion } from "./encriptacion.js";
import { startHeartbeat, stopHeartbeat } from "./services/connectionService.js";
import { BACK_URL } from "../backurl.js";
import { io } from "socket.io-client";

let socket = null 
let gpsWatchId = null 

export function iniciarRastreo() {
    if (!store.user) return;

    const serverUrl = BACK_URL.split('/VentaRuta')[0]; 
    socket = io(serverUrl);

    socket.on('connect', () => {
        console.log('📡 Conectado al satélite de rastreo (WebSocket)');
    });

    if (navigator.geolocation) {
        gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                if (socket && socket.connected) {
                    socket.emit('enviarUbicacion', {
                        codVendedor: store.user.codVendedor,
                        nombre: store.user.nombre,
                        lat: latitude,
                        lng: longitude,
                        timestamp: new Date().toISOString()
                    });
                }
            },
            (error) => {
                console.error('Error de GPS en rastreo:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
    }
}

export function detenerRastreo() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

function saveSession(codVendedor) {
    localStorage.setItem('loggedInUser', codVendedor);
}

function getSession() {
    return localStorage.getItem('loggedInUser');
}

function clearSession() {
    localStorage.removeItem('loggedInUser'); 
}

const getSavedIp = () => { return localStorage.getItem('serverIp') || '192.168.1.100' }; 
let alertTimer = null; 

export const store = reactive({
    user: null,
    serverIp: getSavedIp(),
    isIpConfigModalVisible: false,
    isRetryingConnection: false,
    loadinMessage: '',
    isServerOnline: true, 
    isOfflineBannerVisible: false,
    isSidenavOpen: false,
    isLoadingCatalago: false,
    loadingProgress: 0,
    preSelectedClientId: null,
    vendedores: [],
    rutas: [],
    clientes: [],
    articulos: [],
    pedido: { cliente: null, items: [], status: 'Pendiente', id: null },
    alert: { show: false, message: '', type: 'error' },
    pedidosGuardadosList: [],
    isSubiendoPedido: false,
    installPromptEvent: null, 
    showInstallButton: false, 
});

//Controlar el menú lateral
export function toggleSidenav() {
    store.isSidenavOpen = !store.isSidenavOpen;
}

//Determinar el estado del servidor 
export function setServerStatus(isOnline) {
    if(store.isServerOnline !== isOnline) {
        store.isServerOnline = isOnline
        const message = isOnline ? 'Conexión con el servidor restablecida.' : 'Se perdió la conexión. Trabajando en modo local.';
        const type = isOnline ? 'success' : 'error';
        setAlert(type, message, 5000);
    }
}

//Propidad calculada para saber si el usuario esta autenticado
export const isAuthenticated = computed(() => !!store.user)

export async function fetchAndStoreData(background) {
    console.log('Iniciando obtención de datos de vendedores...');
    try {
        const response = await fetch(`${BACK_URL}/VentaRuta/recursos/vendedores`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            //body: JSON.stringify({ targetIp: store.serverIp })
        });

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
            // 3. Llamamos a la nueva función para procesar y guardar los datos en IndexedDB
            await processAndSaveApiData(result.data);
            
            // 4. Después de guardar, cargamos los datos a la memoria para que la UI los use
            await loadDataIntoMemory();
            
            if(background == false){
                setAlert('success', `Se sincronizaron los datos exitosamente.`);
            }
            else{
                console.log(`Se sincronizaron los datos exitosamente.`)
            }
            
        } else {
            throw new Error(result.message || 'La respuesta del servidor no fue un array.');
        }
    } catch (error) {
        console.error('Fallo al obtener y guardar los datos:', error);
        if(background == false){
            setAlert('error', 'No se pudieron sincronizar los datos.');
        }
        else{
            console.log('No se pudieron sincronizar los datos.')
        }
        //setAlert('error', 'No se pudieron sincronizar los datos.');
        // Lanzamos el error para que las funciones que llaman a esta sepan que falló
        throw error;
    }
}

//Funciónes para cargar los articulos 
export async function syncCatalogo() {
    if (store.isLoadingCatalogo) return;

    store.isLoadingCatalogo = true;
    store.loadingMessage = 'Iniciando sincronización...';
    store.loadingProgress = 0;

    const steps = [
        { name: 'Artículos', endpoint: '' },
        { name: 'Stock', endpoint: 'getStock' },
        { name: 'Precios', endpoint: 'getPrecios' },
        { name: 'Tarifas', endpoint: 'getTarifas' },
        { name: 'Departamentos', endpoint: 'getArbolDepartamento' },
        { name: 'Marcas', endpoint: 'getMarca' }
    ];

    const collectedData = {};

    try {
        // Paso 1: Recolectar datos de todos los endpoints
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const progress = Math.round(((i + 1) / (steps.length + 1)) * 100); // +1 para el paso de guardado
            
            store.loadingMessage = `Paso ${i + 1}/${steps.length}: Cargando ${step.name}...`;
            store.loadingProgress = progress;

            const response = await fetch(`${BACK_URL}/VentaRuta/recursos/articulos/${step.endpoint}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                //body: JSON.stringify({ targetIp: store.serverIp })
            });
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                // Se guardan los datos recolectados en este objeto temporal
                collectedData[`${step.endpoint}Data`] = result.data;
            } else {
                throw new Error(`Fallo al cargar ${step.name}`);
            }
        }

        // Paso 2: Procesar y guardar todos los datos recolectados a la vez
        store.loadingMessage = 'Guardando datos en la base local...';

        console.log(collectedData)

        await processAndSaveCatalogData(collectedData);
        store.loadingProgress = 100;

        setAlert('success', 'Catálogo sincronizado exitosamente.');
        await loadCatalogoIntoMemory();

    } catch (error) {
        console.error('Fallo la sincronización del catálogo:', error);
        setAlert('error', `Error durante la sincronización: ${error.message}`);
    } finally {
        store.isLoadingCatalogo = false;
    }
}

// Carga los artículos de la BDD local a la memoria
export async function loadCatalogoIntoMemory() {
    store.articulos = await db.articulos.toArray();
    console.log(`${store.articulos.length} artículos cargados en memoria.`);
}

// Asegúrate de que loadCatalogoIntoMemory() también se llame en loadInitialData
export async function loadInitialData() {
    await loadDataIntoMemory(); // Carga vendedores, clientes, etc.
    await loadCatalogoIntoMemory(); // Carga el catálogo
}

// Función para cargar los datos desde IndexedDB al estado en memoria de la app
export async function loadDataIntoMemory() {
    try {
        // Usamos Promise.all para cargar todo en paralelo, es más rápido
        const [vendedoresData, rutasData, clientesData] = await Promise.all([
            db.vendedores.toArray(),
            db.rutas.toArray(),
            db.clientes.toArray()
        ]);

        store.vendedores = vendedoresData;
        store.rutas = rutasData;
        store.clientes = clientesData;

        console.log(`Datos cargados en memoria: ${vendedoresData.length} vendedores, ${rutasData.length} rutas, ${clientesData.length} clientes.`);
    } catch (error) {
        console.error("Error al cargar datos de IndexedDB a memoria:", error);
    }
}

export async function loginUser(usuario, password) {
    
    let encryptPassword = encriptacion.encriptar(password)

    // Primero, cargamos los datos desde la BDD local.
    await loadDataIntoMemory();

    // Buscamos si el usuario existe en los datos locales
    const currentUser = store.vendedores.find(v => v.usuario === usuario && v.password === encryptPassword);

    if (currentUser) {
        store.user = currentUser;
        saveSession(currentUser.codVendedor); 
        await loadPedidosGuardados(currentUser.codVendedor)
        startHeartbeat()
        setAlert('success', `¡Bienvenido, ${currentUser.nombre}!`);
        fetchAndStoreData(true); 
        return true;
    } else {
        setAlert('error', 'Usuario o contraseña incorrectos.');
        return false;
    }
}

//Funciones para manejar la ip
export function openIpConfigModal() {
    store.isIpConfigModalVisible = true; 
}

export function closeIpConfigModal() {
    store.isIpConfigModalVisible = false; 
}

export function saveServerIp(ip) {
    store.serverIp = ip; 
    localStorage.setItem('serverIp', ip); 
}

export async function retryConnection() {
    if (store.isRetryingConnection) return;
    
    store.isRetryingConnection = true;
    
    setAlert('info', `Iniciando re-sincronización completa...`, 3000);

    try {
        
        await fetchAndStoreData(true);

        await syncCatalogo(); 

        setAlert('success', '¡Sincronización completada exitosamente!');
    } catch (error) {
        console.error('Fallo en la re-sincronización:', error);
        setAlert('error', 'Fallo la re-sincronización. Revisa tu conexión.');
    } finally {
        store.isRetryingConnection = false;
    }
}

//Helper para mostrar las alertas
export function setAlert(type, message, duration = 4000) {
    // Si ya hay un temporizador, lo limpiamos para que no interfiera
    if (alertTimer) {
        clearTimeout(alertTimer);
    }

    store.alert.type = type;
    store.alert.message = message;
    store.alert.show = true;

    // Creamos un nuevo temporizador para la alerta actual
    alertTimer = setTimeout(() => {
        store.alert.show = false;
    }, duration);
}

//Preseleccionar un cliente para los pedidos u otras cosas 
export function setPreselectedClient(clienteId) {
    store.preselectedClientId = clienteId;
}

//Funciones para manejar el pedido 
export async function setPedidoCliente(cliente) {
    // 1. Guardar el pedido ACTIVO (si existe y tiene items)
    if (store.pedido.cliente && store.pedido.items.length > 0 && store.user && store.pedido.status === 'Pendiente') {
        await saveOrUpdatePedido(store.pedido, store.user.codVendedor);
    }

    console.log(`Iniciando nuevo pedido para ${cliente.nombreComercial}`)
    limpiarPedido(); 

    store.pedido.cliente = cliente; 

    await loadPedidosGuardados(store.user.codVendedor);
}

export async function loadPedidoById(pedido) {
    const clienteCompleto = store.clientes.find(c => c.codCliente === pedido.codCliente); 
    if(clienteCompleto) {
        store.pedido.id = pedido.id; 
        store.pedido.cliente = clienteCompleto; 
        store.pedido.items = pedido.items; 
        store.pedido.status = pedido.status; 
        store.pedido.fecha = pedido.fecha; 
    }
}

export async function loadPedidosGuardados(codVendedor) {
    if (!codVendedor) return 

    store.pedidosGuardadosList = await getPedidosForVendedor(codVendedor);
    console.log(`${store.pedidosGuardadosList.length} pedidos guardados cargados para el vendedor ${codVendedor}`);
}

export function iniciarOAgregarItem(cliente, item) {
    if (store.pedido.status === 'Subido') {
        setAlert('error', 'Este pedido ya fue subido y no se puede modificar.');
        return;
    }
    const existingItem = store.pedido.items.find(i => i.producto.codArticulo === item.producto.codArticulo); 

    if(existingItem) {
        existingItem.cantidad += item.cantidad; 
    } else {
        store.pedido.items.push(item); 
    }
}

export function eliminarItemDelPedido(codArticulo) {
    
    if (store.pedido.status === 'Subido') {
        setAlert('error', 'Este pedido ya fue subido y no se puede modificar.');
        return;
    }
    
    store.pedido.items = store.pedido.items.filter(i => i.producto.codArticulo !== codArticulo); 
}

export function actualizarCantidadItem(codArticulo, nuevaCantidad) {
    
    if (store.pedido.status === 'Subido') {
        setAlert('error', 'Este pedido ya fue subido y no se puede modificar.');
        return;
    }
    
    const item = store.pedido.items.find(i => i.producto.codArticulo === codArticulo);
    if (item) {
        if (nuevaCantidad > 0) {
            item.cantidad = nuevaCantidad;
        } else {
            // Si la cantidad es 0 o menos, lo eliminamos
            eliminarItemDelPedido(codArticulo);
        }
    }
}

export function limpiarPedido() {
    store.pedido.cliente = null;
    store.pedido.items = [];
    store.pedido.status = 'Pendiente';
    store.pedido.id = null; 
}

export async function pausarPedidoActual() {
    // Si hay un cliente y el pedido tiene items, lo guardamos localmente
    if (store.pedido.cliente && store.pedido.items.length > 0 && store.user && store.pedido.status === 'Pendiente') {
        await saveOrUpdatePedido(store.pedido, store.user.codVendedor);
        setAlert('success', 'Pedido guardado para continuar después.');
    }

    // Limpiamos el pedido actual de la memoria (esto libera la pantalla)
    limpiarPedido();

    // Recargamos la lista del historial
    if (store.user) {
        await loadPedidosGuardados(store.user.codVendedor);
    }
}

export const totalItemsPedido = computed(() => {
    return store.pedido.items.reduce((sum, item) => sum + item.cantidad, 0);
});

export const totalMontoPedido = computed(() => {
    return store.pedido.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
});

export async function subirPedidoActual() {
    if(!store.pedido.cliente || store.pedido.items.length === 0){
        setAlert('error', 'No hay un pedido activo o esta vacío'); 
        return; 
    }
    if(!store.isServerOnline){
        setAlert('error', 'Necesitas una conexión a internet para subir el pedido.'); 
        return; 
    }

    store.isSubiendoPedido = true; 
    setAlert('success', 'Iniciando subida de pedido...', 2000); 

    let pedidoId = null; 

    try {

        pedidoId = await saveOrUpdatePedido(store.pedido, store.user.codVendedor);
        if(!pedidoId) {
            throw new Error("No se puede guardar el pedido localmente antes de subirlo.")
        }

        store.pedido.id = pedidoId; 

        const idRes = await fetch(`${BACK_URL}/ventaRuta/recursos/pedidos/getIdentificador`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        const idData = await idRes.json()
        if (!idData.success) throw new('No se pudo obtener el identificador del pedido.'); 

        const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const pedidoBody = {
            fecha: fecha, 
            pedidos: [{
                id: idData.id,
                linea: store.pedido.items.map(item => ({
                    CODARTICULO: item.producto.codArticulo,
                    COLOR: item.producto.color, 
                    TALLA: item.producto.talla, 
                    CODCLIENTE: store.pedido.cliente.codCliente,
                    CODVENDEDOR: store.user.codVendedor,
                    UNIDADES: item.cantidad,
                    CODTARIFA: store.pedido.cliente.codTarifa
                }))
            }]
        };
        console.log(pedidoBody)

        const postRes = await fetch(`${BACK_URL}/VentaRuta/recursos/pedidos/postPedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoBody)
        })

        const postData = await postRes.json(); 
        if(!postData.success) throw new Error(postData.message || 'Fallo al enviar el pedido.'); 

        // const pedidoGuardado = await db.pedidosGuardados
        //     .where('codCliente').equals(store.pedido.cliente.codCliente)
        //     .first()

        
        await markPedidoAsSubido(pedidoId); 
        
        setAlert('success', '¡Pedido subido existosamente!');
        
        limpiarPedido()

        await loadPedidosGuardados(store.user.codVendedor); 

        return true; 
    } catch (error) {
        console.error("Error al subir el pedido:", error);
        setAlert('error', `Error: ${error.message}`);
        
        return false; 
    } finally {
        store.isSubiendoPedido = false;
    }
}

export async function cancelarPedidoActual() {
    // Quitamos la restricción del !store.pedido.id
    if(!store.pedido.cliente || store.pedido.status !== 'Pendiente') {
        setAlert('error', 'No se puede cancelar este pedido.');
        return false;
    }

    try{
        // Solo intentamos borrar de la BDD si realmente tiene un ID guardado
        if (store.pedido.id) {
            await deletePedido(store.pedido.id);
        }

        // Limpiamos el estado en memoria
        limpiarPedido()

        // Recargamos la lista para actualizar la vista
        if (store.user) {
            await loadPedidosGuardados(store.user.codVendedor)
        }

        setAlert('success', 'El pedido ha sido cancelado.');
        return true;
    } catch (error) {
        console.error("Error al cancelar el pedido:", error);
        setAlert('error', 'Ocurrió un error al cancelar el pedido.');
        return false;
    }
}

export async function restoreSession() {
    const userId = getSession();
    if (userId) {
        console.log(`Restaurando sesión para el vendedor ID: ${userId}`);
        const userIdNumber = Number(userId);
        // Primero cargamos los vendedores para poder buscar
        await loadDataIntoMemory(); 
        const userFromDb = store.vendedores.find(v => v.codVendedor === userIdNumber);

        if (userFromDb) {
            store.user = userFromDb;
            // Cargamos el resto de los datos asociados a este usuario
            await loadPedidosGuardados(userFromDb.codVendedor);
            await loadCatalogoIntoMemory();
            startHeartbeat();
            return true;
        }
    }
    console.log("No se encontró sesión para restaurar.");
    return false;
}

export async function saveClientCoordinates(codCliente, newCoordinates) {
  try {
    const success = await updateClientCoordinates(codCliente, newCoordinates);
    if (success) {
      // Si se guardó en la BDD, actualizamos también el estado en memoria
      const clientIndex = store.clientes.findIndex(c => c.codCliente === codCliente);
      if (clientIndex !== -1) {
        store.clientes[clientIndex].coordenadas = newCoordinates;
      }
      setAlert('success', 'Ubicación del cliente actualizada exitosamente.');
      return true;
    } else {
      throw new Error("Cliente no encontrado en la base de datos local.");
    }
  } catch (error) {
    console.error("Error al guardar coordenadas del cliente:", error);
    setAlert('error', 'No se pudo actualizar la ubicación.');
    return false;
  }
}

export function logout() {
    store.user = null;
    clearSession();
    stopHeartbeat();
    limpiarPedido();
}

export function setInstallPrompt(event) {
    store.installPromptEvent = event;
    store.showInstallButton = true;
}

// Se llamará desde nuestro botón para mostrar el aviso de instalación del navegador
export async function triggerInstallPrompt() {
    if (!store.installPromptEvent) {
        setAlert('error', 'No se puede instalar la aplicación en este momento.');
        return;
    }
    // Mostramos el aviso nativo del navegador
    store.installPromptEvent.prompt();
    
    // Esperamos a que el usuario tome una decisión (instalar o cancelar)
    const { outcome } = await store.installPromptEvent.userChoice;
    console.log(`El usuario decidió: ${outcome}`);

    if (outcome === 'accepted') {
        setAlert('success', '¡Aplicación instalada exitosamente!');
    }

    // Limpiamos el estado, ya que el aviso solo se puede usar una vez
    store.installPromptEvent = null;
    store.showInstallButton = false;
}

export async function  markClientAsVisited(codCliente) {
    const visitDate = await dbMarkClientAsVisited(codCliente); 
    if(visitDate) {
        const clientIndex = store.clientes.findIndex(c => c.codCliente === codCliente);
        if(clientIndex !== -1){
            store.clientes[clientIndex].lastVisited = visitDate; 
        }
        setAlert('success', 'Visita registrada exitosamente.');
        return true;
    }
    setAlert('error', 'No se pudo registrar la visita.');
    return false;
}