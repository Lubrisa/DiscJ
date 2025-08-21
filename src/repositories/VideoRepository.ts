import Video from "../queue/Video";

export default abstract class VideoRepository {
    public abstract getFirstMatch(query: string): Promise<Video | null>;
}