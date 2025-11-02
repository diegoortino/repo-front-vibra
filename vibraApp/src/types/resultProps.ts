export interface ResultProps {
	id: string;
	title: string;
	artist: string;
	duration: string;
	plays: string;
	youtubeId?: string;
	cloudinaryUrl?: string;
	source?: 'database' | 'youtube';
}