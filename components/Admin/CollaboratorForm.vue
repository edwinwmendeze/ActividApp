<!-- components/Admin/CollaboratorForm.vue -->
<template>
  <div class="modal-container collaborator-form-container">
    <div class="modal-header">
      <h3>{{ isEdit ? 'Editar Colaborador' : 'Añadir Nuevo Colaborador' }}</h3>
      <button @click="$emit('close')" class="close-button" aria-label="Cerrar">&times;</button>
    </div>

    <form @submit.prevent="saveCollaborator" class="collaborator-form">
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

        <div class="form-group">
          <label>Estado</label>
          <div class="toggle-container">
            <label class="toggle">
              <input type="checkbox" v-model="form.activo">
              <span class="slider"></span>
            </label>
            <span class="toggle-label">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>

        <div v-if="isEdit" class="form-group">
          <label>Códigos de Acceso</label>
          <div class="code-display-container">
            <div class="code-display">
              <div>Acceso: {{ form.codigo_acceso }}</div>
              <div>Ventas: {{ form.codigo_venta }}</div>
            </div>
            <button 
              type="button" 
              @click="regenerateCodes" 
              class="action-button secondary"
              :disabled="loading"
            >
              Regenerar códigos
            </button>
          </div>
        </div>

        <div v-if="globalError" class="error-global">
          {{ globalError }}
        </div>
      </div>

      <div class="form-actions">
        <button 
          type="submit" 
          class="action-button primary" 
          :disabled="loading"
        >
          <div v-if="loading" class="button-loader"></div>
          <span v-else>{{ isEdit ? 'Guardar Cambios' : 'Crear Colaborador' }}</span>
        </button>
        <button 
          type="button" 
          @click="$emit('close')" 
          class="action-button secondary"
          :disabled="loading"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Colaborador } from '~/types'

interface Props {
  actividadId: string;
  collaborator?: Partial<Colaborador> | null;
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'saved'])

interface CollaboratorForm {
  nombre: string
  telefono: string
  rol: string
  activo: boolean
  codigo_acceso: string
  codigo_venta: string
}

const form = ref<CollaboratorForm>({
  nombre: '',
  telefono: '',
  rol: '',
  activo: true,
  codigo_acceso: '',
  codigo_venta: ''
})

const errors = ref<Record<string, string>>({})
const globalError = ref('')
const loading = ref(false)
const isEdit = computed(() => !!props.collaborator)

const supabase = useSupabaseClient()

// Generación de códigos únicos
const generateUniqueCode = (length = 6): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const checkCodeUniqueness = async (code: string, field: string): Promise<boolean> => {
  const { data } = await supabase
    .from('colaboradores')
    .select(field)
    .eq(field, code)
  return !data || data.length === 0
}

const generateQR = async (data: string): Promise<string> => {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  })
}

// Regenerar códigos
const regenerateCodes = async () => {
  loading.value = true
  try {
    form.value.codigo_acceso = await generateUniqueCodeWithCheck('codigo_acceso')
    form.value.codigo_venta = await generateUniqueCodeWithCheck('codigo_venta')
  } catch (err) {
    globalError.value = 'Error regenerando códigos'
  } finally {
    loading.value = false
  }
}

const generateUniqueCodeWithCheck = async (field: string): Promise<string> => {
  let code: string
  let isUnique = false
  do {
    code = generateUniqueCode()
    isUnique = await checkCodeUniqueness(code, field)
  } while (!isUnique)
  return code
}

// Validación
const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.nombre.trim()) {
    errors.value.nombre = 'El nombre es obligatorio'
  } else if (form.value.nombre.length < 3) {
    errors.value.nombre = 'El nombre debe tener al menos 3 caracteres'
  }
  
  if (!form.value.telefono.trim()) {
    errors.value.telefono = 'El teléfono es obligatorio'
  }
  
  if (!form.value.rol) {
    errors.value.rol = 'Debes seleccionar un rol'
  }
  
  return Object.keys(errors.value).length === 0
}

// Guardar colaborador
const saveCollaborator = async () => {
  if (!validateForm()) return
  
  loading.value = true
  globalError.value = ''

  try {
    const baseUrl = window.location.origin
    const collaboratorData = { ...form.value }
    
    // Generar QR codes para nuevos colaboradores
    if (!isEdit.value) {
      collaboratorData.codigo_acceso = await generateUniqueCodeWithCheck('codigo_acceso')
      collaboratorData.codigo_venta = await generateUniqueCodeWithCheck('codigo_venta')
      
      collaboratorData.codigo_qr = await generateQR(`${baseUrl}/colaborador/admin/${collaboratorData.codigo_acceso}`)
      collaboratorData.codigo_venta_qr = await generateQR(`${baseUrl}/venta/${collaboratorData.codigo_venta}`)
    }

    if (isEdit.value && props.collaborator?.id) {
      const { error } = await supabase
        .from('colaboradores')
        .update(collaboratorData)
        .eq('id', props.collaborator.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('colaboradores')
        .insert({ ...collaboratorData, actividad_id: props.actividadId })
      
      if (error) throw error
    }

    emit('saved')
    emit('close')
  } catch (err: any) {
    globalError.value = err.message || 'Error al guardar el colaborador'
  } finally {
    loading.value = false
  }
}

// Inicializar formulario
onMounted(() => {
  if (props.collaborator) {
    form.value = {
      nombre: props.collaborator.nombre || '',
      telefono: props.collaborator.telefono || '',
      rol: props.collaborator.rol || '',
      activo: props.collaborator.activo ?? true,
      codigo_acceso: props.collaborator.codigo_acceso || '',
      codigo_venta: props.collaborator.codigo_venta || ''
    }
  }
})
</script>

<style scoped>
.modal-container {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--border-radius) var(--border-radius) 0 0;
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

.collaborator-form {
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
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-size: 1rem;
  background-color: #f9f9f9;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  outline: none;
}

.has-error {
  border-color: #dc3545 !important;
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
  margin: 1rem 0;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.code-display-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
}

.code-display {
  flex: 1;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-small);
  font-family: monospace;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.action-button {
  flex: 1;
  padding: 0.75rem;
  border-radius: var(--border-radius-small);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.primary {
  background-color: var(--primary-color);
  color: white;
}

.primary:hover {
  background-color: var(--button-bg-hover);
}

.secondary {
  background-color: #e9ecef;
  color: var(--text-color-dark);
}

.secondary:hover {
  background-color: #dee2e6;
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

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  
  .code-display-container {
    flex-direction: column;
  }
}
</style>