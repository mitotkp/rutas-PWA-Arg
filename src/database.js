import Dexie from 'dexie';
export const db = new Dexie('VentaRutaDB');

db.version(14).stores({
  vendedores: '&codVendedor',
  rutas:       '[codVendedor+codRuta]', // Clave primaria compuesta
  clientes:    '[codRuta+codCliente], codCliente, lastVisited',    // Clave primaria compuesta
  cuentasPorCobrar: '++id, documento, codCliente',
  articulos: '&codArticulo, [numDpto+numSeccion+numFamilia]', // Clave primaria y un índice para buscar por categoría
  stock: '&codArticulo',
  precios: '++id, [codArticulo+idTarifa]', 
  tarifas: '&idTarifa', 
  marca: '&marca',
  // Tablas para normalizar el árbol de categorías
  departamentos: '&numDpto',
  secciones: '[numDpto+numSeccion]',
  familias: '[numSeccion+numFamilia]',

  pedidosGuardados: '++id, codCliente, [codVendedor+fecha], status, fecha',
}).upgrade(tx => {
    console.log("Actualizando esquema de la base de datos a la versión 11...");
    return Promise.all([
        tx.table('vendedores').clear(),
        tx.table('rutas').clear(),
        tx.table('clientes').clear(),
        tx.table('cuentasPorCobrar').clear(),
        tx.table('articulos').clear(),
        tx.table('stock').clear(),
        tx.table('precios').clear(),
        tx.table('tarifas').clear(),
        tx.table('arbolDepartamentos').clear(),
        tx.table('marca').clear(),
        tx.table('pedidosGuardados').clear(),
    ]);
});

export async function processAndSaveCatalogData(catData) {
    const { Data, getStockData, getPreciosData, getTarifasData, getArbolDepartamentoData, getMarcaData } = catData;

    // Listas para guardar los datos normalizados
    const articulos = [];
    const stock = [];
    const precios = [];
    const tarifas = [];
    const departamentos = [];
    const secciones = [];
    const familias = [];
    const marcas = []

    // 1. Procesar Artículos y Stock 
    Data.forEach(art => articulos.push(art));
    getStockData.forEach(s => stock.push(s));

    // 2. Procesar Precios, Tarifas y Marcas 
    getPreciosData.forEach(p => precios.push(p));
    getTarifasData.forEach(t => tarifas.push(t));
    getMarcaData.forEach(m => marcas.push(m))

    // 3. Aplanar el árbol de Departamentos
    getArbolDepartamentoData.forEach(dpto => {
        departamentos.push({ numDpto: dpto.numDpto, nombreDepartamento: dpto.nombreDepartamento });
        dpto.secciones.forEach(sec => {
            secciones.push({ numDpto: dpto.numDpto, numSeccion: sec.numSeccion, nombreSeccion: sec.nombreSeccion });
            sec.familias.forEach(fam => {
                familias.push({ numSeccion: sec.numSeccion, numFamilia: fam.numFamilia, nombreFamilia: fam.nombreFamilia });
            });
        });
    });

    // 4. Guardar todo en la base de datos en una sola transacción
    try {
        await db.transaction('rw', db.articulos, db.stock, db.precios, db.tarifas, db.departamentos, db.secciones, db.familias, db.marca, async () => {
            // Limpiar tablas antiguas
            await Promise.all([
                db.articulos.clear(), db.stock.clear(), db.precios.clear(), db.tarifas.clear(),
                db.departamentos.clear(), db.secciones.clear(), db.familias.clear(), db.marca.clear()
            ]);
            // Insertar nuevos datos
            await Promise.all([
                db.articulos.bulkPut(articulos),
                db.stock.bulkPut(stock),
                db.precios.bulkPut(precios),
                db.tarifas.bulkPut(tarifas),
                db.departamentos.bulkPut(departamentos),
                db.secciones.bulkPut(secciones),
                db.familias.bulkPut(familias),
                db.marca.bulkPut(marcas)
            ]);
        });
        console.log("Datos del catálogo normalizados y guardados exitosamente.");
    } catch (error) {
        console.error('Error al guardar los datos del catálogo en IndexedDB:', error);
        throw error; // Relanzar el error para que el store lo maneje
    }
}

