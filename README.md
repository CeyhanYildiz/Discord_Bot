# Alune-Bot

**Alune-Bot** is a versatile Discord bot written in **JavaScript** and hosted on a **PYNQ-Z2 FPGA** board. It features a point-based reward system where users can earn, gamble, and redeem points for real and in-server rewards using slash commands.  

![Demo](Discord.gif)


---

##  Overview

Created by **Ceyhan Yildiz**, Alune-Bot is designed for **fun, engagement, and moderation** within a Discord server. Features include:

- Daily reward claiming (`/claim`)  
- Custom shop system with redeemable items  
- Roulette gambling with daily limits (`/roulette`)  
- Admin-only point management (`/addpoints`)  
- Anti-abuse mechanics to ensure fairness  

---

##  Features

| Command      | Description                                      |
|--------------|--------------------------------------------------|
| `/claim`     | Claim your daily points every 24 hours           |
| `/wallet`    | Check your current point balance                 |
| `/shop`      | List available shop items                        |
| `/buy`       | Purchase an item from the shop by index          |
| `/roulette`  | Gamble points (up to 5 times per day, max 250 points per bet) |
| `/addpoints` | Admin-only command to grant points to a user     |

---

##  Shop Catalog

Redeem points using `/buy [item]`.  

| Index | Item                 | Points |
|-------|----------------------|--------|
| 1     | Custom Role 🛡️       | 300    |
| 2     | Custom Command ⚔️    | 350    |
| 3     | Host an Event 🎉      | 500    |
| 4     | Classic Nitro 🎇      | 700    |
| 5     | Full Nitro 🚀         | 1100   |
| 6     | $10 Wallet Voucher 💸 | 1200   |
| 7     | $25 Game Credit 🎮    | 3000   |
| 8     | $60 Game Credit 💰    | 6000   |

---

##  Anti-Abuse Protection

To ensure fairness:

- `/roulette` can only be used **5 times per day**  
- Maximum bet per spin is **250 points**  
- Daily roulette count resets automatically  

This prevents rapid farming and balances point flow.

---

##  Hosting with PYNQ-Z2

The bot is hosted on a **PYNQ-Z2 FPGA** board with a custom boot application:

1. On startup, a Python script launches the Node.js bot  
2. The bot connects to Discord and begins handling commands  
3. Optional: Use `pm2` or `systemd` for automatic restarts  

---

##  Getting Started

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
DISCORD_TOKEN=your-bot-token-here
````

Install dependencies:

```bash
npm install discord.js dotenv sqlite3
```

Add `.env` to `.gitignore`:

```gitignore
.env
```

---

### 2. Basic Bot Initialization

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

### 3. Slash Command Registration

**deploy-commands.js**

```js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  { name: 'claim', description: 'Claim your daily points.' },
  { name: 'wallet', description: 'Check your points balance.' },
  { name: 'shop', description: 'View available shop items.' },
  { name: 'buy', description: 'Purchase an item from the shop.' },
  { name: 'roulette', description: 'Play a roulette game to gamble points.' },
  { name: 'addpoints', description: 'Add points to a user (admin only).' }
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

---


##  Tech Stack

* **JavaScript**
* **Node.js** & **discord.js**
* **dotenv** for secure environment config
* **sqlite3** for persistent point tracking
* **PYNQ-Z2 FPGA** as custom host
* **PM2** or **systemd** for process management

---


##  Contact

For feature requests or bug reports, contact **cey_with_a_j** on Discord.
