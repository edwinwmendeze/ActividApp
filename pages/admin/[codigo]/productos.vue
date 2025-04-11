<!-- pages/admin/[codigo]/productos.vue -->
<template>
    <div class="productos-management">
      <div class="tab-header">
        <h2>Gestión de Productos</h2>
        <button @click="mostrarFormularioProducto()" class="action-button primary">
          <span class="button-icon">+</span> Añadir Producto
        </button>
      </div>
  
      <div class="filters-bar">
        <div class="search-box">
          <input
            type="text"
            v-model="filtros.busqueda"
            placeholder="Buscar productos por nombre o descripción..."
            @input="filtrarProductos"
            aria-label="Buscar productos"
          />
          <span class="search-icon">🔍</span>
        </div>
        <div class="filter-options">
          <select v-model="filtros.tipo" @change="filtrarProductos" aria-label="Filtrar por tipo">
            <option value="">Todos los tipos</option>
            <option value="plato">Platos</option>
            <option value="bebida">Bebidas</option>
            <option value="postre">Postres</option>
            <option value="otro">Otros</option>
          </select>
          <select v-model="filtros.disponibilidad" @change="filtrarProductos" aria-label="Filtrar por disponibilidad">
            <option value="">Disponibilidad</option>
            <option value="disponible">Disponibles</option>
            <option value="no-disponible">No disponibles</option>
          </select>
           <button @click="limpiarFiltros" class="action-button secondary small" title="Limpiar filtros">
               ↺
           </button>
        </div>
      </div>
  
      <div v-if="loadingProductos" class="centered-loader">
        <div class="loader"></div>
        <p>Cargando productos...</p>
      </div>
  
      <div v-else-if="productos.length === 0 && !hasActiveFilters" class="empty-state">
         <div class="empty-icon">🍽️</div>
         <h3>Aún no has añadido productos</h3>
         <p>¡Comienza añadiendo tu primer producto para esta actividad!</p>
         <button @click="mostrarFormularioProducto()" class="action-button primary">
           Añadir Primer Producto
         </button>
       </div>
  
      <div v-else-if="productosFiltrados.length === 0 && hasActiveFilters" class="empty-state">
         <div class="empty-icon">🧐</div>
         <h3>Sin resultados</h3>
         <p>No se encontraron productos que coincidan con tu búsqueda o filtros.</p>
         <button @click="limpiarFiltros" class="action-button secondary">
           Limpiar Filtros
         </button>
       </div>
  
  
      <div v-else class="productos-grid">
        <div
          v-for="producto in productosFiltrados"
          :key="producto.id"
          class="producto-card"
          :class="{ 'not-available': !producto.disponible }"
        >
          <div class="producto-disponibilidad" :class="{ 'no-disponible': !producto.disponible }">
            {{ producto.disponible ? 'Disponible' : 'No disponible' }}
          </div>
  
          <div class="producto-imagen-container">
            <img
              v-if="producto.imagen_url"
              :src="producto.imagen_url"
              :alt="`Imagen de ${producto.nombre}`"
              class="producto-imagen"
              loading="lazy"
            />
            <div v-else class="producto-imagen-placeholder">
              {{ obtenerEmoji(producto.tipo) }}
            </div>
          </div>
  
          <div class="producto-info">
            <h3 class="producto-nombre">{{ producto.nombre }}</h3>
            <div class="producto-tipo">{{ formatearTipo(producto.tipo) }}</div>
            <p class="producto-descripcion">{{ producto.descripcion || 'Sin descripción' }}</p>
            <div class="producto-precio">S/ {{ producto.precio?.toFixed(2) ?? '0.00' }}</div>
          </div>
  
          <div class="producto-acciones">
            <button @click="mostrarFormularioProducto(producto)" class="icon-button edit" title="Editar producto">
              ✏️
            </button>
            <button @click="confirmarEliminarProducto(producto)" class="icon-button delete" title="Eliminar producto">
              🗑️
            </button>
          </div>
        </div>
      </div>
  
      <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>{{ modoEdicion ? 'Editar Producto' : 'Añadir Nuevo Producto' }}</h3>
            <button @click="cerrarModal" class="close-button" aria-label="Cerrar">&times;</button>
          </div>
  
          <form @submit.prevent="guardarProducto" class="producto-form" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="nombre">Nombre *</label>
                <input
                  id="nombre"
                  v-model.trim="productoForm.nombre"
                  type="text"
                  required
                  placeholder="Ej: Ceviche Clásico"
                  :class="{ 'has-error': erroresForm.nombre }"
                  aria-describedby="nombre-error"
                />
                <p v-if="erroresForm.nombre" class="error-message" id="nombre-error">{{ erroresForm.nombre }}</p>
              </div>
  
              <div class="form-group">
                <label for="tipo">Tipo *</label>
                <select
                  id="tipo"
                  v-model="productoForm.tipo"
                  required
                  :class="{ 'has-error': erroresForm.tipo }"
                   aria-describedby="tipo-error"
                >
                  <option value="" disabled>Selecciona un tipo</option>
                  <option value="plato">Plato</option>
                  <option value="bebida">Bebida</option>
                  <option value="postre">Postre</option>
                  <option value="otro">Otro</option>
                </select>
                 <p v-if="erroresForm.tipo" class="error-message" id="tipo-error">{{ erroresForm.tipo }}</p>
              </div>
            </div>
  
            <div class="form-group">
              <label for="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                v-model.trim="productoForm.descripcion"
                rows="3"
                placeholder="Ingredientes, tamaño, etc. (opcional)"
              ></textarea>
            </div>
  
            <div class="form-row">
              <div class="form-group">
                <label for="precio">Precio (S/) *</label>
                <div class="input-prefix">
                  <span class="prefix">S/ </span>
                  <input
                    id="precio"
                    v-model.number="productoForm.precio"
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    placeholder="0.00"
                    :class="{ 'has-error': erroresForm.precio }"
                     aria-describedby="precio-error"
                  />
                </div>
                 <p v-if="erroresForm.precio" class="error-message" id="precio-error">{{ erroresForm.precio }}</p>
              </div>
  
              <div class="form-group availability-group">
                <label>Disponibilidad</label>
                <label class="checkbox-container">
                  <input type="checkbox" v-model="productoForm.disponible" />
                  <span class="checkmark"></span>
                  Producto disponible
                </label>
              </div>
            </div>
  
            <div v-if="errorFormulario" class="error-global">
              {{ errorFormulario }}
            </div>
  
            <div class="form-actions">
               <button
                type="button"
                @click="cerrarModal"
                class="action-button secondary"
                :disabled="guardandoProducto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="action-button primary"
                :disabled="guardandoProducto"
              >
                <div v-if="guardandoProducto" class="button-loader"></div>
                <span v-else>{{ modoEdicion ? 'Guardar Cambios' : 'Crear Producto' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
  
      <div v-if="mostrarConfirmacion" class="modal-overlay" @click="cerrarConfirmacion">
        <div class="modal-container confirmation-modal" @click.stop>
          <div class="modal-header">
            <h3>Confirmar eliminación</h3>
            <button @click="cerrarConfirmacion" class="close-button">&times;</button>
          </div>
  
          <div class="confirmation-content">
            <div class="warning-icon">⚠️</div>
            <p>¿Estás seguro de que deseas eliminar el producto <strong>{{ productoAEliminar?.nombre }}</strong>?</p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
  
          <div class="confirmation-actions">
             <button
              @click="cerrarConfirmacion"
              class="action-button secondary"
              :disabled="eliminandoProducto"
            >
              Cancelar
            </button>
            <button
              @click="eliminarProductoConfirmado"
              class="action-button danger"
              :disabled="eliminandoProducto"
            >
              <div v-if="eliminandoProducto" class="button-loader white"></div>
              <span v-else>Sí, Eliminar</span>
            </button>
          </div>
        </div>
      </div>
  
      <transition name="slide-fade">
          <div v-if="notificacion.mostrar" class="notificacion" :class="notificacion.tipo">
          <div class="notificacion-contenido">
              <span class="notificacion-icono">{{ notificacion.tipo === 'exito' ? '✅' : '❌' }}</span>
              <span class="notificacion-mensaje">{{ notificacion.mensaje }}</span>
          </div>
          </div>
      </transition>
  
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, computed } from 'vue';

  import { formatearTipo, obtenerEmoji } from 'utils/formatters';
  
  const supabase = useSupabaseClient();
  const emit = defineEmits(['refresh-stats']); // Para notificar al layout si cambian las stats
  
  // Props recibidas del layout
  const props = defineProps({
    actividad: {
      type: Object,
      required: true
    }
  });
  
  // Estado de Productos
  const productos = ref([]);
  const productosFiltrados = ref([]);
  const loadingProductos = ref(true);
  
  // Estado de Filtros
  const filtros = reactive({
    busqueda: '',
    tipo: '',
    disponibilidad: ''
  });
  
  // Estado del Modal de Formulario
  const mostrarModal = ref(false);
  const modoEdicion = ref(false);
  const productoAEditar = ref(null);
  const guardandoProducto = ref(false);
  const errorFormulario = ref('');
  const productoForm = reactive({
    nombre: '',
    descripcion: '',
    precio: null, // Usar null para validar mejor
    tipo: '',
    disponible: true,
    imagen_url: '' // Futuro: manejo de subida de imagen
  });
  const erroresForm = reactive({});
  
  // Estado del Modal de Confirmación
  const mostrarConfirmacion = ref(false);
  const productoAEliminar = ref(null);
  const eliminandoProducto = ref(false);
  
  // Estado de Notificaciones
  const notificacion = reactive({
    mostrar: false,
    mensaje: '',
    tipo: 'exito' // 'exito' o 'error'
  });
  let notificacionTimeout = null;
  
  // --- Ciclo de Vida y Carga ---
  onMounted(async () => {
    await cargarProductos();
  });
  
  async function cargarProductos() {
    if (!props.actividad.id) return;
    loadingProductos.value = true;
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('actividad_id', props.actividad.id)
        .order('nombre', { ascending: true });
  
      if (error) {
        throw new Error(error.message || 'Error al cargar los productos');
      }
  
      productos.value = data || [];
      filtrarProductos(); // Aplicar filtros iniciales (o mostrar todos)
  
    } catch (err) {
      console.error('Error al cargar productos:', err);
      mostrarNotificacion(`Error al cargar productos: ${err.message}`, 'error');
      productos.value = [];
      productosFiltrados.value = [];
    } finally {
      loadingProductos.value = false;
    }
  }
  
  // --- Lógica de Filtros ---
  const hasActiveFilters = computed(() => {
      return filtros.busqueda !== '' || filtros.tipo !== '' || filtros.disponibilidad !== '';
  });
  
  
  function filtrarProductos() {
    const busquedaLower = filtros.busqueda.toLowerCase();
    productosFiltrados.value = productos.value.filter(producto => {
      const matchBusqueda = !filtros.busqueda ||
        producto.nombre.toLowerCase().includes(busquedaLower) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(busquedaLower));
  
      const matchTipo = !filtros.tipo || producto.tipo === filtros.tipo;
  
      let matchDisponibilidad = true;
      if (filtros.disponibilidad === 'disponible') {
        matchDisponibilidad = producto.disponible;
      } else if (filtros.disponibilidad === 'no-disponible') {
        matchDisponibilidad = !producto.disponible;
      }
  
      return matchBusqueda && matchTipo && matchDisponibilidad;
    });
  }
  
  function limpiarFiltros() {
    filtros.busqueda = '';
    filtros.tipo = '';
    filtros.disponibilidad = '';
    filtrarProductos(); // Volver a aplicar (mostrará todos)
  }
  
  // --- Lógica del Modal de Formulario ---
  function mostrarFormularioProducto(producto = null) {
    // Resetear
    Object.keys(erroresForm).forEach(key => delete erroresForm[key]);
    errorFormulario.value = '';
  
    if (producto) {
      // Modo edición
      modoEdicion.value = true;
      productoAEditar.value = producto;
      productoForm.nombre = producto.nombre;
      productoForm.descripcion = producto.descripcion || '';
      productoForm.precio = producto.precio;
      productoForm.tipo = producto.tipo;
      productoForm.disponible = producto.disponible;
      productoForm.imagen_url = producto.imagen_url || '';
    } else {
      // Modo creación
      modoEdicion.value = false;
      productoAEditar.value = null;
      productoForm.nombre = '';
      productoForm.descripcion = '';
      productoForm.precio = null; // Resetear a null
      productoForm.tipo = '';
      productoForm.disponible = true;
      productoForm.imagen_url = '';
    }
    mostrarModal.value = true;
  }
  
  function cerrarModal() {
    if (guardandoProducto.value) return; // Evitar cerrar mientras guarda
    mostrarModal.value = false;
  }
  
  function validarFormulario() {
    Object.keys(erroresForm).forEach(key => delete erroresForm[key]); // Limpiar errores previos
    let isValid = true;
  
    if (!productoForm.nombre.trim()) {
      erroresForm.nombre = 'El nombre es obligatorio';
      isValid = false;
    }
    if (!productoForm.tipo) {
      erroresForm.tipo = 'Debes seleccionar un tipo';
      isValid = false;
    }
    if (productoForm.precio === null || productoForm.precio === undefined) {
       erroresForm.precio = 'El precio es obligatorio';
       isValid = false;
    } else if (isNaN(productoForm.precio) || productoForm.precio < 0) {
       erroresForm.precio = 'El precio debe ser un número positivo';
       isValid = false;
    }
  
  
    return isValid;
  }
  
  async function guardarProducto() {
    if (!validarFormulario()) return;
  
    guardandoProducto.value = true;
    errorFormulario.value = '';
  
    try {
      const productoData = {
        actividad_id: props.actividad.id,
        nombre: productoForm.nombre.trim(),
        descripcion: productoForm.descripcion.trim() || null, // Guardar null si está vacío
        precio: productoForm.precio,
        tipo: productoForm.tipo,
        disponible: productoForm.disponible
        // imagen_url se manejaría por separado si hubiera subida de archivos
      };
  
      let resultado;
      if (modoEdicion.value && productoAEditar.value) {
        // Actualizar
         const { error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', productoAEditar.value.id);
         if (error) throw error;
        mostrarNotificacion('Producto actualizado correctamente');
      } else {
        // Crear
         const { error } = await supabase
          .from('productos')
          .insert(productoData);
          if (error) throw error;
  
        mostrarNotificacion('Producto creado correctamente');
        emit('refresh-stats'); // Notificar al layout para actualizar contador
      }
  
      await cargarProductos(); // Recargar la lista
      cerrarModal();
  
    } catch (err) {
      console.error('Error al guardar producto:', err);
      errorFormulario.value = `Error al guardar: ${err.message || 'Error desconocido'}`;
       mostrarNotificacion(`Error al guardar el producto: ${err.message}`, 'error');
    } finally {
      guardandoProducto.value = false;
    }
  }
  
  // --- Lógica del Modal de Confirmación ---
  function confirmarEliminarProducto(producto) {
    productoAEliminar.value = producto;
    mostrarConfirmacion.value = true;
  }
  
  function cerrarConfirmacion() {
      if (eliminandoProducto.value) return;
      mostrarConfirmacion.value = false;
      productoAEliminar.value = null;
  }
  
  async function eliminarProductoConfirmado() {
    if (!productoAEliminar.value) return;
  
    eliminandoProducto.value = true;
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productoAEliminar.value.id);
  
      if (error) {
          throw error;
      }
  
      mostrarNotificacion('Producto eliminado correctamente');
      emit('refresh-stats'); // Notificar al layout para actualizar contador
      await cargarProductos(); // Recargar lista
      cerrarConfirmacion(); // Cerrar modal
  
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      mostrarNotificacion(`Error al eliminar el producto: ${err.message}`, 'error');
    } finally {
      eliminandoProducto.value = false;
    }
  }
  
  
  // --- Lógica de Notificaciones ---
  function mostrarNotificacion(mensaje, tipo = 'exito') {
    // Limpiar timeout anterior si existe
    if (notificacionTimeout) clearTimeout(notificacionTimeout);
  
    notificacion.mensaje = mensaje;
    notificacion.tipo = tipo;
    notificacion.mostrar = true;
  
    // Ocultar después de 3 segundos
    notificacionTimeout = setTimeout(() => {
      notificacion.mostrar = false;
    }, 3500);
  }
  
  </script>
  
  <style scoped>
  /* Estilos específicos de la gestión de productos */
  
  .productos-management h2 {
      color: #343a40;
      margin-bottom: 1.5rem;
      font-weight: 600;
  }
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem; /* var(--spacing-large) */
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  /* --- Filtros --- */
  .filters-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem; /* var(--spacing-medium) */
    margin-bottom: 1.5rem; /* var(--spacing-large) */
    background-color: #fff; /* var(--background-color-white) */
    padding: 1rem; /* var(--spacing-medium) */
    border-radius: 8px; /* var(--border-radius) */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); /* var(--card-shadow-light) */
    border: 1px solid #e9ecef; /* var(--border-color-light) */
  }
  
  .search-box {
    flex: 2; /* Ocupa más espacio */
    min-width: 250px;
    position: relative;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem; /* Añadir padding izquierdo para icono */
    border: 1px solid #ced4da; /* var(--border-color) */
    border-radius: 6px; /* var(--border-radius-small) */
    font-size: 1rem; /* var(--font-size-base) */
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-box input:focus {
      border-color: #4CAF50; /* var(--primary-color) */
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
      outline: none;
  }
  .search-icon {
      position: absolute;
      left: 0.8rem;
      top: 50%;
      transform: translateY(-50%);
      color: #adb5bd; /* var(--text-color-light) */
      pointer-events: none;
  }
  
  
  .filter-options {
    display: flex;
    gap: 0.75rem; /* var(--spacing-small) */
    flex-wrap: wrap;
    flex: 1; /* Que ocupen el espacio restante */
    justify-content: flex-end; /* Alinea a la derecha */
  }
  
  .filter-options select {
    padding: 0.75rem 1rem;
    border: 1px solid #ced4da; /* var(--border-color) */
    border-radius: 6px; /* var(--border-radius-small) */
    background-color: #fff;
    min-width: 150px;
    font-size: 0.95rem;
     transition: border-color 0.2s, box-shadow 0.2s;
     cursor: pointer;
  }
  .filter-options select:focus {
       border-color: #4CAF50;
       box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
       outline: none;
  }
  
  .filter-options .action-button.small {
      padding: 0.5rem 0.8rem; /* Más pequeño */
      font-size: 1rem;
      line-height: 1;
      min-width: auto;
  }
  
  
  /* --- Loader y Estados Vacíos --- */
  .centered-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem; /* var(--spacing-xlarge) */
    text-align: center;
    color: #6c757d;
  }
  .centered-loader .loader { /* Hereda de layout o define aquí si es diferente */
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4CAF50;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem; /* var(--spacing-xlarge) */
    background-color: #fff; /* var(--background-color-white) */
    border-radius: 8px; /* var(--border-radius) */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    border: 1px solid #e9ecef;
    margin-top: 1rem;
     color: #6c757d; /* var(--text-color-secondary) */
  }
  
  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 1rem; /* var(--spacing-medium) */
    color: #adb5bd; /* var(--text-color-light) */
  }
  
  .empty-state h3 {
    margin-bottom: 0.5rem; /* var(--spacing-small) */
    color: #343a40; /* var(--text-color-dark) */
    font-size: 1.3rem;
    font-weight: 500;
  }
  
  .empty-state p {
    margin-bottom: 1.2rem; /* var(--spacing-medium) */
    font-size: 1rem;
  }
  
  .empty-state .action-button { margin-top: 0.5rem; }
  
  
  /* --- Grid de Productos --- */
  .productos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.2rem; /* var(--spacing-medium) + */
  }
  
  .producto-card {
    background-color: #fff;
    border-radius: 8px; /* var(--border-radius) */
    box-shadow: 0 3px 7px rgba(0, 0, 0, 0.08); /* var(--card-shadow) */
    overflow: hidden;
    position: relative;
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
    display: flex;
    flex-direction: column; /* Organizar contenido verticalmente */
     border: 1px solid #e9ecef;
  }
  
  .producto-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1); /* var(--card-shadow-hover) */
  }
  .producto-card.not-available {
      opacity: 0.7;
  }
  .producto-card.not-available:hover {
      transform: none;
      box-shadow: 0 3px 7px rgba(0, 0, 0, 0.08);
  }
  
  
  .producto-disponibilidad {
    position: absolute;
    top: 12px;
    right: 12px;
    background-color: #28a745; /* var(--success-color) */
    color: white;
    padding: 4px 10px;
    border-radius: 12px; /* Más redondeado */
    font-size: 0.75rem;
    font-weight: 500;
    z-index: 2;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  
  .producto-disponibilidad.no-disponible {
    background-color: #dc3545; /* var(--danger-color) */
  }
  
  .producto-imagen-container {
    height: 180px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa; /* var(--background-color-light) */
    position: relative; /* Para pseudo-elementos si son necesarios */
  }
  
  .producto-imagen {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Cubre el espacio sin distorsión */
    transition: transform 0.3s ease;
  }
  .producto-card:hover .producto-imagen {
      transform: scale(1.05); /* Sutil zoom al pasar el mouse */
  }
  
  
  .producto-imagen-placeholder {
    font-size: 4rem;
    color: #ced4da; /* var(--text-color-light) */
  }
  
  .producto-info {
    padding: 1rem; /* var(--spacing-medium) */
    flex-grow: 1; /* Permite que esta sección crezca */
    display: flex;
    flex-direction: column;
  }
  
  .producto-nombre {
    margin: 0 0 0.5rem; /* var(--spacing-small) */
    font-size: 1.15rem; /* Ligeramente más grande */
    color: #212529; /* var(--text-color-dark) */
    font-weight: 600;
    line-height: 1.3;
  }
  
  .producto-tipo {
    display: inline-block;
    background-color: #e9ecef; /* var(--background-color-tag) */
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-bottom: 0.6rem; /* var(--spacing-small) */
    color: #495057; /* var(--text-color) */
    font-weight: 500;
    align-self: flex-start; /* Para que no ocupe todo el ancho */
  }
  
  .producto-descripcion {
    margin-bottom: 0.8rem; /* var(--spacing-small) */
    color: #6c757d; /* var(--text-color-secondary) */
    font-size: 0.9rem;
    line-height: 1.4;
    flex-grow: 1; /* Ocupa el espacio disponible */
    min-height: 40px; /* Asegura un mínimo de altura */
    /* Clamp de 2 líneas */
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
  }
  
  .producto-precio {
    font-weight: bold;
    color: #4CAF50; /* var(--primary-color) */
    font-size: 1.25rem;
    margin-top: auto; /* Empuja al final */
    padding-top: 0.5rem;
  }
  
  .producto-acciones {
    padding: 0.75rem 1rem; /* var(--spacing-medium) */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .action-button {
    padding: 0.5rem 1rem; /* var(--spacing-small) var(--spacing-medium) */
    border-radius: 4px; /* var(--border-radius-small) */
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
    color: #495057; /* var(--text-color) */
    font-size: 0.9rem;
  }
  
  .action-button:hover {
    background-color: #e9ecef; /* var(--background-color-hover-light) */
    border-color: #ced4da;
  }
  
  .action-button.edit {
    background-color: #4CAF50; /* var(--primary-color) */
    color: white;
  }
  
  .action-button.edit:hover {
    background-color: #45a049;
  }
  
  .action-button.delete {
    background-color: #dc3545; /* var(--danger-color) */
    color: white;
  }
  
  .action-button.delete:hover {
    background-color: #c82333;
  } 
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .producto-acciones {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
  </style>