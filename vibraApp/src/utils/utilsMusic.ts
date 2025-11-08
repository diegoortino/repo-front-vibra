import { type Song, type YouTubeSearchResult,type SmartSearchResponse, MusicGenre } from '../types';

export const youtobeToSong = (song: YouTubeSearchResult): Song => ({
  id: song.id,
  title: song.title,
  artist: song.channelTitle,
  youtubeId: song.id,
  duration: Number(song.duration) ?? 0,
  genre: MusicGenre.OTHER,
  viewCount: 0,
  publishedAt: song.publishedAt,
  cloudinaryUrl: "",
  createdAt: song.publishedAt,
  updatedAt: "",
});
export const normalizeToSong= (results:SmartSearchResponse) =>{
  let buffer= results.fromDatabase;
  if(Array.isArray(buffer))
    if (results.fromYoutube.length)
      buffer= buffer.concat(results.fromYoutube.map( (song)=> youtobeToSong(song)));
    else
      if (results.fromYoutube.length)
        buffer= results.fromYoutube.map( (song)=> youtobeToSong(song));
  return buffer;
}