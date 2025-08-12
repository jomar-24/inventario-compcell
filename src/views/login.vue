<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'vue-router'

// --- LÓGICA DE VUE Y SUPABASE ---
const supabaseUrl = 'https://loakfoqfdgegvzjgkjnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYWtmb3FmZGdlZ3Z6amdram52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NDgsImV4cCI6MjA2OTM4NDg0OH0.a1-90tbgDWTHhNy7ScSysaycji6wBAKXs2378u5Twik';
const supabase = createClient(supabaseUrl, supabaseKey);
const router = useRouter();

// Refs para el formulario
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const showPassword = ref(false);

// Refs para el efecto 3D
const loginCard = ref(null);
const container = ref(null);

// Función de login con Supabase
async function handleLogin() {
  try {
    loading.value = true; 
    errorMessage.value = '';
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: username.value, 
      password: password.value 
    });
    
    if (error) throw error;
    router.push('/');
    
  } catch (error) { 
    errorMessage.value = 'Email o contraseña incorrectos.'; 
  } finally { 
    loading.value = false; 
  }
}

// Efectos 3D del mouse (igual que en tu HTML original)
function onMouseMove(e) {
  if (!loginCard.value) return;
  
  const { clientX, clientY } = e;
  const { left, top, width, height } = loginCard.value.getBoundingClientRect();
  
  const x = (clientX - left - width / 2) / 25;
  const y = -(clientY - top - height / 2) / 25;
  
  loginCard.value.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
}

function onMouseLeave() {
  if (!loginCard.value) return;
  loginCard.value.style.transform = 'rotateY(0deg) rotateX(0deg)';
}

// Toggle de visibilidad de password
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

// Event listeners para el efecto 3D
onMounted(() => {
  if (container.value) {
    container.value.addEventListener('mousemove', onMouseMove);
    container.value.addEventListener('mouseleave', onMouseLeave);
  }
});

onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('mousemove', onMouseMove);
    container.value.removeEventListener('mouseleave', onMouseLeave);
  }
});
</script>

<template>
  <div class="login-container" ref="container">
    <div class="login-card" ref="loginCard">
      <div class="card-content">
        <div class="logo-header">
          <img src="/logo.png" alt="Compcell Logo" class="logo">
          <h1>INVENTARIO COMPCELL</h1>
        </div>
        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <input 
              type="email" 
              id="username" 
              v-model="username" 
              required
              :class="{ 'has-value': username }"
            >
            <label for="username">Usuario (Email)</label>
          </div>
          <div class="input-group">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              required
              :class="{ 'has-value': password }"
            >
            <label for="password">Contraseña</label>
            <span 
              class="toggle-password" 
              :class="{ visible: showPassword }"
              @click="togglePasswordVisibility"
              title="Mostrar/Ocultar contraseña"
            >
              <span class="eye-icon"></span>
            </span>
          </div>
          <button type="submit" :disabled="loading">
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
    --primary-color: #ff8c00; /* Orange from logo */
    --secondary-color: #ff5e00; /* Deeper orange for glow */
    --dark-bg: #1a1a1a;
    --card-bg: linear-gradient(135deg, rgba(40, 30, 20, 0.7), rgba(20, 20, 20, 0.8));
    --text-color: #f0f0f0;
    --border-glow: conic-gradient(
        from 180deg at 50% 50%,
        #ff8c00, #ff5e00, #ff8c00, #ffffff, #ff8c00
    );
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.login-container {
    font-family: 'Poppins', sans-serif;
    background-color: var(--dark-bg);
    color: var(--text-color);
    background-image: 
        radial-gradient(at 0% 0%, hsla(28, 100%, 50%, 0.3) 0px, transparent 50%),
        radial-gradient(at 98% 95%, hsla(35, 100%, 50%, 0.2) 0px, transparent 50%),
        radial-gradient(at 50% 50%, hsla(20, 100%, 50%, 0.1) 0px, transparent 50%);
    min-height: 100vh;
    display: grid;
    place-items: center;
    overflow: hidden;
    perspective: 1000px;
}

