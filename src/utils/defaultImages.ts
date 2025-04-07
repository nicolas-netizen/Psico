export const getDefaultProfileImage = (letter: string) => {
  // Retorna una URL de una imagen de perfil por defecto con la letra inicial
  return `https://ui-avatars.com/api/?name=${letter}&background=random&color=fff&size=128`;
};
