/**
 * Barrel export para tipos
 *
 * Este archivo re-exporta todos los tipos desde un solo lugar.
 * En lugar de hacer múltiples imports:
 *   import { Song } from '../types/music.types';
 *   import { Playlist } from '../types/playlist.types';
 *
 * Puedes hacer un solo import:
 *   import { Song, Playlist } from '../types';
 */

// Tipos de imágenes
export type { Image } from './images.types';

// Tipos de música
export type {
  Song,
  YouTubeSearchResult,
  SearchParams,
  PaginationParams,
  CreateSongDto,
  UpdateSongDto,
  SmartSearchResponse,
  PlaySongResponse,
} from './music.types';

export { MusicGenre } from './music.types';

// Tipos de playlists
export type {
  Playlist,
  PlaylistSong,
  PlaylistWithSongs,
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddSongToPlaylistDto,
  ReorderPlaylistSongsDto,
  AddSongResponse,
  RemoveSongResponse,
  PlaylistFilterParams,
  PlaylistStats,
} from './playlist.types';

// Tipos generales de API
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  SortParams,
  LoadingState,
  MutationState,
  CountResponse,
  HttpMethod,
  HttpHeaders,
  RequestConfig,
  SuccessCallback,
  ErrorCallback,
  UseDataOptions,
  ResponseMetadata,
} from './api.types';
