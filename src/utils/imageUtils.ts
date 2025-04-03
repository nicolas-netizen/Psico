import { cloudinaryConfig } from '../config/cloudinary';

// Constantes para Cloudinary
export const CLOUDINARY_FOLDERS = {
  MEMORY: 'psico/memory',
  QUESTIONS: 'psico/questions',
  OPTIONS: 'psico/options',
  TESTS: 'psico/tests'
};

interface CloudinaryResource {
  secure_url: string;
  public_id: string;
}

// Función para obtener imágenes aleatorias de Cloudinary
export const generateRandomImages = async (count: number, folder: string = CLOUDINARY_FOLDERS.MEMORY): Promise<string[]> => {
  try {
    const resources = await getImagesFromFolder(folder);
    
    // Mezclar el array de recursos
    const shuffledResources = resources.sort(() => Math.random() - 0.5);
    
    // Tomar solo la cantidad necesaria de imágenes
    const selectedResources = shuffledResources.slice(0, count);
    
    // Retornar las URLs de las imágenes seleccionadas
    return selectedResources.map(resource => resource.secure_url);
  } catch (error) {
    console.error('Error al obtener imágenes de Cloudinary:', error);
    // En caso de error, usar imágenes de respaldo
    return Array(count).fill('/images/fallback-image.png');
  }
};

// Función para subir una imagen a Cloudinary
export const uploadImage = async (file: File, folder: string): Promise<CloudinaryResource> => {
  if (!cloudinaryConfig.uploadPreset) {
    throw new Error('No se ha configurado el upload preset de Cloudinary');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('cloud_name', cloudinaryConfig.cloudName);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Cloudinary:', errorData);
      throw new Error(errorData.error?.message || 'Error al subir la imagen a Cloudinary');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Función para eliminar una imagen de Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Cloudinary:', errorData);
      throw new Error(errorData.error?.message || 'Error al eliminar la imagen de Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Función para obtener imágenes de un folder específico
export const getImagesFromFolder = async (folder: string): Promise<CloudinaryResource[]> => {
  try {
    const response = await fetch(`/api/cloudinary/list?folder=${folder}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Cloudinary:', errorData);
      throw new Error(errorData.error?.message || 'Error al obtener las imágenes de Cloudinary');
    }

    const data = await response.json();
    return data.resources.map((resource: any) => ({
      secure_url: resource.secure_url,
      public_id: resource.public_id
    }));
  } catch (error) {
    console.error('Error getting images from Cloudinary:', error);
    throw error;
  }
};

// Función para optimizar URLs de Cloudinary
export const getOptimizedImageUrl = (url: string, options: { width?: number; height?: number; quality?: number } = {}) => {
  if (!url.includes('cloudinary')) {
    return url;
  }

  const transformation = [];
  
  if (options.width) {
    transformation.push(`w_${options.width}`);
  }
  if (options.height) {
    transformation.push(`h_${options.height}`);
  }
  if (options.quality) {
    transformation.push(`q_${options.quality}`);
  }

  // Add format and quality optimizations
  transformation.push('f_auto', 'q_auto');

  // Insert transformation parameters into the URL
  const baseUrl = url.split('/upload/')[0];
  const imagePath = url.split('/upload/')[1];
  return `${baseUrl}/upload/${transformation.join(',')}/${imagePath}`;
};
