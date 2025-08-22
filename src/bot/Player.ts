import {
    AudioPlayer,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    demuxProbe,
    NoSubscriberBehavior,
    VoiceConnection
} from "@discordjs/voice";
import ytdl from '@distube/ytdl-core';

export default class Player {
    private audioPlayer: AudioPlayer;
    private audioResource: AudioResource | null = null;
    private volume: number = 100;

    public constructor(volume: number = 100) {
        this.audioPlayer = createAudioPlayer({
            behaviors: {noSubscriber: NoSubscriberBehavior.Pause},
        });
        this.setVolume(volume);
    }

    public get isPlaying() {
        return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
    }

    public addErrorHandler(handler: (error: any) => void): Player {
        this.audioPlayer.on('error', handler);

        return this;
    }

    public addStateChangeHandler(audioPlayerStatus: AudioPlayerStatus, handler: () => void): Player {
        this.audioPlayer.on(audioPlayerStatus, handler);
        return this;
    }

    public setVolume(volume: number): Player {
        if (volume < 0 || volume > 100) {
            throw new Error('Volume deve estar entre 0 e 100.');
        }

        this.volume = volume;
        this.audioResource?.volume?.setVolume(volume / 100);

        return this;
    }

    public getVolume() {
        return this.volume;
    }

    public async play(url: string) {
        if (!ytdl.validateURL(url)) {
            throw new Error('The provided URL is not a valid YouTube URL.');
        }

        const ytdlstream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0
        })

        const {stream, type} = await demuxProbe(ytdlstream);

        this.audioResource = createAudioResource(stream, {
            inputType: type,
            inlineVolume: true
        });
        this.audioResource.volume?.setVolume(this.volume / 100);
        this.audioPlayer.play(this.audioResource);
    }

    public pause() {
        return this.audioPlayer.pause();
    }

    public resume() {
        return this.audioPlayer.unpause();
    }

    public stop() {
        this.audioPlayer.stop(true);
        this.audioResource = null;
    }

    public playOn(voiceConnection: VoiceConnection) {
        voiceConnection.subscribe(this.audioPlayer);
    }
}