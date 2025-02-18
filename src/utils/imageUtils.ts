// Constantes para Cloudinary
const CLOUDINARY_FOLDER = 'memory-test'; // Ajusta esto según tu configuración

// Función para obtener imágenes aleatorias de Cloudinary
export const generateRandomImages = async (count: number): Promise<string[]> => {
  try {
    // Obtener la lista de imágenes disponibles en el folder de Cloudinary
    const response = await fetch(`/api/cloudinary/list?folder=${CLOUDINARY_FOLDER}`);
    const { resources } = await response.json();
    
    // Mezclar el array de recursos
    const shuffledResources = resources.sort(() => Math.random() - 0.5);
    
    // Tomar solo la cantidad necesaria de imágenes
    const selectedResources = shuffledResources.slice(0, count);
    
    // Retornar las URLs de las imágenes seleccionadas
    return selectedResources.map((resource: any) => resource.secure_url);
  } catch (error) {
    console.error('Error al obtener imágenes de Cloudinary:', error);
    // En caso de error, usar imágenes de respaldo
    return Array(count).fill('/images/fallback-image.png');
  }
};
