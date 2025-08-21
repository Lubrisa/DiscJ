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

}