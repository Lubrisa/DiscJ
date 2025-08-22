import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';

/**
 * Exporta um array de comandos de barra (slash commands) para registrar no Discord.
 * Adicione ou ajuste comandos conforme necessário para corresponder aos comandos de texto do bot.
 */
export const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Toca um vídeo do YouTube no canal de voz.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Busca no YouTube ou URL do vídeo')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('force')
                .setDescription('Força o vídeo a tocar imediatamente')),

    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausa a reprodução atual.'),

    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Retoma a reprodução se estiver pausada.'),

    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Para a reprodução, limpa a fila e sai do canal de voz.'),

    new SlashCommandBuilder()
        .setName('next')
        .setDescription('Toca o próximo vídeo na fila.'),

    new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Toca o vídeo anterior na fila.'),

    new SlashCommandBuilder()
        .setName('set-volume')
        .setDescription('Ajusta o volume do player (0 a 100).')
        .addIntegerOption(option =>
            option.setName('volume')
                .setDescription('Volume entre 0 e 100')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('get-volume')
        .setDescription('Mostra o volume atual do player.'),

    new SlashCommandBuilder()
        .setName('show-queue')
        .setDescription('Lista os vídeos na fila.'),

    new SlashCommandBuilder()
        .setName('clear-queue')
        .setDescription('Limpa a fila de vídeos.'),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Mostra a lista de comandos ou ajuda de um comando específico.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Nome do comando para obter ajuda')),
].map(cmd => cmd.toJSON());