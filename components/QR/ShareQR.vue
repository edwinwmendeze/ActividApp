<!-- components/QR/ShareQR.vue -->
<template>
    <div class="qr-share-container">
      <div class="qr-share-header">
        <h3>Compartir Acceso</h3>
        <button @click="$emit('close')" class="close-button">&times;</button>
      </div>
      
      <div class="qr-share-content">
        <div class="collaborator-info">
          <h4>{{ collaborator.nombre }}</h4>
          <div class="role-badge">{{ formatRole(collaborator.rol) }}</div>
        </div>
        
        <!-- Pestañas para cambiar entre QR de acceso y QR de ventas -->
        <div class="qr-tabs">
          <button 
            :class="['tab-button', { active: activeTab === 'ventas' }]" 
            @click="activeTab = 'ventas'"
          >
            QR para Ventas
          </button>
          <button 
            :class="['tab-button', { active: activeTab === 'acceso' }]" 
            @click="activeTab = 'acceso'"
          >
            QR de Acceso Personal
          </button>
        </div>
        
        <div class="tab-content">
          <!-- QR para ventas (mostrado por defecto) -->
          <div v-if="activeTab === 'ventas'" class="access-info">
            <div class="qr-section">
              <h4>Código QR para Ventas</h4>
              <p class="tab-description">Comparte este QR con tus clientes para que realicen pedidos.</p>
              <div class="qr-image-container">
                <img :src="collaborator.codigo_venta_qr" alt="Código QR de Ventas" class="qr-image" />
              </div>
              <div class="qr-actions">
                <button @click="() => downloadQR('venta')" class="action-button">
                  <span class="button-icon">⬇️</span> Descargar
                </button>
                <button v-if="canShare" @click="() => shareQR('venta')" class="action-button">
                  <span class="button-icon">↗️</span> Compartir
                </button>
              </div>
            </div>
            
            <div class="code-section">
              <h4>Código de Ventas</h4>
              <div class="access-code">{{ collaborator.codigo_venta }}</div>
              <button @click="() => copyCode('venta')" class="action-button">
                <span class="button-icon">📋</span> Copiar Código
              </button>
            </div>
          </div>
          
          <!-- QR para acceso personal (panel de colaborador) -->
          <div v-else class="access-info">
            <div class="qr-section">
              <h4>Código QR de Acceso</h4>
              <p class="tab-description">Este QR es para tu acceso personal al panel de colaborador.</p>
              <div class="qr-image-container">
                <img :src="collaborator.codigo_qr" alt="Código QR de Acceso" class="qr-image" />
              </div>
              <div class="qr-actions">
                <button @click="() => downloadQR('acceso')" class="action-button">
                  <span class="button-icon">⬇️</span> Descargar
                </button>
                <button v-if="canShare" @click="() => shareQR('acceso')" class="action-button">
                  <span class="button-icon">↗️</span> Compartir
                </button>
              </div>
            </div>
            
            <div class="code-section">
              <h4>Código de Acceso</h4>
              <div class="access-code">{{ collaborator.codigo_acceso }}</div>
              <button @click="() => copyCode('acceso')" class="action-button">
                <span class="button-icon">📋</span> Copiar Código
              </button>
            </div>
          </div>
        </div>
        
        <div class="instructions">
          <p v-if="activeTab === 'ventas'">
            Comparte este QR o código con tus <strong>clientes</strong> para que puedan realizar pedidos a través de ti.
          </p>
          <p v-else>
            Comparte este QR o código con <strong>{{ collaborator.nombre }}</strong> para acceder a su panel de colaborador.
          </p>
          
          <p>El enlace de acceso es: 
            <span class="access-link">{{ activeTab === 'ventas' ? ventasLink : accesoLink }}</span>
          </p>
          <button @click="copyCurrentLink" class="text-button">Copiar Enlace</button>
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
  import type { Colaborador } from '~/types'
  
  interface Props {
    collaborator: Colaborador;
  }
  
  const props = defineProps<Props>()
  
  const emit = defineEmits<{
    close: [];
  }>()
  
  // Estado
  const activeTab = ref<'ventas' | 'acceso'>('ventas')
  const notification = ref<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  })
  
  // Verificar si el navegador soporta la API Web Share
  const canShare = computed<boolean>(() => {
    return typeof navigator !== 'undefined' && !!navigator.share
  })
  
  // Obtener enlaces
  const accesoLink = computed<string>(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/colaborador/admin/${props.collaborator.codigo_acceso}`
  })
  
  const ventasLink = computed<string>(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/venta/${props.collaborator.codigo_venta}`
  })
  
  // Formatear rol
  const formatRole = (role: string): string => {
    const roles: Record<string, string> = {
      'vendedor': 'Vendedor',
      'gestor_entregas': 'Gestor de Entregas',
      'gestor_cobros': 'Gestor de Cobros',
      'admin': 'Administrador'
    }
    
    return roles[role] || role
  }
  
  // Descargar QR
  const downloadQR = (tipo: 'acceso' | 'venta'): void => {
    const link = document.createElement('a')
    
    if (tipo === 'acceso') {
      link.download = `acceso-${props.collaborator.codigo_acceso}.png`
      link.href = props.collaborator.codigo_qr || ''
    } else {
      link.download = `ventas-${props.collaborator.codigo_venta}.png`
      link.href = props.collaborator.codigo_venta_qr || ''
    }
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showNotification(`Código QR de ${tipo === 'acceso' ? 'acceso' : 'ventas'} descargado correctamente`)
  }
  
  // Compartir QR (Web Share API)
  const shareQR = async (tipo: 'acceso' | 'venta'): Promise<void> => {
    try {
      if (navigator.share) {
        const url = tipo === 'acceso' ? accesoLink.value : ventasLink.value
        const title = tipo === 'acceso' 
          ? `Código de acceso para ${props.collaborator.nombre}`
          : `Realiza tu pedido con ${props.collaborator.nombre}`
        
        const text = tipo === 'acceso'
          ? `Aquí tienes tu código de acceso para la actividad: ${props.collaborator.codigo_acceso}`
          : `Realiza tu pedido a través de este enlace`
        
        await navigator.share({
          title,
          text,
          url
        })
        showNotification('Compartido correctamente')
      }
    } catch (err) {
      console.error('Error al compartir:', err)
    }
  }
  
  // Copiar código
  const copyCode = (tipo: 'acceso' | 'venta'): void => {
    const code = tipo === 'acceso' 
      ? props.collaborator.codigo_acceso 
      : props.collaborator.codigo_venta
      
    navigator.clipboard.writeText(code || '')
      .then(() => {
        showNotification('Código copiado al portapapeles')
      })
      .catch(err => {
        console.error('Error al copiar:', err)
        showNotification('No se pudo copiar el código', 'error')
      })
  }
  
  // Copiar enlace actual
  const copyCurrentLink = (): void => {
    const link = activeTab.value === 'ventas' ? ventasLink.value : accesoLink.value
    
    navigator.clipboard.writeText(link)
      .then(() => {
        showNotification('Enlace copiado al portapapeles')
      })
      .catch(err => {
        console.error('Error al copiar:', err)
        showNotification('No se pudo copiar el enlace', 'error')
      })
  }
  
  // Mostrar notificación
  const showNotification = (message: string, type: 'success' | 'error' = 'success'): void => {
    notification.value = {
      show: true,
      message,
      type
    }
    
    setTimeout(() => {
      notification.value.show = false
    }, 3000)
  }
  </script>
  
  <style scoped>
  .qr-share-container {
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 600px;
    overflow: hidden;
    position: relative;
  }
  
  .qr-share-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--primary-color);
    color: white;
    padding: 1rem 1.5rem;
  }
  
  .qr-share-header h3 {
    margin: 0;
    font-size: 1.2rem;
  }
  
  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
  }
  
  .close-button:hover {
    opacity: 1;
  }
  
  .qr-share-content {
    padding: 1.5rem;
  }
  
  .collaborator-info {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  
  .collaborator-info h4 {
    margin: 0 0 0.5rem;
    font-size: 1.3rem;
    color: var(--text-color-dark);
  }
  
  .role-badge {
    display: inline-block;
    background-color: #e9ecef;
    padding: 0.25rem 0.75rem;
    border-radius: 30px;
    font-size: 0.85rem;
    color: var(--text-color);
  }
  
  /* Estilos de pestañas */
  .qr-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
  }
  
  .tab-button {
    flex: 1;
    padding: 0.75rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-color);
    transition: all 0.2s;
  }
  
  .tab-button.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
  
  .tab-button:hover:not(.active) {
    background-color: #f8f9fa;
  }
  
  .tab-description {
    font-size: 0.9rem;
    color: var(--text-color);
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .access-info {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .qr-section, .code-section {
    flex: 1;
    text-align: center;
  }
  
  .qr-section h4, .code-section h4 {
    margin: 0 0 0.8rem;
    color: var(--text-color-dark);
  }
  
  .qr-image-container {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: var(--border-radius-small);
    display: inline-block;
    margin-bottom: 1rem;
  }
  
  .qr-image {
    max-width: 100%;
    height: auto;
  }
  
  .qr-actions {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
  }
  
  .access-code {
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 2px;
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: var(--border-radius-small);
    margin-bottom: 1rem;
    color: var(--primary-color);
  }
  
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.8rem;
    background-color: #f0f0f0;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .action-button:hover {
    background-color: #e2e2e2;
  }
  
  .button-icon {
    font-size: 1rem;
  }
  
  .instructions {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: var(--border-radius-small);
    font-size: 0.95rem;
    color: var(--text-color);
  }
  
  .access-link {
    word-break: break-all;
    font-weight: 500;
    color: var(--primary-color);
  }
  
  .text-button {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
    padding: 0;
    text-decoration: underline;
  }
  
  .notification {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.6rem 1rem;
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.3s;
    z-index: 10;
  }
  
  .notification.success {
    background-color: #d4edda;
    color: #155724;
  }
  
  .notification.error {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  
  @media (max-width: 640px) {
    .access-info {
      flex-direction: column;
    }
  }
  </style>