export async function processAndSaveApiData(apiData) {
  const vendedores = [];
  const rutas = [];
  const clientesNuevos = []; 
  const cuentasPorCobrar = [];

  const clientesExistentesMap = new Map(
    (await db.clientes.toArray()).map(c => [c.codCliente, c])
  );

  apiData.forEach(vendedor => {
    vendedores.push({
      codVendedor: vendedor.codVendedor,
      nombre: vendedor.nombre,
      foto: vendedor.foto,
      usuario: vendedor.usuario,
      password: vendedor.password,
      descatalogado: vendedor.descatalogado,
      bloqueado: vendedor.bloqueado
    });

    vendedor.rutas.forEach(ruta => {
      rutas.push({
        codRuta: ruta.codRuta,
        descripcion: ruta.descripcion,
        codVendedor: vendedor.codVendedor
      });

      ruta.clientes.forEach(cliente => {
        const clienteExistente = clientesExistentesMap.get(cliente.codCliente);
        const coordenadasServidor = cliente.coordenadas && cliente.coordenadas.trim() !== '' && cliente.coordenadas.trim() !== '0'; 
        
        const clienteProcesado = {
          ...cliente, 
          codRuta: ruta.codRuta,
        
          lastVisited: clienteExistente ? clienteExistente.lastVisited : null,
          coordenadas: coordenadasServidor ? cliente.coordenadas : (clienteExistente ? clienteExistente.coordenadas : null)
        };
        
        clientesNuevos.push(clienteProcesado);

        cliente.cuentasPorCobrar.forEach(cuenta => {
          cuentasPorCobrar.push({
            deuda: cuenta.deuda,
            documento: cuenta.documento,
            fechaDocumento: cuenta.fechaDocumento,
            fechaVencimiento: cuenta.fechaVencimiento,
            codCliente: cliente.codCliente
          });
        });
      });
    });
  });

  try {
    await db.transaction('rw', db.vendedores, db.rutas, db.clientes, db.cuentasPorCobrar, async () => {
      await Promise.all([
        db.vendedores.clear(),
        db.rutas.clear(),
        db.cuentasPorCobrar.clear()
      ]);

      await Promise.all([
        db.vendedores.bulkAdd(vendedores),
        db.rutas.bulkAdd(rutas),
        db.clientes.bulkPut(clientesNuevos), 
        db.cuentasPorCobrar.bulkAdd(cuentasPorCobrar)
      ]);
    });
    console.log(`Datos sincronizados (preservando visitas): ${vendedores.length} vendedores, ${rutas.length} rutas, ${clientesNuevos.length} clientes.`);
  } catch (error) {
    console.error('Error al guardar los datos normalizados en IndexedDB:', error);
  }
  
}

// Las funciones para obtener datos 
export async function getLocalVendedor(codVendedor) {
    return await db.vendedores.where('codVendedor').equals(codVendedor).toArray(); 
}

export async function getCliente(codCliente) {
  return await db.clientes.where('codCliente').equals(codCliente).toArray();
}

export async function getTotalDeudaVendedor(codVendedor) {
  try {
    const rutasDelVendedor = await db.rutas.where('codVendedor').equals(codVendedor).toArray();
    const misRutasIds = rutasDelVendedor.map(r => r.codRuta);

    if (misRutasIds.length === 0) return 0; 

    const clientesDelVendedor = await db.clientes.where('codRuta').anyOf(misRutasIds).toArray();
    const misClientesIds = clientesDelVendedor.map(c => c.codCliente);

    if (misClientesIds.length === 0) return 0; 

    const cuentas = await db.cuentasPorCobrar.where('codCliente').anyOf(misClientesIds).toArray();

    return cuentas.reduce((sum, cuenta) => sum + cuenta.deuda, 0);

  } catch (error) {
    console.error("Error al calcular la deuda total del vendedor:", error);
    return 0; 
  }
}

export async function getClientesByRuta(codRuta) {
    return await db.clientes.where('codRuta').equals(codRuta).toArray();
}

export async function getCxCByCliente(codCliente) {
  return await db.cuentasPorCobrar.where('codCliente').equals(codCliente).toArray(); 
}

