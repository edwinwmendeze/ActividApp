// composables/useActivity.ts
import { ref } from 'vue';

// Definir la interfaz para la tabla 'actividades'
interface Actividad {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  // Añade más campos según necesites
}

export function useActivity() {
  const errorMessage = ref('');

  const createActivity = async (data: { titulo: string; descripcion: string; fecha: string }) => {
    const { titulo, descripcion, fecha } = data;
    
    // Obtener el cliente de Supabase usando el composable proporcionado por Nuxt
    const client = useSupabaseClient<{
      'actividades': Actividad
    }>();

    const { data: activity, error } = await client
      .from('actividades')
      .insert([
        {
          titulo,
          descripcion,
          fecha,
        },
      ]);

    if (error) {
      errorMessage.value = 'Error al crear la actividad: ' + error.message;
      throw new Error(error.message);
    }

    return activity;
  };

  return {
    createActivity,
    errorMessage,
  };
}