# Alune-Bot

**Alune-Bot** is a custom-built Discord bot developed in JavaScript and hosted on a PYNQ-Z2 FPGA board. It features an interactive points-based reward system, allowing users to earn, gamble, and redeem points for real and virtual rewards.

---

## About the Project

Developed by **Ceyhan Yildiz**, this bot serves a Discord community with fun and functionality. It provides daily rewards, a virtual shop, and moderation tools—all integrated into a smooth user experience.

---

## Features

- Daily reward claiming (`/claim`)
- Points gambling with roulette (`/roulette`)
- Shop system with real prize redemptions (`/shop`, `/buy`)
- Custom role and command purchases
- Admin support for manual point distribution (`/addpoints`)

---

## Command List

| Command      | Description                                      |
|--------------|--------------------------------------------------|
| `/claim`     | Claim your daily points every 24 hours           |
| `/wallet`    | View your current point balance                  |
| `/shop`      | List all available shop items                    |
| `/buy`       | Redeem points for a shop item using an index     |
| `/roulette`  | Gamble points in a roulette game (5/day limit)   |
| `/addpoints` | Admin-only: Grant points to a user               |

---
![Screenshot 2025-05-26 222026](https://github.com/user-attachments/assets/1ccdaa90-39ff-448c-b6f6-2b444c376cac)

## Shop Catalog

Users can redeem points for rewards using the `/buy [index]` command.

| Index | Item                   | Cost (Points) |
|-------|------------------------|----------------|
| 1     | Custom Role            | 300            |
| 2     | Custom Command         | 350            |
| 3     | Host an Event          | 500            |
| 4     | Classic Nitro          | 700            |
| 5     | Full Nitro             | 1100           |
| 6     | $10 Wallet Voucher     | 1200           |
| 7     | $25 Game Credit        | 3000           |
| 8     | $60 Game Credit        | 6000           |

---
![Screenshot 2025-05-26 221843](https://github.com/user-attachments/assets/54dbddbe-4190-452c-b1f3-dc97a9a094e4)

## Hosting Architecture

The bot is hosted on a **PYNQ-Z2** board and is automatically initialized at startup using a lightweight Python application and a process manager.

### Boot Process

1. PYNQ-Z2 powers on and launches the host application.
2. Python script configures the environment and services.
3. The Discord bot is launched via PM2 or systemd.
4. The bot connects to Discord and begins handling commands.

---

## Technology Stack

- **JavaScript** (Discord bot logic)
- **Node.js** with **Discord.js**
- **Python** (startup automation)
- **PYNQ-Z2 FPGA board** (hosting)
- **PM2** or **systemd** (process management)

---

## Contribution & Feedback

Currently a personal project, but open to collaboration or feature suggestions.  
For inquiries, reach out to **Cey with a J** directly on Discord.
