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
    | 'show-queue'
    | 'help';

const commandToDescription = new Map<DiscJCommand, string>()
    .set('play', [
        'Comando: play <busca no YouTube> [--force]',
        'Descrição: Toca um vídeo do YouTube no canal de voz. Se algum vídeo já estiver tocando, adiciona o vídeo na fila',
        'Parâmetros:',
        '- `<busca no YouTube>`: Uma sequência de palavras para buscar no YouTube',
        'Opções:',
        '- force: Se a fila estiver vazia, não faz nada. Caso contrário, força o vídeo a tocar imediatamente, movendo todos os outros vídeos para a frente (o vídeo tocando atualmente será tocado depois)',
        'Exemplo: !dj play Toxicity System of a Down',
    ].join('\n'))
    .set('pause', [
        'Comando: pause',
        'Descrição: Se algum vídeo estiver tocando, pausa a reprodução. Caso contrário, não faz nada',
        'Exemplo: !dj pause',
    ].join('\n'))
    .set('stop', [
        'Comando: stop',
        'Descrição: Para a reprodução de vídeos, limpa a fila e sai do canal de voz',
        'Exemplo: !dj stop',
    ].join('\n'))
    .set('next', [
        'Comando: next',
        'Descrição: Toca o próximo vídeo na fila. Se não houver próximo vídeo, não faz nada',
        'Exemplo: !dj next',
    ].join('\n'))
    .set('previous', [
        'Comando: previous',
        'Descrição: Toca o vídeo anterior na fila. Se não houver vídeo anterior, não faz nada',
        'Exemplo: !dj previous',
    ].join('\n'))
    .set('set-volume', [
        'Comando: set-volume <0..100>',
        'Descrição: Ajusta o volume do player. O volume deve ser um número entre 0 e 100',
        'Exemplo: !dj set-volume 50',
    ].join('\n'))
    .set('get-volume', [
        'Comando: get-volume',
        'Descrição: Retorna o volume atual do player',
        'Exemplo: !dj get-volume',
    ].join('\n'))
    .set('show-queue', [
        'Comando: list-queue',
        'Descrição: Lista os vídeos na fila. Se a fila estiver vazia, retorna uma mensagem informando',
        'Exemplo: !dj list-queue',
    ].join('\n'))
    .set('clear-queue', [
        'Comando: clear-queue',
        'Descrição: Limpa a fila de vídeos',
        'Exemplo: !dj clear-queue',
    ].join('\n'))
    .set('help', [
        'Comando: help [comando]',
        'Descrição: Retorna a descrição do comando especificado. Se nenhum comando for especificado, retorna a lista de todos os comandos disponíveis',
        'Parâmetros:',
        ' - comando: O nome do comando para o qual se deseja ver a descrição',
        'Exemplo: !dj help play',
    ].join('\n'));

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
            ['show-queue', this.listQueue.bind(this)],
            ['help', this.help.bind(this)],
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

    private async help(message: Message, args: string[], options: string[]): Promise<Message> {
        const [command] = args;

        if (!command) {
            return message.reply(
                Array.from(commandToDescription.values())
                    .join('\n\n'));
        } else {
            const description = commandToDescription.get(command as DiscJCommand);
            if (!description) {
                return message.reply(`Comando desconhecido: ${command}`);
            }
            return message.reply(description);
        }
    }
}