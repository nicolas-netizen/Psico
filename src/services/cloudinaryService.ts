import axios from 'axios';

const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

export const uploadImage = async (file: File): Promise<CloudinaryResponse> => {
  try {
    console.log('Iniciando carga de imagen a Cloudinary');
    console.log('Cloud name:', CLOUDINARY_CLOUD_NAME);
    console.log('Upload preset:', CLOUDINARY_UPLOAD_PRESET);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log('URL de carga:', uploadUrl);

    const response = await axios.post(
      uploadUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log(`Progreso de carga: ${percentCompleted}%`);
        },
      }
    );

    console.log('Respuesta de Cloudinary:', response.data);

    if (!response.data || !response.data.secure_url) {
      console.error('Error: No se recibió una URL válida');
      console.error('Respuesta completa:', response);
      throw new Error('No se recibió una URL válida de Cloudinary');
    }

    return {
      secure_url: response.data.secure_url,
      public_id: response.data.public_id,
    };
  } catch (error: any) {
    console.error('Error al subir imagen a Cloudinary:', error);
    
    if (error.response) {
      console.error('Estado de la respuesta:', error.response.status);
      console.error('Datos de la respuesta:', error.response.data);
      console.error('Cabeceras de la respuesta:', error.response.headers);
      
      const errorMessage = error.response.data.error?.message || 
                          error.response.data.message || 
                          'Error desconocido';
      
      throw new Error(`Error al subir la imagen: ${errorMessage}`);
    } else if (error.request) {
      console.error('No se recibió respuesta:', error.request);
      throw new Error('No se recibió respuesta del servidor');
    } else {
      console.error('Error de configuración:', error.message);
      throw new Error(`Error de configuración: ${error.message}`);
    }
  }
};

export const optimizeImageUrl = (url: string, width: number = 500): string => {
  if (!url) return url;
  
  // Agregar transformaciones de Cloudinary
  const transformations = [
    'f_auto', // formato automático
    'q_auto', // calidad automática
    `w_${width}`, // ancho específico
    'c_limit' // mantener aspecto
  ].join(',');
  
  return url.replace('/upload/', `/upload/${transformations}/`);
};

export const addWatermark = (url: string, watermarkText: string): string => {
  if (!url) return url;
  
  // Configuración de la marca de agua
  const transformations = [
    'l_text:Arial_30:' + encodeURIComponent(watermarkText),
    'co_rgb:FFFFFF',
    'o_50',
    'g_south_east',
    'x_10',
    'y_10'
  ].join(',');
  
  return url.replace('/upload/', `/upload/${transformations}/`);
};
