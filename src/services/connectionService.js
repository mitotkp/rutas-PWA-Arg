import { store, setServerStatus } from '@/store.js';
import { BACK_URL } from '../../backurl';

let heartbeatInterval = null;
const HEARTBEAT_FREQUENCY = 15000; // 15 segundos

async function testConnection() {

    if (!store.serverIp) {
        setServerStatus(false);
        return;
    }

    try {
        const response = await fetch(BACK_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const textResponse = await response.text();
        try {
            const result = JSON.parse(textResponse);

            if (result && result.success) {
                setServerStatus(true);
            } else {
                setServerStatus(false);
            }
        } catch (jsonError) {
            if (textResponse.includes("Bienvenido")) {
                console.log("Conexión exitosa detectada por texto plano.");
                setServerStatus(true); 
            } else {
                console.error("El servidor respondió, pero no es JSON ni el mensaje de bienvenida esperado:", jsonError);
                setServerStatus(false);
            }
        }
    } catch (error) {
        console.log("Error de red:", error);
        setServerStatus(false);
    }
}

// Función para iniciar el chequeo periódico
export function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    testConnection();
    heartbeatInterval = setInterval(testConnection, HEARTBEAT_FREQUENCY);
}

// Función para detener el chequeo
export function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}