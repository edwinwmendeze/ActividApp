<!-- pages/venta/[codigo].vue -->
<template>
    <div class="venta-page">
      <!-- Loader mientras se carga la información -->
      <div v-if="loading" class="loading-container">
        <div class="loader"></div>
        <p>Cargando información...</p>
      </div>
      
      <!-- Error -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">❌</div>
        <h2>Error al cargar</h2>
        <p>{{ error }}</p>
        <NuxtLink to="/" class="action-button">Volver al Inicio</NuxtLink>
      </div>
      
      <!-- Formulario de pedido -->
      <div v-else class="pedido-container">
        <div class="header">
          <h1>{{ actividad.nombre }}</h1>
          <p class="actividad-info">
            <span class="info-pill"><strong>Fecha:</strong> {{ formatDate(actividad.fecha_inicio) }}</span>
            <span class="info-pill"><strong>Ubicación:</strong> {{ actividad.ubicacion || 'No especificada' }}</span>
          </p>
          <p class="colaborador-info">Atendido por: <strong>{{ colaborador.nombre }}</strong></p>
        </div>
        
        <div class="form-container">
          <h2>Realizar Pedido</h2>
          <p>Complete el formulario para realizar su pedido.</p>
          
          <!-- (Aquí iría el formulario de pedido, por desarrollar en la siguiente fase) -->
          <div class="coming-soon-message">
            <div class="soon-icon">🚧</div>
            <h3>En desarrollo</h3>
            <p>Esta funcionalidad estará disponible próximamente.</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import type { Colaborador, Actividad } from '~/types'
  
  // Obtener código de venta de la URL
  const route = useRoute()
  const codigoVenta = route.params.codigo as string
  
  // Estado
  const colaborador = ref<Partial<Colaborador>>({})
  const actividad = ref<Partial<Actividad>>({})
  const loading = ref<boolean>(true)
  const error = ref<string>('')
  
  // Cliente de Supabase
  const supabase = useSupabaseClient()
  
  // Formatear fecha
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'No especificada'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Cargar información de venta
  const loadVentaInfo = async (): Promise<void> => {
    loading.value = true
    error.value = ''
    
    try {
      // Buscar el colaborador por su código de venta
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('codigo_venta', codigoVenta)
        .single()
      
      if (colaboradorError) throw new Error('Código de venta no válido o expirado.')
      
      // Si el colaborador está inactivo, mostrar error
      if (!colaboradorData.activo) {
        throw new Error('Este colaborador no está activo actualmente. Por favor, contacte con otro colaborador.')
      }
      
      colaborador.value = colaboradorData
      
      // Buscar la actividad asociada
      const { data: actividadData, error: actividadError } = await supabase
        .from('actividades')
        .select('*')
        .eq('id', colaboradorData.actividad_id)
        .single()
      
      if (actividadError) throw new Error('No se pudo obtener la información de la actividad.')
      
      // Si la actividad no está activa, mostrar error
      if (actividadData.estado !== 'activa') {
        throw new Error(`Esta actividad está ${actividadData.estado}. No es posible realizar pedidos.`)
      }
      
      actividad.value = actividadData
      
    } catch (err: any) {
      console.error('Error al cargar la información:', err)
      error.value = err.message || 'Ocurrió un error al cargar la información.'
    } finally {
      loading.value = false
    }
  }
  
  // Cargar datos al montar el componente
  onMounted(() => {
    loadVentaInfo()
  })
  </script>
  
  <style scoped>
  .venta-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: var(--spacing-large);
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
  
  .error-icon {
    font-size: 4rem;
    color: #dc3545;
    margin-bottom: var(--spacing-medium);
  }
  
  .error-container h2 {
    color: #dc3545;
    margin-bottom: var(--spacing-medium);
  }
  
  .pedido-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-large);
  }
  
  .header {
    margin-bottom: var(--spacing-large);
    text-align: center;
  }
  
  .header h1 {
    color: var(--primary-color);
    margin-bottom: var(--spacing-small);
  }
  
  .actividad-info {
    margin-bottom: var(--spacing-small);
  }
  
  .info-pill {
    display: inline-block;
    background-color: #e9ecef;
    padding: 6px 12px;
    border-radius: 16px;
    margin: 0 4px 8px;
    font-size: 0.9rem;
  }
  
  .colaborador-info {
    color: var(--text-color);
    font-size: 1.1rem;
  }
  
  .form-container {
    background-color: white;
    border-radius: var(--border-radius);
    padding: var(--spacing-large);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .form-container h2 {
    color: var(--text-color-dark);
    margin-top: 0;
    margin-bottom: var(--spacing-small);
  }
  
  .coming-soon-message {
    text-align: center;
    padding: var(--spacing-xlarge) var(--spacing-medium);
    border: 2px dashed #dee2e6;
    border-radius: var(--border-radius);
    margin-top: var(--spacing-large);
  }
  
  .soon-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-medium);
  }
  
  .action-button {
    display: inline-block;
    padding: var(--spacing-small) var(--spacing-medium);
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    text-decoration: none;
    margin-top: var(--spacing-medium);
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .action-button:hover {
    background-color: var(--button-bg-hover);
  }
  </style>