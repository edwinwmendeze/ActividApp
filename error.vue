<!-- error.vue -->
<template>
    <div class="error-page">
      <h1>¡Ups! Algo salió mal</h1>
      <p>Lo sentimos, ha ocurrido un error en la aplicación.</p>
      
      <!-- Mostrar detalles del error si existen -->
      <div v-if="error" class="error-details">
        <h3>Detalles del error:</h3>
        <pre>{{ error.message }}</pre>
        <h4>Stack Trace:</h4>
        <pre>{{ error.stack }}</pre>
      </div>
  
      <!-- Botón para regresar al inicio -->
      <button @click="handleError" class="btn">Volver al inicio</button>
    </div>
  </template>
  
  <script setup>
    // Capturamos el error globalmente
    const error = useError()
  
    // Función para volver a la página principal
    const handleError = () => {
      navigateTo('/')
    }
  </script>
  
  <style scoped>
  .error-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  h1 {
    color: #f44336; /* Rojo para indicar error */
  }
  
  .error-details {
    background-color: #ffebee;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 2rem;
    text-align: left;
    font-family: monospace;
  }
  
  .error-details h3 {
    font-size: 1.2rem;
    color: #d32f2f;
  }
  
  .error-details pre {
    background-color: #fff3f3;
    padding: 1rem;
    border: 1px solid #f44336;
    border-radius: 4px;
    word-wrap: break-word;
  }
  
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    margin-top: 1rem;
  }
  
  .btn:hover {
    background-color: #45a049;
  }
  </style>