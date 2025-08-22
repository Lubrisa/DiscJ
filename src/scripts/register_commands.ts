import { REST, Routes } from 'discord.js';
import { commands } from '../bot/Commands';
import 'dotenv/config';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Registrando slash commands...');

        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands },
            );
            console.log('Comandos registrados no servidor de teste.');
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commands },
            );
            console.log('Comandos registrados globalmente.');
        }
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
})();