# Alune-Bot

**Alune-Bot** is a feature-rich Discord bot developed in JavaScript and hosted on a PYNQ-Z2 FPGA board. It powers a point-based reward system where users can earn, gamble, and redeem points for prizes using slash commands.

---

## 🧠 Overview

Created by **Ceyhan Yildiz**, Alune-Bot was designed for both entertainment and moderation within a Discord server. It includes:

- Daily reward claiming
- Custom shop system with real rewards
- Gambling with limits to prevent abuse
- Admin-only point management
- Anti-abuse mechanics for fairness

---

## 📦 Features

| Command      | Description                                      |
|--------------|--------------------------------------------------|
| `/claim`     | Claim your daily points every 24 hours           |
| `/wallet`    | View your current point balance                  |
| `/shop`      | List available shop items                        |
| `/buy`       | Purchase an item from the shop by index          |
| `/roulette`  | Gamble points (up to 5 times per day)            |
| `/addpoints` | Admin command to grant points to a user          |

---
![Screenshot 2025-05-26 222026](https://github.com/user-attachments/assets/8a74f777-74f8-403e-8e1a-dba29fc88315)

## 🛍️ Shop Catalog

Redeem points for items using `/buy [index]`.

| Index | Item                 | Points |
|-------|----------------------|--------|
| 1     | Custom Role          | 300    |
| 2     | Custom Command       | 350    |
| 3     | Host an Event        | 500    |
| 4     | Classic Nitro        | 700    |
| 5     | Full Nitro           | 1100   |
| 6     | $10 Wallet Voucher   | 1200   |
| 7     | $25 Game Credit      | 3000   |
| 8     | $60 Game Credit      | 6000   |

---
![Screenshot 2025-05-26 221843](https://github.com/user-attachments/assets/b66b7fda-69b6-4c6f-bd39-059aeb4d9c2d)

## 🎰 Anti-Abuse Protection

To ensure fairness and prevent users from rapidly farming high-reward items:

- You can only use `/roulette` **5 times per day**
- The **maximum bet is 250 points per spin**
- This system limits the impact of “lucky streaks” and balances point flow


---
![Screenshot 2025-05-26 222456](https://github.com/user-attachments/assets/6d7c35b4-e315-4769-a950-c5da5225b5e1)
## ⚙️ Hosting with PYNQ-Z2

The bot is hosted on a **PYNQ-Z2 FPGA** board with a custom boot application:

1. On startup, a Python script launches the Node.js bot
2. The bot connects to Discord and begins handling commands
3. Optional: Use `pm2` or `systemd` to ensure automatic restarts

---

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your-bot-token-here
````

Make sure to install dependencies:

```bash
npm install discord.js dotenv
```

And add `.env` to `.gitignore` to protect your token:

```gitignore
.env
```

---

### 2. Basic Bot Initialization

**index.js**

```js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
```

---

### 3. Slash Command Example

**Command Registration (deploy-commands.js)**

```js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands('YOUR_CLIENT_ID'),
      { body: commands }
    );
    console.log('Commands registered.');
  } catch (error) {
    console.error(error);
  }
})();
```

**Command Handler**

```js
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});
```

---

### 4. Suggested Folder Structure

```
alune-bot/
│
├── commands/
│   ├── ping.js
│   └── claim.js
│
├── events/
│   └── interactionCreate.js
│
├── utils/
│   └── shopData.js
│
├── .env
├── index.js
├── deploy-commands.js
├── package.json
└── README.md
```

---

## 🧰 Tech Stack

* **JavaScript**
* **Node.js** & **discord.js**
* **dotenv** for secure config
* **PYNQ-Z2 FPGA** as custom host
* **PM2** or **systemd** for auto-management

---

## 📬 Contact

Want to suggest features or report a bug? Contact **cey_with_a_j** on Discord.
