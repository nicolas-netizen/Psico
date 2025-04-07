import { useState, useEffect } from 'react';

interface ImageLoaderOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useImageLoader = (
  src: string,
  options: ImageLoaderOptions = {}
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');

  useEffect(() => {
    const img = new Image();
    let observer: IntersectionObserver;
    let isIntersecting = false;

    const loadImage = () => {
      img.src = src;
      img.onload = () => {
        setIsLoaded(true);
        setImageSrc(src);
      };
      img.onerror = () => {
        setError(new Error(`Failed to load image: ${src}`));
      };
    };

    // Configurar IntersectionObserver para lazy loading
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            loadImage();
            observer.unobserve(img);
          }
        },
        {
          threshold: options.threshold || 0,
          rootMargin: options.rootMargin || '50px',
        }
      );

      observer.observe(img);
    } else {
      // Fallback para navegadores que no soportan IntersectionObserver
      loadImage();
    }

    return () => {
      if (observer && img) {
        observer.unobserve(img);
      }
    };
  }, [src, options.threshold, options.rootMargin]);

  return {
    isLoaded,
    error,
    imageSrc,
  };
};

// Componente de imagen optimizada
import React from 'react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  threshold,
  rootMargin,
  ...props
}) => {
  const { isLoaded, error, imageSrc } = useImageLoader(src, { threshold, rootMargin });

  if (error) {
    return <div>Error loading image</div>;
  }

  return (
    <img
      src={isLoaded ? imageSrc : placeholder}
      alt={alt}
      {...props}
      style={{
        ...props.style,
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0.5,
      }}
    />
  );
};
