<!-- pages/colaborador/admin/[codigo].vue -->
<template>
    <div class="collaborator-page">
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
      
      <!-- Panel de colaborador -->
      <div v-else-if="colaborador.id" class="panel-container">
        <!-- Cabecera -->
        <div class="panel-header">
          <div class="activity-info">
            <h1>{{ actividad.nombre }}</h1>
            <div class="info-pill">
              <span class="pill-label">Fecha:</span>
              <span class="pill-value">{{ formatDate(actividad.fecha_inicio) }}</span>
            </div>
            <div class="info-pill">
              <span class="pill-label">Ubicación:</span>
              <span class="pill-value">{{ actividad.ubicacion || 'No especificada' }}</span>
            </div>
          </div>
          <div class="collaborator-info">
            <div class="avatar">{{ getInitials(colaborador.nombre) }}</div>
            <div class="info-text">
              <h2>{{ colaborador.nombre }}</h2>
              <div class="role-badge">{{ formatRole(colaborador.rol) }}</div>
            </div>
          </div>
        </div>
        
        <!-- Contenido principal -->
        <div class="panel-content">
          <div class="welcome-message">
            <h2>¡Bienvenido a tu panel de colaborador!</h2>
            <p>Desde aquí podrás gestionar tus ventas, ver reportes y más.</p>
          </div>
          
          <!-- Sección de QR para compartir -->
          <div class="share-section">
            <h3>Comparte tu enlace de venta</h3>
            <p>Comparte este QR o enlace con clientes potenciales para que puedan realizar pedidos a través de ti.</p>
            
            <div class="qr-container">
              <img :src="colaborador.codigo_venta_qr" alt="Código QR de venta" class="qr-image" />
              <div class="qr-actions">
                <button @click="downloadSalesQR" class="action-button secondary">
                  <span class="button-icon">⬇️</span> Descargar QR
                </button>
                <button v-if="canShare" @click="shareSalesQR" class="action-button secondary">
                  <span class="button-icon">↗️</span> Compartir
                </button>
                <button @click="copySalesLink" class="action-button secondary">
                  <span class="button-icon">📋</span> Copiar Enlace
                </button>
              </div>
            </div>
          </div>
          
          <!-- Aquí irían otras secciones como el listado de ventas, reportes, etc. -->
          <div class="coming-soon">
            <h3>Más funcionalidades próximamente</h3>
            <p>Estamos trabajando para añadir funcionalidades como:</p>
            <ul>
              <li>Listado de ventas realizadas</li>
              <li>Notificaciones de nuevos pedidos</li>
              <li>Reportes y estadísticas</li>
              <li>Gestión de entregas y cobros</li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Notificación -->
      <div v-if="notification.show" class="notification" :class="notification.type">
        {{ notification.message }}
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { Colaborador, ColaboradorRol, ColaboradorFormData } from '~/types/colaborador'
  import type { Actividad } from '~/types/actividad'
  
  // Obtener código de acceso de la URL
  const route = useRoute()
  const codigoAcceso = route.params.codigo as string
  
  // Estado
  const colaborador = ref<Partial<Colaborador>>({})
  const actividad = ref<Partial<Actividad>>({})
  const loading = ref<boolean>(true)
  const error = ref<string>('')
  const notification = ref<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  })
  
  // Cliente de Supabase
  const supabase = useSupabaseClient()
  
  // Verificar si soporta Web Share API
  const canShare = computed<boolean>(() => {
    return typeof navigator !== 'undefined' && !!navigator.share
  })
  
  // Obtener URL de ventas para el colaborador
  const salesUrl = computed<string>(() => {
    if (typeof window === 'undefined' || !colaborador.value.codigo_venta) return ''
    return `${window.location.origin}/venta/${colaborador.value.codigo_venta}`
  })
  
  // Obtener iniciales para el avatar
  const getInitials = (name: string): string => {
    if (!name) return '?'
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }
  
  // Formatear rol
  const formatRole = (role?: ColaboradorRol): string => {
    if (!role) return 'Desconocido'
    
    const roles: Record<ColaboradorRol, string> = {
      'vendedor': 'Vendedor',
      'gestor_entregas': 'Gestor de Entregas',
      'gestor_cobros': 'Gestor de Cobros',
      'admin': 'Administrador'
    }
    
    return roles[role] || role
  }
  
  // Formatear fecha
  const formatDate = (dateString?: string): string => {
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
  
  // Cargar información del colaborador
  const loadCollaboratorInfo = async () => {
    loading.value = true
    error.value = ''
    
    try {
      // Buscar el colaborador por su código de acceso
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('codigo_acceso', codigoAcceso)
        .single()
      
      if (colaboradorError) throw new Error('No se encontró el colaborador. Verifique el código de acceso.')
      
      // Si el colaborador está inactivo, mostrar error
      if (!colaboradorData.activo) {
        throw new Error('Este colaborador ha sido desactivado. Contacte al administrador de la actividad.')
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
        throw new Error(`Esta actividad está ${actividadData.estado}. No es posible acceder.`)
      }
      
      actividad.value = actividadData
      
    } catch (err: any) {
      console.error('Error al cargar la información:', err)
      error.value = err.message || 'Ocurrió un error al cargar la información.'
    } finally {
      loading.value = false
    }
  }
  
  // Descargar QR de ventas
  const downloadSalesQR = () => {
    if (!colaborador.value.codigo_venta_qr) return
    
    const link = document.createElement('a')
    link.download = `ventas-${colaborador.value.codigo_venta}.png`
    link.href = colaborador.value.codigo_venta_qr
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showNotification('Código QR descargado correctamente')
  }
  
  // Compartir QR de ventas (Web Share API)
  const shareSalesQR = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Realiza tu pedido con ${colaborador.value.nombre}`,
          text: `Realiza tu pedido para ${actividad.value.nombre} a través de este enlace:`,
          url: salesUrl.value
        })
        showNotification('Compartido correctamente')
      }
    } catch (err) {
      console.error('Error al compartir:', err)
    }
  }
  
  // Copiar enlace de ventas
  const copySalesLink = () => {
    navigator.clipboard.writeText(salesUrl.value)
      .then(() => {
        showNotification('Enlace copiado al portapapeles')
      })
      .catch(err => {
        console.error('Error al copiar:', err)
        showNotification('No se pudo copiar el enlace', 'error')
      })
  }
  
  // Mostrar notificación
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    notification.value = {
      show: true,
      message,
      type
    }
    
    setTimeout(() => {
      notification.value.show = false
    }, 3000)
  }
  
  // Cargar datos al montar el componente
  onMounted(() => {
    loadCollaboratorInfo()
  })
  </script>
  
  <style scoped>
  .collaborator-page {
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
  
  .panel-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .panel-header {
    background-color: var(--primary-color);
    color: white;
    padding: var(--spacing-large);
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-large);
  }
  
  .activity-info h1 {
    margin: 0 0 var(--spacing-small);
    font-size: 1.8rem;
  }
  
  .info-pill {
    display: inline-flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 30px;
    margin-right: var(--spacing-small);
    margin-bottom: var(--spacing-small);
    font-size: 0.9rem;
  }
  
  .pill-label {
    font-weight: 600;
    margin-right: 0.3rem;
  }
  
  .collaborator-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-medium);
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: white;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .info-text h2 {
    margin: 0 0 0.3rem;
    font-size: 1.3rem;
  }
  
  .role-badge {
    display: inline-block;
    background-color: rgba(255, 255, 255, 0.3);
    padding: 0.25rem 0.75rem;
    border-radius: 30px;
    font-size: 0.85rem;
  }
  
  .panel-content {
    flex: 1;
    padding: var(--spacing-large);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .welcome-message {
    background-color: white;
    border-radius: var(--border-radius);
    padding: var(--spacing-large);
    margin-bottom: var(--spacing-large);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .welcome-message h2 {
    margin-top: 0;
    color: var(--primary-color);
  }
  
  .share-section {
    background-color: white;
    border-radius: var(--border-radius);
    padding: var(--spacing-large);
    margin-bottom: var(--spacing-large);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .share-section h3 {
    margin-top: 0;
    color: var(--text-color-dark);
  }
  
  .qr-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: var(--spacing-medium);
  }
  
  .qr-image {
    max-width: 250px;
    border: 1px solid var(--border-color);
    padding: var(--spacing-small);
    background-color: white;
    margin-bottom: var(--spacing-medium);
  }
  
  .qr-actions {
    display: flex;
    gap: var(--spacing-small);
  }
  
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    text-decoration: none;
  }
  
  .action-button:hover {
    background-color: var(--button-bg-hover);
  }
  
  .action-button.secondary {
    background-color: #e9ecef;
    color: var(--text-color-dark);
    border: 1px solid var(--border-color);
  }
  
  .action-button.secondary:hover {
    background-color: #dee2e6;
  }
  
  .button-icon {
    font-size: 1.1rem;
  }
  
  .coming-soon {
    background-color: white;
    border-radius: var(--border-radius);
    padding: var(--spacing-large);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border-left: 4px solid var(--primary-color);
  }
  
  .coming-soon h3 {
    margin-top: 0;
    color: var(--text-color-dark);
  }
  
  .coming-soon ul {
    padding-left: 1.5rem;
  }
  
  .coming-soon li {
    margin-bottom: 0.5rem;
  }
  
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 0.8rem 1.2rem;
    border-radius: var(--border-radius-small);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    z-index: 1000;
  }
  
  .notification.success {
    background-color: #d4edda;
    color: #155724;
  }
  
  .notification.error {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @media (max-width: 768px) {
    .panel-header {
      flex-direction: column;
      gap: var(--spacing-medium);
    }
    
    .qr-actions {
      flex-direction: column;
    }
  }
  </style>