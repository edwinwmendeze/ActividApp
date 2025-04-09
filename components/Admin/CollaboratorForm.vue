<!-- components/Admin/CollaboratorForm.vue -->
<template>
    <div class="collaborator-form-container">
      <form @submit.prevent="saveCollaborator" class="collaborator-form">
        <div class="form-header">
          <h3>{{ isEdit ? 'Editar Colaborador' : 'Añadir Nuevo Colaborador' }}</h3>
          <button type="button" class="close-button" @click="$emit('close')">&times;</button>
        </div>
        
        <div class="form-body">
          <div class="form-group">
            <label for="nombre">Nombre *</label>
            <input 
              id="nombre"
              v-model.trim="form.nombre"
              type="text"
              required
              placeholder="Nombre completo"
              :class="{ 'has-error': errors.nombre }"
            />
            <p v-if="errors.nombre" class="error-message">{{ errors.nombre }}</p>
          </div>
          
          <div class="form-group">
            <label for="telefono">Teléfono *</label>
            <input 
              id="telefono"
              v-model.trim="form.telefono"
              type="tel"
              required
              placeholder="Ej: +51 999 123 456"
              :class="{ 'has-error': errors.telefono }"
            />
            <p v-if="errors.telefono" class="error-message">{{ errors.telefono }}</p>
          </div>
          
          <div class="form-group">
            <label for="rol">Rol *</label>
            <select 
              id="rol"
              v-model="form.rol"
              required
              :class="{ 'has-error': errors.rol }"
            >
              <option value="" disabled>Selecciona un rol</option>
              <option value="vendedor">Vendedor</option>
              <option value="gestor_entregas">Gestor de Entregas</option>
              <option value="gestor_cobros">Gestor de Cobros</option>
              <option value="admin">Administrador</option>
            </select>
            <p v-if="errors.rol" class="error-message">{{ errors.rol }}</p>
          </div>
          
          <div class="form-group" v-if="isEdit">
            <label>Estado</label>
            <div class="toggle-container">
              <label class="toggle">
                <input type="checkbox" v-model="form.activo">
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
            </div>
          </div>
          
          <div v-if="globalError" class="error-global">
            {{ globalError }}
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="action-button primary" :disabled="loading">
            <div v-if="loading" class="button-loader"></div>
            <span v-else>{{ isEdit ? 'Guardar Cambios' : 'Crear Colaborador' }}</span>
          </button>
          <button type="button" @click="$emit('close')" class="action-button secondary" :disabled="loading">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import type { Actividad, Colaborador } from '~/types'
  
  interface Props {
    actividadId: string;
    collaborator?: Partial<Colaborador> | null;
  }
  
  const props = defineProps<Props>()
  
  const emit = defineEmits<{
    close: [];
    saved: [data: Colaborador];
  }>()
  
  // Estado del formulario
  interface CollaboratorForm {
    nombre: string;
    telefono: string;
    rol: string;
    activo: boolean;
  }
  
  const form = ref<CollaboratorForm>({
    nombre: '',
    telefono: '',
    rol: '',
    activo: true
  })
  
  const errors = ref<Record<string, string>>({})
  const globalError = ref<string>('')
  const loading = ref<boolean>(false)
  const isEdit = computed<boolean>(() => !!props.collaborator)
  
  // Cliente Supabase
  const supabase = useSupabaseClient()
  
  // Genera un código alfanumérico único de 6 caracteres
  const generateUniqueCode = (): string => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluimos caracteres confusos
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  // Genera un código QR para una URL específica
  const generateQR = async (url: string): Promise<string> => {
    try {
      // Usar una librería para generar QR
      const QRCode = await import('qrcode')
      
      return await QRCode.default.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Error generando QR:', err);
      throw new Error('No se pudo generar el código QR');
    }
  }
  
  // Validar formulario
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    
    if (!form.value.nombre.trim()) {
      errs.nombre = 'El nombre es obligatorio'
    } else if (form.value.nombre.length < 3) {
      errs.nombre = 'El nombre debe tener al menos 3 caracteres'
    }
    
    if (!form.value.telefono.trim()) {
      errs.telefono = 'El teléfono es obligatorio'
    }
    
    if (!form.value.rol) {
      errs.rol = 'Debes seleccionar un rol'
    }
    
    errors.value = errs
    return Object.keys(errs).length === 0
  }
  
  // Guardar colaborador
  const saveCollaborator = async () => {
    if (!validateForm()) return
    
    loading.value = true
    globalError.value = ''
    
    try {
      if (isEdit.value && props.collaborator?.id) {
        // Actualizar colaborador existente
        const { error } = await supabase
          .from('colaboradores')
          .update({
            nombre: form.value.nombre,
            telefono: form.value.telefono,
            rol: form.value.rol,
            activo: form.value.activo
          })
          .eq('id', props.collaborator.id)
        
        if (error) throw new Error(error.message)
        
        // Obtener colaborador actualizado
        const { data: updatedCollaborator, error: fetchError } = await supabase
          .from('colaboradores')
          .select('*')
          .eq('id', props.collaborator.id)
          .single()
          
        if (fetchError) throw new Error(fetchError.message)
        
        emit('saved', updatedCollaborator as Colaborador)
      } else {
        // Generar código de acceso único
        let codigoAcceso = generateUniqueCode()
        let isUnique = false
        
        while (!isUnique) {
          const { data } = await supabase
            .from('colaboradores')
            .select('codigo_acceso')
            .eq('codigo_acceso', codigoAcceso)
          
          if (!data || data.length === 0) {
            isUnique = true
          } else {
            codigoAcceso = generateUniqueCode()
          }
        }
        
        // Generar código de venta único
        let codigoVenta = generateUniqueCode()
        isUnique = false
        
        while (!isUnique) {
          const { data } = await supabase
            .from('colaboradores')
            .select('codigo_venta')
            .eq('codigo_venta', codigoVenta)
          
          if (!data || data.length === 0) {
            isUnique = true
          } else {
            codigoVenta = generateUniqueCode()
          }
        }
        
        // En producción, esta URL debería ser la de tu aplicación desplegada
        const baseUrl = window.location.origin;
        
        // Generar QR para acceso al panel
        const panelUrl = `${baseUrl}/colaborador/admin/${codigoAcceso}`;
        const codigoQR = await generateQR(panelUrl);
        
        // Generar QR para compartir con clientes (ventas)
        const ventaUrl = `${baseUrl}/venta/${codigoVenta}`;
        const codigoVentaQR = await generateQR(ventaUrl);
        
        // Crear nuevo colaborador con ambos códigos
        const { data, error } = await supabase
          .from('colaboradores')
          .insert({
            actividad_id: props.actividadId,
            nombre: form.value.nombre,
            telefono: form.value.telefono,
            rol: form.value.rol,
            activo: form.value.activo,
            codigo_acceso: codigoAcceso,
            codigo_qr: codigoQR,
            codigo_venta: codigoVenta,
            codigo_venta_qr: codigoVentaQR
          })
          .select()
          .single()
        
        if (error) throw new Error(error.message)
        
        emit('saved', data as Colaborador)
      }
    } catch (err: any) {
      console.error('Error al guardar colaborador:', err)
      globalError.value = err.message || 'Error al guardar el colaborador'
    } finally {
      loading.value = false
    }
  }
  
  // Inicializar formulario con datos del colaborador si estamos editando
  onMounted(() => {
    if (props.collaborator) {
      form.value = {
        nombre: props.collaborator.nombre || '',
        telefono: props.collaborator.telefono || '',
        rol: props.collaborator.rol || '',
        activo: typeof props.collaborator.activo === 'boolean' ? props.collaborator.activo : true
      }
    }
  })
  </script>
  
  <style scoped>
  .collaborator-form-container {
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 500px;
    overflow: hidden;
  }
  
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--primary-color);
    color: white;
    padding: 1rem 1.5rem;
  }
  
  .form-header h3 {
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
  
  .form-body {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.2rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color-dark);
  }
  
  input, select {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  input:focus, select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    outline: none;
  }
  
  input.has-error, select.has-error {
    border-color: #dc3545;
  }
  
  .error-message {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
  
  .error-global {
    background-color: #f8d7da;
    color: #721c24;
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-small);
    margin-bottom: 1rem;
  }
  
  .form-actions {
    display: flex;
    gap: 0.8rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    background-color: #f9f9f9;
  }
  
  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
    padding: 0.6rem 1rem;
    border-radius: var(--border-radius-small);
    font-weight: 500;
    font-size: 1rem;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  
  .action-button.primary {
    background-color: var(--primary-color);
    color: white;
  }
  
  .action-button.primary:hover {
    background-color: var(--button-bg-hover);
  }
  
  .action-button.secondary {
    background-color: #e9ecef;
    color: #343a40;
  }
  
  .action-button.secondary:hover {
    background-color: #dee2e6;
  }
  
  .action-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .button-loader {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  
  .toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  
  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: var(--primary-color);
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
  
  .toggle-label {
    font-size: 0.9rem;
    color: var(--text-color);
  }
  </style>