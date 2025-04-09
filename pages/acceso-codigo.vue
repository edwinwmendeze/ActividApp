<!-- pages/acceso-codigo.vue -->
<template>
    <div class="container">
      <h1 class="page-title">Acceder a una Actividad</h1>
      
      <div v-if="loading" class="loading-container">
        <div class="loader"></div>
        <p>Verificando código...</p>
      </div>
      
      <div v-else class="access-form-container">
        <form @submit.prevent="verificarCodigo" class="access-form">
          <div class="form-header">
            <div class="form-icon">🔑</div>
            <h2>Ingresa el código de acceso</h2>
            <p>Introduce el código de 6 caracteres que recibiste al crear tu actividad</p>
          </div>
          
          <div class="form-group">
            <label for="codigo">Código de Acceso</label>
            <input 
              id="codigo"
              v-model="codigo"
              type="text"
              placeholder="Ej: ABC123"
              maxlength="6"
              required
              class="code-input"
              :class="{ 'has-error': error }"
              ref="codeInput"
            />
            <div v-if="error" class="error-message">{{ error }}</div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="action-button primary">Acceder</button>
            <NuxtLink to="/" class="action-button secondary">Cancelar</NuxtLink>
          </div>
        </form>
        
        <div class="alternative-access">
          <p>¿Tienes un código QR?</p>
          <button @click="mostrarEscanerQR" class="qr-button">
            Escanear QR
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const router = useRouter();
  const supabase = useSupabaseClient();
  
  const codigo = ref('');
  const loading = ref(false);
  const error = ref('');
  const codeInput = ref(null);
  
  // Enfocar automáticamente el campo de código al cargar
  onMounted(() => {
    if (codeInput.value) {
      codeInput.value.focus();
    }
  });
  
  // Función para verificar el código
  async function verificarCodigo() {
    if (!codigo.value) return;
    
    loading.value = true;
    error.value = '';
    
    // Normalizar código (mayúsculas, sin espacios)
    const codigoNormalizado = codigo.value.trim().toUpperCase();
    
    try {
      // Buscar actividad por código
      const { data, error: supabaseError } = await supabase
        .from('actividades')
        .select('id, codigo_acceso, estado')
        .eq('codigo_acceso', codigoNormalizado)
        .single();
      
      if (supabaseError) {
        throw new Error('Error al verificar el código');
      }
      
      if (!data) {
        throw new Error('Código no encontrado. Verifica e intenta nuevamente.');
      }
      
      if (data.estado !== 'activa') {
        throw new Error(`Esta actividad está ${data.estado}. No es posible acceder.`);
      }
      
      // Redirigir al panel de administración
      router.push(`/admin/${codigoNormalizado}`);
      
    } catch (err) {
      error.value = err.message || 'Ocurrió un error al verificar el código';
    } finally {
      loading.value = false;
    }
  }
  
  // Para futura implementación del escáner QR
  function mostrarEscanerQR() {
    alert('La función de escaneo QR estará disponible próximamente');
  }
  </script>
  
  <style scoped>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-large);
  }
  
  .page-title {
    text-align: center;
    color: var(--primary-color);
    margin-bottom: var(--spacing-large);
    font-size: 2.2rem;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xlarge);
    text-align: center;
  }
  
  .loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-medium);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .access-form-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-large);
  }
  
  .access-form {
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-large);
    width: 100%;
    max-width: 500px;
  }
  
  .form-header {
    text-align: center;
    margin-bottom: var(--spacing-large);
  }
  
  .form-icon {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: var(--spacing-small);
  }
  
  .form-header h2 {
    color: var(--text-color-dark);
    margin-bottom: var(--spacing-small);
  }
  
  .form-header p {
    color: var(--text-color);
  }
  
  .form-group {
    margin-bottom: var(--spacing-large);
  }
  
  label {
    display: block;
    margin-bottom: var(--spacing-small);
    font-weight: 500;
    color: var(--text-color-dark);
  }
  
  .code-input {
    width: 100%;
    padding: var(--spacing-medium);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 1.5rem;
    text-align: center;
    letter-spacing: 4px;
    text-transform: uppercase;
    background-color: #f9f9f9;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .code-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    outline: none;
  }
  
  .code-input.has-error {
    border-color: #dc3545;
  }
  
  .error-message {
    color: #dc3545;
    font-size: 0.9rem;
    margin-top: var(--spacing-small);
    text-align: center;
  }
  
  .form-actions {
    display: flex;
    gap: var(--spacing-medium);
    margin-top: var(--spacing-large);
  }
  
  .action-button {
    flex: 1;
    display: inline-block;
    padding: var(--spacing-small) var(--spacing-medium);
    border-radius: var(--border-radius-small);
    font-size: var(--font-size-base);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }
  
  .action-button.primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
  }
  
  .action-button.primary:hover {
    background-color: var(--button-bg-hover);
  }
  
  .action-button.secondary {
    background-color: #f2f2f2;
    color: var(--text-color-dark);
    border: 1px solid var(--border-color);
  }
  
  .action-button.secondary:hover {
    background-color: #e2e2e2;
  }
  
  .alternative-access {
    text-align: center;
    margin-top: var(--spacing-medium);
  }
  
  .qr-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-small);
    padding: var(--spacing-small) var(--spacing-medium);
    background-color: transparent;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: var(--spacing-small);
  }
  
  .qr-button:hover {
    background-color: #f0f0f0;
  }
  
  @media (max-width: 640px) {
    .form-actions {
      flex-direction: column;
    }
    
    .action-button {
      width: 100%;
    }
  }
  </style>