.login-card {
    position: relative;
    width: 480px;
    background: var(--card-bg);
    border-radius: 20px;
    padding: 2.5rem;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 140, 0, 0.2);
    transform-style: preserve-3d;
    transition: transform 0.1s ease-out;
}

.login-card::before {
    display: none;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.card-content {
    transform: translateZ(20px);
}

.logo-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    text-align: center;
}

.logo {
    width: 130px;
    height: auto;
    animation: logo-aura 4s ease-in-out infinite;
}

.logo-header h1 {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-color);
    text-shadow: 0 0 10px rgba(255, 140, 0, 0.5);
}

@keyframes logo-aura {
    0%, 100% {
        filter: drop-shadow(0 0 3px var(--primary-color)) 
                drop-shadow(0 0 8px var(--primary-color));
    }
    50% {
        filter: drop-shadow(0 0 6px var(--secondary-color)) 
                drop-shadow(0 0 15px var(--secondary-color));
    }
}

/* --- FIX FOR AUTOFILL BACKGROUND --- */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 40px #221c17 inset !important;
    box-shadow: 0 0 0 40px #221c17 inset !important;
    -webkit-text-fill-color: var(--text-color) !important;
    caret-color: var(--primary-color);
    transition: background-color 5000s ease-in-out 0s;
}

.input-group {
    position: relative;
    margin-bottom: 2rem;
}

.toggle-password {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    cursor: pointer;
    z-index: 2;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    transition: background 0.3s ease;
}

.toggle-password::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(from 180deg at 50% 50%, #ff8c00, #ff5e00, #ffffff, #ff5e00, #ff8c00);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.4s ease;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.toggle-password:hover::before {
    opacity: 1;
    animation: spin 3s linear infinite;
}

.eye-icon {
    position: relative;
    width: 20px;
    height: 20px;
}

/* The 'eye' shape */
.eye-icon::before {
    content: '';
    position: absolute;
    left: 0;
    top: 5px;
    width: 100%; /* 20px */
    height: 10px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    transition: all 0.3s ease-in-out;
}

/* The 'pupil' */
.eye-icon::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 6px;
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transform-origin: center;
    transition: all 0.3s ease-in-out;
}

/* The 'slash' through the eye */
.toggle-password .eye-icon::before {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
    width: 10px;
    transform: translateX(10px);
}

.toggle-password .eye-icon::after {
    left: 2px;
    transform: scale(0);
}

/* Styles when password is VISIBLE */
.toggle-password.visible .eye-icon::before {
    border-radius: 10px; /* Full eye shape */
    border-right: 2px solid var(--primary-color);
    width: 20px; /* Full width */
    transform: translateX(0);
    border-color: var(--primary-color);
    box-shadow: 0 0 5px var(--primary-color);
}

.toggle-password.visible .eye-icon::after {
    transform: scale(1); /* Pupil appears */
    left: 6px; /* Centered */
    background: var(--primary-color);
    box-shadow: 0 0 5px var(--primary-color);
}

.input-group input {
    width: 100%;
    padding: 10px 40px 10px 0;
    background: transparent;
    border: none;
    border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    color: var(--text-color);
    font-size: 1rem;
    outline: none;
}

.input-group label {
    position: absolute;
    top: 10px;
    left: 0;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;
    pointer-events: none;
}

.input-group input:focus ~ label,
.input-group input.has-value ~ label {
    top: -15px;
    left: 0;
    font-size: 0.8rem;
    color: var(--primary-color);
}

.input-group input:focus {
    border-bottom-color: var(--primary-color);
}

button {
    width: 100%;
    padding: 0.8rem;
    background: var(--primary-color);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

button:hover:not(:disabled) {
    background: #ffae42; /* Lighter orange */
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.6);
    transform: translateY(-2px);
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 8px;
    color: #fca5a5;
    text-align: center;
    font-size: 0.9rem;
}
</style>