// DiscJ.ts
import {
    AudioPlayerStatus,
    entersState,
    joinVoiceChannel,
    type VoiceConnection,
    VoiceConnectionStatus,
} from '@discordjs/voice';
import {Message, type VoiceBasedChannel} from 'discord.js';
import Video from '../queue/Video';
import VideoQueue from "../queue/VideoQueue";
import Player from "./Player";
import VideoRepository from "../repositories/VideoRepository";

export type DiscJCommand =
    | 'play'
    | 'pause'
    | 'stop'
    | 'next'
    | 'previous'
    | 'set-volume'
    | 'get-volume'
    | 'dequeue'
    | 'clear-queue'
    | 'list-queue';

export type DiscJAction = (message: Message, args: string[], options: string[]) => Promise<Message>;
/**
 * DiscJ é um bot de música para Discord que permite tocar vídeos do YouTube em canais de voz.
 */
export default class DiscJ {
    private readonly commandToAction: Map<DiscJCommand, DiscJAction>;
    private isPlaying = false;
    private readonly queue: VideoQueue = new VideoQueue();

    private readonly videoRepository: VideoRepository;

    private voiceConnection?: VoiceConnection;
    private readonly player: Player;

    /**
     * Cria uma instância do bot DiscJ.
     *
     * @param {VideoRepository} videoRepository - Repositório de vídeos para buscar vídeos do YouTube.
     * @param {number} [volume=100] - Volume inicial do player (0 a 100).
     *
     * @throws {Error} Se o volume estiver fora do intervalo de 0 a 100.
     */
    public constructor(videoRepository: VideoRepository, volume: number = 100) {
        this.player = new Player(volume)
            .addErrorHandler(error => console.error('Erro no player:', error))
            .addStateChangeHandler(AudioPlayerStatus.Idle, () => {
                if (this.queue.hasNext) {
                    this.player.play(this.queue.next()!.url.toString())
                        .catch(console.error);
                } else {
                    this.isPlaying = false;
                    this.disposeVoiceConnection();
                }
            });
        this.videoRepository = videoRepository;
        this.commandToAction = new Map<DiscJCommand, DiscJAction>([
            ['play', this.play.bind(this)],
            ['pause', this.pause.bind(this)],
            ['stop', this.stop.bind(this)],
            ['next', this.next.bind(this)],
            ['previous', this.previous.bind(this)],
            ['set-volume', this.setVolume.bind(this)],
            ['get-volume', this.getVolume.bind(this)],
            ['list-queue', this.listQueue.bind(this)],
        ]);
    }

    // ---------- Dispatcher ----------
    public async do(message: Message, command: DiscJCommand, args: string[], options: string[]): Promise<Message> {
        const action = this.commandToAction.get(command);
        if (!action) {
            return message.reply(`Comando desconhecido: ${command}`);
        }

        try {
            return await action(message, args, options);
        } catch (e) {
            console.error(e);
            return message.reply('Ocorreu um erro ao executar o comando.');
        }
    }

    private async getVoiceConnection(voiceChannel: VoiceBasedChannel): Promise<VoiceConnection> {
        if (this.voiceConnection) {
            return this.voiceConnection;
        }

        const voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true,
        });

        await entersState(voiceConnection, VoiceConnectionStatus.Ready, 30_000);
        this.player.playOn(voiceConnection);
        this.voiceConnection = voiceConnection;
        return voiceConnection;
    }

    private disposeVoiceConnection() {
        if (this.voiceConnection) {
            try {
                this.voiceConnection.destroy();
            } catch (error) {
                console.log(`Error destroying connection: ${error}`);
            }
        }
        this.voiceConnection = undefined;
    }

    private async searchFirst(query: string): Promise<Video | null> {
        try {
            return this.videoRepository.getFirstMatch(query);
        } catch (e: any) {
            console.error('Erro na YouTube Data API:', e);
            throw new Error('Falha ao buscar no YouTube.');
        }
    }

    private async playTrack(video: Video): Promise<void> {
        await this.player.play(video.url.toString());
        this.isPlaying = true;
    }

    private async play(message: Message, args: string[], options: string[]): Promise<Message> {
        const query = args.join(' ');

        if (query.trim() === '') {
            return message.reply('Para usar este comando, digite: !play <busca no YouTube>');
        }

        const channel = message.member?.voice.channel;
        if (!channel) {
            return message.reply('Você precisa estar em um canal de voz para usar este comando.');
        }

        try {
            const video = await this.searchFirst(query);

            if (!video) {
                return message.reply('Nenhum resultado encontrado no YouTube.');
            }

            if (this.isPlaying && !options.includes('force')) {
                this.queue.add(video);
                return message.reply({
                    content: `Vídeo adicionado à fila: ${video.title}\n${video.url}`,
                    allowedMentions: {repliedUser: false},
                });
            } else if (!this.isPlaying) {
                this.queue.add(video).next();
            } else {

            }

            if (!this.isPlaying) {
                this.queue.next();
                await this.getVoiceConnection(channel);
                await this.playTrack(video);
                return message.reply({
                    content: `Tocando: ${video.title}\n${video.url}`,
                    allowedMentions: {repliedUser: false},
                });
            } else {
                return message.reply({
                    content: `Vídeo adicionado a fila: ${video.title}\n${video.url}`,
                });
            }
        } catch (e: any) {
            console.error('Erro ao buscar no YouTube:', e);
            return message.reply('Erro ao buscar no YouTube.');
        }
    }

    private async pause(message: Message, args: string[], options: string[]): Promise<Message> {
        if (this.player.pause()) {
            this.isPlaying = false;
            return message.reply('Pausado.');
        }
        return message.reply('Nada está tocando.');
    }

    private async stop(message: Message, args: string[]): Promise<Message> {
        this.queue.clear();
        this.isPlaying = false;
        try {
            this.player.stop();
        } catch (e: any) {
            console.error('Erro ao parar o player:', e);
        }

        this.disposeVoiceConnection();
        return message.reply('Parado e saí do canal de voz.');
    }

    private async next(message: Message, args: string[], options: string[]): Promise<Message> {
        if (!this.queue.hasNext) {
            return message.reply('Não há próxima música na fila.');
        }

        await this.playTrack(this.queue.next()!);
        return message;
    }

    private async previous(message: Message, args: string[], options: string[]): Promise<Message> {
        if (!this.queue.hasPrevious) {
            return message.reply('Não há música anterior.');
        }

        await this.playTrack(this.queue.previous()!);
        return message;
    }

    private async setVolume(message: Message, args: string[], options: string[]): Promise<Message> {
        const [volume] = args;

        if (!volume) {
            return message.reply('Para usar este comando, digite: !set-volume <0..100>');
        }

        const volumeNum = Number(volume);

        if (Number.isNaN(volumeNum)) {
            return message.reply('Volume inválido. Use um número entre 0 e 100.');
        }

        try {
            this.player.setVolume(volumeNum);
        } catch (e: any) {
            return message.reply(e.message);
        }

        return message.reply(`Volume ajustado para ${volumeNum}%.`);
    }

    private async getVolume(message: Message, args: string[], options: string[]): Promise<Message> {
        return message.reply(`Volume atual: ${this.player.getVolume()}%.`);
    }

    private async listQueue(message: Message, args: string[], options: string[]): Promise<Message> {
        if (this.queue.isEmpty) return message.reply('Fila vazia.');
        return message.reply({
            embeds: this.queue.historyToEmbeds(),
        });
    }
}