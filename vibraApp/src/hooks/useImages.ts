// useImages.ts
import { useState, useCallback } from "react";
import { imagesService } from "../services/imagesService";
import { getErrorMessage } from "../utils/errorHandler";
import type { Image } from "../types/images.types";

interface UseImagesState {
  images: Image[];
  loading: boolean;
  error: string | null;
}

export function useImages() {
  const [state, setState] = useState<UseImagesState>({
    images: [],
    loading: false,
    error: null,
  });

  const resetImages = useCallback(() => {
        setState((prev) => ({
            ...prev,
            images: [],
            loading: false,
            error: null,
        }));
    }, []);

  const fetchImages = useCallback(async (genre: string, duration: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const images = await imagesService.getImagesForPlayback(genre, duration);
      console.log(
        "[useImages] imágenes recibidas (length):",
        images.length,
        images
      );

      setState({
        images,
        loading: false,
        error: null,
      });

      return images;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("[useImages] error:", errorMessage);
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      return [];
    }
  }, []);

  return {
    images: state.images,
    loading: state.loading,
    error: state.error,
    fetchImages,
    resetImages,
  };
}

export default useImages;
