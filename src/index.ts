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

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(BOT_PREFIX)) return;

    const [_, command, ...rest] = message.content.split(' ');
    console.log(command, rest);
    const commandLower = command.toLowerCase() as DiscJCommand;

    if (!commandLower) {
        return message.reply('Comando desconhecido.');
    }

    const {args, options} = groupMessageContent(rest);
    console.log('Args:', args);
    console.log('Options:', options);
    return getDiscJBot().do(message, commandLower, args, options);
});

client.once('ready', () => {
    console.log(`Logado como ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Conectado ao Discord'))
    .catch(console.error);