//Funciones para gestionar pedidos
export async function saveOrUpdatePedido(pedido, codVendedor) {
  if (!pedido || !pedido.cliente || pedido.items.length === 0 || !codVendedor) {
    return;
  }
  
  const plainPedido = JSON.parse(JSON.stringify(pedido));
  
  // const existingPedido = await db.pedidosGuardados
  //   .where({ codCliente: plainPedido.cliente.codCliente, codVendedor: codVendedor })
  //   .first();
  
  const pedidoToSave = {
    codCliente: plainPedido.cliente.codCliente,
    clienteNombre: plainPedido.cliente.nombreComercial,
    items: plainPedido.items,
    fecha: plainPedido.fecha || new Date().toISOString(),
    total: plainPedido.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0),
    codVendedor: codVendedor, // 3. Añadimos el código del vendedor al objeto guardado
    status: 'Pendiente'
  };

  if(plainPedido.id) {
    if(plainPedido.items.length > 0) {
      await db.pedidosGuardados.update(plainPedido.id, pedidoToSave); 
      console.log(`Pedido #${plainPedido.id} actualizado`); 
      return plainPedido.id; 
    } else {
      await db.pedidosGuardados.delete(plainPedido.id); 
      console.log(`Pedido #${plainPedido.id} eliminado por estar vacío`); 
      return null; 
    }
  }
  else if(plainPedido.items.length > 0) {
    const newId = await db.pedidosGuardados.add(pedidoToSave); 
    console.log(`Nuevo pedido #${newId} creado.`)

    return newId; 
  }
  
  return null;
}

export async function countPedidosDeHoy(codVendedor) {
  if (!codVendedor) return 0;
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const count = await db.pedidosGuardados
      .where('[codVendedor+fecha]')
      .between(
        [codVendedor, hoy.toISOString()],
        [codVendedor, manana.toISOString()]
      )
      .count();
      
    return count;
  } catch (error) {
    console.error("Error al contar los pedidos de hoy:", error);
    return 0;
  }
}

export async function  markPedidoAsSubido(pedidoId) {
  await db.pedidosGuardados.update(pedidoId, {status: 'Subido' });
  console.log(`Pedido ${pedidoId} marcado como subido.`)

}

export async function getPedidosForVendedor(codVendedor) {
    if (!codVendedor) return [];
    return await db.pedidosGuardados.where('codVendedor').equals(codVendedor).toArray();
}

export async function getPedidoByCliente(codCliente) {
  return await db.pedidosGuardados.where('codCliente').equals(codCliente).first();
}

export async function getAllPedidos() {
  return await db.pedidosGuardados.toArray(); 
}

export async function updateClientCoordinates(codCliente, newCoordinates) {
  try {

    const client = await db.clientes.where('codCliente').equals(codCliente).first();
    if (client) {
      
      await db.clientes.update([client.codRuta, client.codCliente], { coordenadas: newCoordinates });
      console.log(`Coordenadas del cliente ${codCliente} actualizadas.`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al actualizar coordenadas en la BDD:", error);
    return false;
  }
}

//Funcion para limpiar pedidos antiguos
export async function limpiarPedidos() {
  try{

    const twoWeeksAgo = new Date();

    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    console.log(`Buscando pedidos guardados antes de: ${twoWeeksAgo.toISOString()}`);

    const pedidosViejos = await db.pedidosGuardados
      .where('fecha')
      .below(twoWeeksAgo.toISOString())
      .toArray();

    if (pedidosViejos > 0) {
      const idsToDelete = pedidosViejos.map(p => p.id);
      await db.pedidosGuardados.bulkDelete(idsToDelete); 
      console.log(`Limpieza automática: Se eliminaron ${idsToDelete.length} pedidos antiguos.`);
    } else {
      console.log("Limpieza automática: No se encontraron pedidos antiguos para eliminar.");
    }
  }catch (error){
    console.error("Error durante la limpieza de pedidos antiguos:", error);
  }
}

export async function deletePedido(pedidoId) {
  if(!pedidoId) return; 
  try{
    await db.pedidosGuardados.delete(pedidoId);
    console.log(`Pedido #${pedidoId} eliminado de la base de datos local.`)
  }catch(error){
    console.error(`Error al eliminar el pedido #${pedidoId}: `, error); 
  }
}

export async function markClientAsVisited(codCliente) {
  try {
    const clienteToUpdate = await db.clientes.where('codCliente').equals(codCliente).first();

    if (clienteToUpdate) {
      const now = new Date().toISOString();
      
      const primaryKey = [clienteToUpdate.codRuta, clienteToUpdate.codCliente];

      await db.clientes.update(primaryKey, { lastVisited: now });
      
      console.log(`Cliente ${codCliente} guardado como visitado en la base de datos.`);
      return now; 
    }
    
    console.warn(`Cliente ${codCliente} no encontrado en la base de datos local.`);
    return null;

  } catch (error) {
    console.error("Error al marcar el cliente como visitado:", error);
    return null;
  }
}