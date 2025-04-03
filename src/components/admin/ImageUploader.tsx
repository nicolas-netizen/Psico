import React, { useState } from 'react';
import { uploadImage } from '../../utils/imageUtils';
import { toast } from 'react-hot-toast';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  folder: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded, folder }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadImage(file, folder);
      onImageUploaded(result.secure_url);
      toast.success('Imagen subida exitosamente');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="cursor-pointer bg-[#91c26a] text-white px-4 py-2 rounded-lg hover:bg-[#7ea756] transition-colors">
        {uploading ? 'Subiendo...' : 'Subir Imagen'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  );
};

export default ImageUploader;
