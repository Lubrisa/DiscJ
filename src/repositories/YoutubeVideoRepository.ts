import Video from "../queue/Video";
import VideoRepository from "./VideoRepository";
import {youtube_v3} from "googleapis";
import Youtube = youtube_v3.Youtube;


export default class YoutubeVideoRepository extends VideoRepository {
    private readonly youtubeService: Youtube;

    public constructor(youtubeService: Youtube) {
        super();
        this.youtubeService = youtubeService;
    }

    public async getFirstMatch(query: string): Promise<Video | null> {
        const res = await this.youtubeService.search.list({
            part: ['id', 'snippet'],
            q: query,
            maxResults: 1,
            type: ['video']
        });

        const items = res.data.items ?? [];
        if (items.length === 0) return null;

        const firstItem = items[0];
        const firstItemId = firstItem.id?.videoId;
        if (!firstItemId) return null;

        return new Video(firstItemId, firstItem.snippet?.title ?? 'Sem título');
    }

    public async getFromURL(url: string): Promise<Video | null> {
        const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch || videoIdMatch.length < 2) return null;
        const videoId = videoIdMatch[1];

        const res = await this.youtubeService.videos.list({
            part: ['id', 'snippet'],
            id: [videoId],
            maxResults: 1
        });

        const items = res.data.items ?? [];
        if (items.length === 0) return null;

        const firstItem = items[0];
        return new Video(firstItem.id ?? videoId, firstItem.snippet?.title ?? 'Sem título');
    }

    public async getPlaylistVideosFromURL(url: string): Promise<Video[]> {
        const playlistIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:playlist\?list=|watch\?v=[^&]+&list=)([a-zA-Z0-9_-]+)/);
        if (!playlistIdMatch || playlistIdMatch.length < 2) return [];
        const playlistId = playlistIdMatch[1];

        const res = await this.youtubeService.playlistItems.list({
            part: ['id', 'snippet'],
            playlistId: playlistId,
            maxResults: 50
        });

        return res.data.items?.map(item => {
            return new Video(item.snippet?.resourceId?.videoId ?? '', item.snippet?.title ?? 'Sem título');
        }) || [];
    }
}