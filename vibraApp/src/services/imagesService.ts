// services/imagesService.ts
import { apiClient } from "./api/axiosInstance";
import type { Image } from "../types/images.types";

type ImagesForPlaybackResponse = {
  success: boolean;
  data: Image[];
  breakdown: {
    totalImages: number;
    durationSeconds: number;
    currentImages: number;
    distribution: Record<string, any>;
  };
};

export const imagesService = {
  /**
   * GET /images/for-playback
   */
  getImagesForPlayback: async (
    genre: string,
    duration: number
  ): Promise<Image[]> => {
    const response = await apiClient.get<ImagesForPlaybackResponse>(
      "/images/for-playback",
      {
        params: { genre, duration },
      }
    );

    console.log(
      "[API Response]",
      response.status,
      response.config.url,
      response.data
    );

    // 👇 devolvés SOLO el array de imágenes
    return response.data.data;
  },
};

export default imagesService;
