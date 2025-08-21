# DiscJ - Discord Music Bot

## 📜 About The Project

DiscJ is a simple Discord bot created with the goal of allowing friends to listen to YouTube videos (not just music)
simultaneously in a voice channel.

This project was developed as a personal learning opportunity, providing a chance to explore the TypeScript language,
the Node.js ecosystem, how to consume different APIs (Discord and YouTube), and how to build an interactive bot from
scratch.

## ✨ Key Features

* **Play YouTube Videos**: Simply use the `!dj play` command with a search term.
* **Playback Queue**: Add multiple videos to a queue to be played sequentially.
* **Playback Control**: Commands to skip, stop playback, and clear the queue.
* **View the Queue**: Check which videos are waiting to be played.
* **Built with TypeScript**: Modern, typed, and more maintainable code.

## 🛠️ Technologies Used

* [Node.js](https://nodejs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [Discord.js](https://discord.js.org/) - The main library for interacting with the Discord API.
* [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice) - For managing voice connections and audio
  playback.
* [@distube/ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core) - To fetch information and generate audio
  streams from YouTube videos.
* [Google API Client](https://github.com/googleapis/google-api-nodejs-client) - To interact with the YouTube Data API
  v3.

## ⚙️ Setup and Installation

Follow the steps below to run your own instance of DiscJ.

**Prerequisites:**

* Node.js (version 16.9.0 or higher)
* A Discord account and a server where you have permission to add bots.
* A Google Cloud account.

**1. Create a Discord Bot:**

* Go to the [Discord Developer Portal](https://discord.com/developers/applications).
* Click "New Application" and give your bot a name.
* Navigate to the "Bot" tab and click "Add Bot".
* Enable the "Privileged Gateway Intents": `SERVER MEMBERS INTENT` and `MESSAGE CONTENT INTENT`.
* Copy your bot's **token**. You will need it soon.

**2. Set up the YouTube Data API:**

* Go to the [Google Cloud Platform Console](https://console.cloud.google.com/).
* Create a new project.
* In the navigation menu, go to "APIs & Services" > "Library".
* Search for "YouTube Data API v3" and enable it for your project.
* Go to "APIs & Services" > "Credentials".
* Click "Create Credentials" > "API key".
* Copy the generated **API key**.

**3. Clone the Repository:**

```bash
git clone <your-repository-url>
cd <repository-name>
```

**4. Install Dependencies:**

```bash
npm install
```

**5. Configure Environment Variables:**

* Create a file named `.env` in the root of the project.
* Add the following variables:

   ```env
   DISCORD_TOKEN=YOUR_DISCORD_TOKEN_HERE
   CLIENT_ID=YOUR_BOT_CLIENT_ID_HERE
   GUILD_ID=YOUR_DISCORD_SERVER_ID_HERE
   YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
   ```

* You can find the `CLIENT_ID` on the "General Information" tab of your bot in the developer portal.
* To get the `GUILD_ID`, right-click your server icon in Discord and select "Copy Server ID" (you need to have Developer
  Mode enabled in your Discord settings).

**6. Compile the TypeScript Code:**

```bash
npm run build
```

**7. Start the Bot:**

```bash
npm start
```

If everything is correct, you will see a message in the console indicating that the bot is online.

## 🚀 Commands

All commands must be prefixed with `!dj`.

*TODO*

## License

Distributed under the MIT License. See LICENSE file for more information.

## ⚖️ Legal Disclaimer

This project is provided as-is for educational purposes only. It is a proof-of-concept demonstrating how to build a
Discord bot and interact with various APIs and libraries.

The user of this software (the person running their own instance of the bot) is solely responsible for their actions and
for complying with all applicable laws and terms of service of any platform they access through this bot, including but
not limited to YouTube's Terms of Service.

The developers of this project do not endorse piracy or copyright infringement. Users are expected to respect the rights
of content creators. This project is not affiliated with YouTube or Discord. By using this software, you agree to assume
all liability for your use of it.