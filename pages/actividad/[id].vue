<!-- pages/actividad/[id].vue -->
<template>
  <div>
    <h1>Administración de la Actividad</h1>
    <div v-if="activity">
      <p>Título: {{ activity.titulo }}</p>
      <p>Descripción: {{ activity.descripcion }}</p>
      <p>Fecha: {{ activity.fecha }}</p>
      <p v-if="isValidCode">Código de acceso válido: {{ accessCode }}</p>
      <p v-else>El código de acceso es incorrecto.</p>
    </div>
    <div v-else>
      <p>Cargando la actividad...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activity = ref(null);
const accessCode = ref('');
const isValidCode = ref(false);

onMounted(async () => {
  const { id, code } = route.params;

  // Lógica para obtener los detalles de la actividad desde la base de datos
  const response = await fetch(`/api/actividad/${id}`);
  const data = await response.json();
  activity.value = data.activity;

  // Validar el código de acceso
  const expectedCode = activity.value?.accessCode; // Suponiendo que el código está almacenado en la actividad
  isValidCode.value = code === expectedCode;
});
</script>