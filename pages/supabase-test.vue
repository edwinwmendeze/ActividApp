<!-- pages/supabase-test.vue -->
<template>
    <div class="container">
      <h1>Prueba de conexión con Supabase</h1>
      
      <div v-if="loading" class="status loading">
        Conectando con Supabase...
      </div>
      
      <div v-else-if="error" class="status error">
        <p>Error al conectar con Supabase:</p>
        <pre>{{ error }}</pre>
      </div>
      
      <div v-else class="status success">
        <p>¡Conexión exitosa con Supabase!</p>
        <p>URL: {{ maskedUrl }}</p>
      </div>
  
      <div class="navigation">
        <NuxtLink to="/" class="btn">Volver al inicio</NuxtLink>
      </div>
    </div>
  </template>
  
  <script setup>
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  // Enmascara la URL para no mostrar detalles completos
  const maskedUrl = supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+)(.+)$/, '$1...') : 'No disponible'
  
  const loading = ref(true)
  const error = ref(null)
  
  // Prueba simple: intentar obtener la información de la instancia
  onMounted(async () => {
    try {
      // Una operación más básica: simplemente verificar que podemos acceder al sistema
      // Esto no ejecuta ninguna consulta SQL, solo verifica la conexión
      const { data, error: apiError } = await supabase.auth.getSession()
      
      if (apiError) {
        throw apiError
      }
      
      // Si llegamos aquí, es porque la conexión funciona
      loading.value = false
    } catch (err) {
      loading.value = false
      error.value = err.message || 'Error desconocido'
      console.error('Error al conectar con Supabase:', err)
    }
  })
  </script>
  
  <style scoped>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .status {
    margin-top: 2rem;
    padding: 1rem;
    border-radius: 4px;
  }
  
  .loading {
    background-color: #f0f0f0;
  }
  
  .success {
    background-color: #d4edda;
    color: #155724;
  }
  
  .error {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  pre {
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .navigation {
    margin-top: 2rem;
  }
  
  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
  </style>