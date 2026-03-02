<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser, setAlert } from '@/store.js';

const usuario = ref('');
const password = ref('');
const router = useRouter();
const isPasswordVisible = ref(false);
const isLoading = ref(false);

const passwordFieldType = computed(() => {
  return isPasswordVisible.value ? 'text' : 'password';
});

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
}

async function handleLogin() {
  
  const usuarioLogin = usuario.value.trim(); 
  const passwordLogin = password.value.trim(); 
  
  if (!usuarioLogin || !passwordLogin) {
    setAlert('error', 'Por favor, completa ambos campos.');
    return;
  }
  isLoading.value = true;
  const loginSuccess = await loginUser(usuarioLogin, passwordLogin);
  isLoading.value = false;

  if (loginSuccess) {
    router.push('/dashboard');
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <img src="/logo_carniceria.png" alt="Logo carniceria" class="logo">
      <h2 class="title">Bienvenido!</h2>
      <p class="subtitle">Ingrese sus datos para continuar</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="usuario">USUARIO</label>
          <input
            type="text"
            id="usuario"
            v-model="usuario"
            placeholder="tu usuario"
          >
        </div>
        <div class="input-group">
          <label for="password">CONTRASEÑA</label>
          <div class="password-wrapper">
            <input
              :type="passwordFieldType"
              id="password"
              v-model="password"
              placeholder="••••••••••"
            >
            <button type="button" @click="togglePasswordVisibility" class="toggle-password-btn">
              <svg v-if="isPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>
        <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? 'CONECTANDO...' : 'CONECTAR' }}
        </button>
      </form>
    </div>
    <footer class="footer">
      © Copyright 2025 | Todos los derechos reservados Redes IP, C.A.
    </footer>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
  padding: 20px;
  box-sizing: border-box;
}
.login-box {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding-top: 20px;
  margin: 0 auto;
}
.logo {
  width: 192px;
  margin-bottom: 20px;
}
.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a202c;
}
.subtitle {
  color: #718096;
  margin-bottom: 40px;
}
.login-form {
  width: 100%;
  text-align: left;
}
.input-group {
  margin-bottom: 20px;
}
.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}
.input-group input {
  width: 100%;
  padding: 14px 50px 14px 16px; /* Aumentamos el padding derecho para el icono */
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  font-size: 16px;
  box-sizing: border-box;
}
.input-group input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
/* CAMBIO: Estilos para el nuevo botón del icono */
.toggle-password-btn {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  background: none;
  border: none;
  padding: 0 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096; /* Color gris para el icono */
}
.toggle-password-btn:hover {
    color: #1a202c; /* Color más oscuro al pasar el mouse */
}
.login-button {
  width: 100%;
  background-color: #28a745;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;
}
.login-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
.login-button:hover {
  background-color: #218838;
}
.footer {
  width: 100%;
  text-align: center;
  padding-top: 20px;
  font-size: 12px;
  color: #a0aec0;
}
@media (min-height: 800px) and (min-width: 768px) {
    .login-container {
        justify-content: center; /* Centrar verticalmente en pantallas grandes */
        gap: 40px;
    }
}
</style>