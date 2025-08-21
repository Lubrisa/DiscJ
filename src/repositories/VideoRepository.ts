import Video from "../queue/Video";

export default abstract class VideoRepository {
    public abstract getFirstMatch(query: string): Promise<Video | null>;

    public abstract getFromURL(url: string): Promise<Video | null>;

    public abstract getPlaylistVideosFromURL(url: string): Promise<Video[]>;
}