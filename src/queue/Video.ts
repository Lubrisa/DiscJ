import {EmbedBuilder} from "discord.js";

const BASE_YOUTUBE_URL = 'https://www.youtube.com'
const BASE_VIDEO_URL = 'https://www.youtube.com/watch';

export default class Video {
    public readonly id: string;
    public readonly title: string;

    public constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }

    public get url() {
        const params = new URLSearchParams({
            v: this.id,
        });
        return new URL(`${BASE_VIDEO_URL}?${params.toString()}`, BASE_YOUTUBE_URL);
    }

    public toString(): string {
        return `${this.title} (${this.id})`;
    }

    public toEmbed() {
        return new EmbedBuilder()
            .setTitle(this.title)
            .setURL(this.url.toString())
            .setDescription(`Watch on YouTube`)
            .setColor(0xff0000)
            .toJSON();
    }
}