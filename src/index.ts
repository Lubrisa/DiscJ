import 'dotenv/config';
import {Client, GatewayIntentBits, Message} from 'discord.js';
import DiscJ, {type DiscJCommand} from './bot/DiscJ';
import YoutubeVideoRepository from "./repositories/YoutubeVideoRepository";
import {youtube} from "googleapis/build/src/apis/youtube";

const BOT_PREFIX = '!dj';
const OPTION_PREFIX = '--';
const YT_V3_API_KEY = process.env.YT_API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!YT_V3_API_KEY) {
    throw new Error('YouTube API key is not defined in environment variables.');
} else if (!DISCORD_TOKEN) {
    throw new Error('Discord token is not defined in environment variables.');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const groupMessageContent = (content: string[]) => {
    return content.reduce((groups, piece) => {
        if (piece.startsWith(OPTION_PREFIX)) {
            groups.options.push(piece.slice(OPTION_PREFIX.length));
        } else {
            groups.args.push(piece);
        }
        return groups;
    }, {args: [] as string[], options: [] as string[]});
};

const getYoutubeRepository = (() => {
    let repository: YoutubeVideoRepository | null = null;
    return () => {
        if (!repository) {
            const youtubeService = youtube({
                version: 'v3',
                auth: YT_V3_API_KEY,
            });
            repository = new YoutubeVideoRepository(youtubeService);
        }
        return repository;
    };
})();

const getDiscJBot = (() => {
    let bot: DiscJ | null = null;
    return () => {
        if (!bot) {
            bot = new DiscJ(getYoutubeRepository());
        }
        return bot;
    };
})();

// client.on('messageCreate', async (message: Message) => {
//     if (message.author.bot || !message.guild) return;
//     if (!message.content.startsWith(BOT_PREFIX)) return;

//     const [_, command, ...rest] = message.content.split(' ');
//     console.log(command, rest);
//     const commandLower = command.toLowerCase() as DiscJCommand;

//     if (!commandLower) {
//         return message.reply('Comando desconhecido.');
//     }

//     const {args, options} = groupMessageContent(rest);
//     console.log('Args:', args);
//     console.log('Options:', options);
//     return getDiscJBot().do(message, commandLower, args, options);
// });

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || !interaction.guild) return;

    const bot = getDiscJBot();

    // @ts-ignore
    const member = interaction.member;
    // @ts-ignore
    const voiceChannel = member?.voice?.channel;

    try {
        switch (interaction.commandName) {
            case 'play': {
                const query = interaction.options.getString('query', true);
                const force = interaction.options.getBoolean('force') ?? false;
                if (!voiceChannel) {
                    await interaction.reply({ content: 'Você precisa estar em um canal de voz para usar este comando.', ephemeral: true });
                    return;
                }
                await interaction.deferReply();
                const msg = await bot['play'](
                    interaction as any,
                    [query],
                    force ? ['--force'] : []
                );
                await interaction.editReply({ content: msg.content ?? 'Comando executado.' });
                break;
            }
            case 'show-queue':
            case 'help':
            case 'clear-queue':
            case 'next':
            case 'previous':
            case 'stop':
            case 'pause':
            case 'resume':
            case 'set-volume':
            case 'get-volume': {
                await interaction.deferReply();
                let msg;
                switch (interaction.commandName) {
                    case 'show-queue':
                        msg = await bot['listQueue'](interaction as any, [], []);
                        break;
                    case 'help':
                        const command = interaction.options.getString('command');
                        msg = await bot['help'](interaction as any, command ? [command] : [], []);
                        break;
                    case 'clear-queue':
                        msg = await bot['clearQueue'](interaction as any, [], []);
                        break;
                    case 'next':
                        msg = await bot['next'](interaction as any, [], []);
                        break;
                    case 'previous':
                        msg = await bot['previous'](interaction as any, [], []);
                        break;
                    case 'stop':
                        msg = await bot['stop'](interaction as any, []);
                        break;
                    case 'pause':
                        msg = await bot['pause'](interaction as any, [], []);
                        break;
                    case 'resume':
                        msg = await bot['resume'](interaction as any, [], []);
                        break;
                    case 'set-volume':
                        const volume = interaction.options.getInteger('volume', true);
                        msg = await bot['setVolume'](interaction as any, [volume.toString()], []);
                        break;
                    case 'get-volume':
                        msg = await bot['getVolume'](interaction as any, [], []);
                        break;
                }
                await interaction.editReply({ content: msg.content ?? 'Comando executado.', embeds: msg.embeds ?? [] });
                break;
            }
            default:
                await interaction.reply({ content: 'Comando desconhecido.', ephemeral: true });
        }
    } catch (err) {
        console.error(err);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'Erro ao executar o comando.' });
        } else {
            await interaction.reply({ content: 'Erro ao executar o comando.', ephemeral: true });
        }
    }
});

client.once('ready', () => {
    console.log(`Logado como ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Conectado ao Discord'))
    .catch(console.error);