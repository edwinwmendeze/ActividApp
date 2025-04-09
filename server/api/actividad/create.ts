import { getServerSupabaseClient } from '~/server/utils/supabase';
import QRCode from 'qrcode';

// Definimos una interfaz para la actividad que estamos creando
interface ActivityData {
  titulo: string;
  descripcion: string;
  fecha: string;
}

interface ActivityInsertResponse {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
}

interface ResponseData {
  qrCode: string;
  redirectUrl: string;
  accessCode: string;
}

const generateAccessCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default defineEventHandler(async (event): Promise<{ data: ResponseData } | void> => {
  const supabase = getServerSupabaseClient();
  const body: ActivityData = await readBody(event);

  console.log('Recibido cuerpo:', body);

  const { titulo, descripcion, fecha } = body;

  if (!titulo || !descripcion || !fecha) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Faltan datos requeridos' }));
  }

  try {
    // Hacemos la inserción en la base de datos
    const { data, error } = await supabase
      .from('actividades')
      .insert([{ titulo, descripcion, fecha }])
      .select(); // Esto asegura que obtenemos la respuesta correctamente

    // Verificamos si hubo un error o si no se recibieron datos
    if (error || !data || data.length === 0) {
      console.error('Error al insertar en la base de datos:', error);
      return sendError(event, createError({ statusCode: 500, statusMessage: 'No se recibió respuesta de la base de datos' }));
    }

    // Usamos una aserción de tipo para manejar el resultado
    const insertedActivity = data[0] as ActivityInsertResponse;
    
    // Generamos el código QR
    const activityId = insertedActivity.id;
    const accessCode = generateAccessCode();
    const qrUrl = `http://localhost:3000/actividad/${activityId}?code=${accessCode}`;

    const qrCode = await QRCode.toDataURL(qrUrl);

    // Devolvemos la respuesta con los datos requeridos
    return {
      data: {
        qrCode,
        redirectUrl: qrUrl,
        accessCode,
      },
    };
  } catch (error) {
    console.error('Error interno al procesar la solicitud:', error);
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Error al crear la actividad' }));
  }
});