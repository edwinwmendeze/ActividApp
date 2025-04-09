<!-- components/Admin/CollaboratorsList.vue -->
<template>
    <div class="collaborators-list">
      <!-- Header con buscador y botón de añadir -->
      <div class="list-header">
        <div class="search-box">
          <input 
            type="text" 
            v-model="search" 
            placeholder="Buscar colaboradores..." 
            @input="filterCollaborators"
          />
        </div>
        <button @click="showAddForm" class="action-button">
          <span class="button-icon">+</span> Añadir Colaborador
        </button>
      </div>
  
      <!-- Loader mientras se cargan los colaboradores -->
      <div v-if="loading" class="centered-loader">
        <div class="loader"></div>
        <p>Cargando colaboradores...</p>
      </div>
      
      <!-- Mensaje cuando no hay colaboradores -->
      <div v-else-if="filteredCollaborators.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No hay colaboradores</h3>
        <p v-if="search">
          No se encontraron colaboradores con el término "{{ search }}".
          <button @click="search = ''" class="text-button">Limpiar búsqueda</button>
        </p>
        <p v-else>
          ¡Comienza añadiendo colaboradores para tu actividad!
        </p>
        <button @click="showAddForm" class="action-button">
          Añadir Primer Colaborador
        </button>
      </div>
      
      <!-- Lista de colaboradores -->
      <div v-else class="collaborators-grid">
        <div 
          v-for="collaborator in filteredCollaborators" 
          :key="collaborator.id"
          class="collaborator-card"
        >
          <div class="collaborator-status" :class="{ 'inactive': !collaborator.activo }">
            {{ collaborator.activo ? 'Activo' : 'Inactivo' }}
          </div>
          
          <div class="collaborator-avatar">
            <div class="avatar-placeholder">{{ getInitials(collaborator.nombre) }}</div>
          </div>
          
          <div class="collaborator-info">
            <h3 class="collaborator-name">{{ collaborator.nombre }}</h3>
            <div class="collaborator-role">{{ formatRole(collaborator.rol) }}</div>
            <div class="collaborator-contact">
              <div class="contact-item">
                <span class="contact-icon">📱</span>
                {{ collaborator.telefono || 'No disponible' }}
              </div>
            </div>
          </div>
          
          <div class="collaborator-actions">
            <button @click="viewQR(collaborator)" class="icon-button">
              <span title="Ver QR">🔗</span>
            </button>
            <button @click="editCollaborator(collaborator)" class="icon-button edit">
              <span title="Editar">✏️</span>
            </button>
            <button @click="confirmDeleteCollaborator(collaborator)" class="icon-button delete">
              <span title="Eliminar">🗑️</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Notificación de éxito/error -->
      <div v-if="notification.show" class="notification" :class="notification.type">
        <div class="notification-content">
          <span class="notification-icon">{{ notification.type === 'success' ? '✅' : '❌' }}</span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  
  const props = defineProps<{
    actividadId: string
  }>()
  
  const emit = defineEmits(['edit', 'add', 'view-qr', 'delete'])
  
  // Estado
  const collaborators = ref<any[]>([])
  const filteredCollaborators = ref<any[]>([])
  const loading = ref(true)
  const search = ref('')
  const notification = ref({
    show: false,
    message: '',
    type: 'success'
  })
  
  // Cliente Supabase
  const supabase = useSupabaseClient()
  
  // Cargar colaboradores
  const loadCollaborators = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('actividad_id', props.actividadId)
        .order('nombre')
      
      if (error) throw error
      
      collaborators.value = data || []
      filteredCollaborators.value = [...collaborators.value]
    } catch (err) {
      console.error('Error al cargar colaboradores:', err)
      showNotification('Error al cargar los colaboradores', 'error')
    } finally {
      loading.value = false
    }
  }
  
  // Filtrar colaboradores
  const filterCollaborators = () => {
    if (!search.value) {
      filteredCollaborators.value = [...collaborators.value]
      return
    }
    
    const searchTerm = search.value.toLowerCase()
    filteredCollaborators.value = collaborators.value.filter(c => 
      c.nombre.toLowerCase().includes(searchTerm) ||
      c.telefono?.toLowerCase().includes(searchTerm) ||
      c.rol.toLowerCase().includes(searchTerm)
    )
  }
  
  // Formatear roles
  const formatRole = (role: string) => {
    const roles = {
      'vendedor': 'Vendedor',
      'gestor_entregas': 'Gestor de Entregas',
      'gestor_cobros': 'Gestor de Cobros',
      'admin': 'Administrador'
    }
    
    return roles[role as keyof typeof roles] || role
  }
  
  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }
  
  // Eventos
  const showAddForm = () => {
    emit('add')
  }
  
  const editCollaborator = (collaborator: any) => {
    emit('edit', collaborator)
  }
  
  const viewQR = (collaborator: any) => {
    emit('view-qr', collaborator)
  }
  
  const confirmDeleteCollaborator = (collaborator: any) => {
    emit('delete', collaborator)
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
  
  // Cargar colaboradores al inicio
  onMounted(() => {
    loadCollaborators()
  })
  
  // Exponer métodos para uso externo
  defineExpose({
    loadCollaborators,
    showNotification
  })
  </script>
  
  <style scoped>
  .collaborators-list {
    position: relative;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-large);
    flex-wrap: wrap;
    gap: var(--spacing-medium);
  }
  
  .search-box {
    flex: 1;
    min-width: 250px;
  }
  
  .search-box input {
    width: 100%;
    padding: var(--spacing-small);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: var(--font-size-base);
  }
  
  .centered-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-xlarge);
  }
  
  .loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--primary-color);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-small);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-xlarge);
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-medium);
    color: var(--text-color-light);
  }
  
  .empty-state h3 {
    margin-bottom: var(--spacing-small);
    color: var(--text-color-dark);
  }
  
  .empty-state p {
    margin-bottom: var(--spacing-medium);
    color: var(--text-color);
  }
  
  .text-button {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
  }
  
  .collaborators-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-medium);
  }
  
  .collaborator-card {
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }
  
  .collaborator-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .collaborator-status {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #28a745;
    color: white;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 0.8rem;
    z-index: 1;
  }
  
  .collaborator-status.inactive {
    background-color: #dc3545;
  }
  
  .collaborator-avatar {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border-bottom: 1px solid var(--border-color);
  }
  
  .avatar-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .collaborator-info {
    padding: var(--spacing-medium);
  }
  
  .collaborator-name {
    margin: 0 0 var(--spacing-small);
    font-size: 1.2rem;
    color: var(--text-color-dark);
  }
  
  .collaborator-role {
    display: inline-block;
    background-color: #e9ecef;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-bottom: var(--spacing-small);
    color: var(--text-color);
  }
  
  .collaborator-contact {
    color: var(--text-color);
    font-size: 0.9rem;
  }
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  
  .contact-icon {
    font-size: 1rem;
  }
  
  .collaborator-actions {
    padding: var(--spacing-small);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-small);
  }
  
  .icon-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .icon-button:hover {
    background-color: #f0f0f0;
  }
  
  .icon-button.edit:hover {
    background-color: #e3f2fd;
  }
  
  .icon-button.delete:hover {
    background-color: #ffebee;
  }
  
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1001;
    padding: var(--spacing-small) var(--spacing-medium);
    border-radius: var(--border-radius-small);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .notification.success {
    background-color: #d4edda;
    color: #155724;
  }
  
  .notification.error {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-small);
  }
  
  .notification-icon {
    font-size: 1.2rem;
  }
  
  .action-button {
    display: inline-block;
    padding: var(--spacing-small) var(--spacing-medium);
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius-small);
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: var(--font-size-base);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .action-button:hover {
    background-color: var(--button-bg-hover);
  }
  
  .button-icon {
    font-size: 1.2rem;
  }
  
  @media (max-width: 640px) {
    .collaborators-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>