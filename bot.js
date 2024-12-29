const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const { token, clientId, guildId } = require('./config.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize the database
const dbPath = path.join(__dirname, 'points.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the points database.');
});

// Update the database schema to track roulette plays
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        points INTEGER DEFAULT 0,
        last_claim INTEGER DEFAULT 0,
        roulette_count INTEGER DEFAULT 0,
        last_roulette_reset INTEGER DEFAULT 0
    )`
);

db.serialize(() => {
    db.run(`ALTER TABLE users ADD COLUMN roulette_count INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error("Error adding roulette_count column:", err.message);
        }
    });

    db.run(`ALTER TABLE users ADD COLUMN last_roulette_reset INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.error("Error adding last_roulette_reset column:", err.message);
        }
    });
});


const resetRouletteCountIfNeeded = async (userId) => {
    return new Promise((resolve, reject) => {
        const currentTime = Math.floor(Date.now() / 1000);
        const oneDay = 86400; // Seconds in a day

        db.get(
            `SELECT roulette_count, last_roulette_reset FROM users WHERE id = ?`,
            [userId],
            (err, row) => {
                if (err) return reject(err);

                if (!row || currentTime - row.last_roulette_reset >= oneDay) {
                    // Reset roulette count and last reset time
                    db.run(
                        `UPDATE users SET roulette_count = 0, last_roulette_reset = ? WHERE id = ?`,
                        [currentTime, userId],
                        (err) => {
                            if (err) return reject(err);
                            resolve(true);
                        }
                    );
                } else {
                    resolve(false);
                }
            }
        );
    });
};

// Update user data with roulette count
const incrementRouletteCount = async (userId) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE users SET roulette_count = roulette_count + 1 WHERE id = ?`,
            [userId],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
};


const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Helper functions
const getUserData = (userId) => {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT points, last_claim FROM users WHERE id = ?`,
            [userId],
            (err, row) => {
                if (err) reject(err);
                resolve(row || { points: 0, last_claim: 0 });
            }
        );
    });
};

const updateUserData = (userId, points, lastClaim = null) => {
    db.run(
        `INSERT INTO users (id, points, last_claim)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        points = points + ?,
        last_claim = COALESCE(?, last_claim)`,
        [userId, points, lastClaim, points, lastClaim]
    );
};

// Register slash commands
client.once('ready', async () => {
    console.log(`Bot is ready as ${client.user.tag}`);

    const commands = [
        {
            name: 'claim',
            description: 'Claim your daily points every 24 hours.',
        },
        {
            name: 'wallet',
            description: 'Check your points balance.',
        },
        {
            name: 'shop',
            description: 'View available items in the shop.',
        },
        {
            name: 'buy',
            description: 'Purchase an item from the shop.',
            options: [
                {
                    name: 'item',
                    description: 'The item index from the shop.',
                    type: 3, // Use type 3 for String since you're using string choices
                    required: true,
                    choices: [
                        { name: 'Custom Role -300', value: '1' },
                        { name: 'Custom Command -350', value: '2' },
                        { name: 'Host An Event -500', value: '3' },
                        { name: 'Classic Nitro -700', value: '4' },
                        { name: 'Full Nitro -1100', value: '5' },
                        { name: '10$ Wallet Voucher -1200', value: '6' },
                        { name: '25$ Game -3000', value: '7' },
                        { name: '60$ Game -6000', value: '8' },
                    ],
                },
            ],
        },
        {
            name: 'roulette',
            description: 'Play a roulette game to gamble points, 5 times a day.',
            options: [
                {
                    name: 'bet',
                    description: 'How much you want to bet?',
                    type: 4, // Integer
                    required: true,
                },
                {
                    name: 'space',
                    description: 'Choose the space to bet on.',
                    type: 3, // String
                    required: true,
                    choices: [
                        { name: 'Red', value: 'red' },
                        { name: 'Black', value: 'black' },
                        { name: 'Even', value: 'even' },
                        { name: 'Odd', value: 'odd' },
                        { name: '1-18', value: '1-18' },
                        { name: '19-36', value: '19-36' },
                        { name: 'Dozens (1-12)', value: '1-12' },
                        { name: 'Dozens (13-24)', value: '13-24' },
                        { name: 'Dozens (25-36)', value: '25-36' },
                        { name: 'Single Number', value: 'number' },
                    ],
                },
            ],
        },
        {
            name: 'addpoints',
            description: 'Add points to a specific user.',
            options: [
                {
                    name: 'target',
                    description: 'The user you want to add points to.',
                    type: 6, // User type
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount of points to add.',
                    type: 4, // Integer
                    required: true,
                },
            ],
        },
    ];

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log('Successfully registered application (/) commands.');
    } catch (err) {
        console.error(err);
    }
});

// Slash command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user } = interaction;
    const userId = user.id;
    if (commandName === 'claim') {
        const { points, last_claim } = await getUserData(userId);
        const currentTime = Math.floor(Date.now() / 1000);

        if (currentTime - last_claim < 86400) {
            const nextClaimTime = last_claim + 86400;
            await interaction.reply(`You already claimed your points. Come back at <t:${nextClaimTime}:R>.`);
        } else {
            updateUserData(userId, 10, currentTime);
            await interaction.reply(`You claimed 10 points! You now have ${points + 10} points.`);
        }
    }

    else if (commandName === 'wallet') {
        const { points } = await getUserData(userId);

        const embed = new EmbedBuilder()
            .setTitle(`Wallet Info for ${user.username}`)
            .setColor(0xFFA500)
            .setDescription(`💰 **Fire Points**: ${points} points`)
            .setThumbnail(user.displayAvatarURL());

        await interaction.reply({ embeds: [embed] });
    }

    else if (commandName === 'shop') {
        const embed = new EmbedBuilder()
            .setTitle('TMA SHOP!')
            .setDescription('🔥 Buy items by using the `/buy [item]` command.')
            .setColor(0xE0B0FF);

        const items = [
            { name: 'Custom Role 🛡️', cost: 300 },
            { name: 'Custom Command ⚔️', cost: 350 },
            { name: 'Host An Event 🎉', cost: 500 },
            { name: 'Classic Nitro 🎇', cost: 700 },
            { name: 'Full Nitro 🚀', cost: 1100 },
            { name: '10$ Wallet Voucher 💸', cost: 1200 },
            { name: '25$ Game 🎮', cost: 3000 },
            { name: '60$ Game 💰', cost: 6000 },
        ];

        items.forEach((item, index) => {
            embed.addFields({ name: ` ${item.name}`, value: `🔥 ${item.cost} points`, inline: true });
        });

        await interaction.reply({ embeds: [embed] });
    }

    else if (commandName === 'buy') {
        const itemName = options.getString('item');  // Get the item name as a string

        const items = [
            { name: 'Custom Role 🛡️', cost: 300 },
            { name: 'Custom Command ⚔️', cost: 350 },
            { name: 'Host An Event 🎉', cost: 500 },
            { name: 'Classic Nitro 🎇', cost: 700 },
            { name: 'Full Nitro 🚀', cost: 1100 },
            { name: '10$ Wallet Voucher 💸', cost: 1200 },
            { name: '25$ Game 🎮', cost: 3000 },
            { name: '60$ Game 💰', cost: 6000 },
        ];

        const itemIndex = parseInt(itemName, 10) - 1; // Convert the string to an index

        if (itemIndex < 0 || itemIndex >= items.length) {
            await interaction.reply('Invalid item index. Please check the shop and select a valid item.');
            return;
        }

        const { name, cost } = items[itemIndex];
        const { points } = await getUserData(userId);

        if (points < cost) {
            await interaction.reply(`You don't have enough points for this item. You need ${cost} points, but you only have ${points}.`);
        } else {
            updateUserData(userId, -cost);
            await interaction.reply(`You bought ${name} for ${cost} points!`);
        }
    }
    else if (commandName === 'roulette') {
        const betAmount = options.getInteger('bet');
        const space = options.getString('space');

        const { points, roulette_count, last_roulette_reset } = await new Promise((resolve, reject) => {
            db.get(
                `SELECT points, roulette_count, last_roulette_reset FROM users WHERE id = ?`,
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    const now = Math.floor(Date.now() / 1000);
                    // If the last reset was more than a day ago, reset the count
                    if (!row || now - (row.last_roulette_reset || 0) >= 86400) {
                        db.run(
                            `UPDATE users SET roulette_count = 0, last_roulette_reset = ? WHERE id = ?`,
                            [now, userId],
                            (updateErr) => {
                                if (updateErr) reject(updateErr);
                                resolve({ points: row?.points || 0, roulette_count: 0, last_roulette_reset: now });
                            }
                        );
                    } else {
                        resolve(row || { points: 0, roulette_count: 0, last_roulette_reset: now });
                    }
                }
            );
        });

        // Check if the user exceeded the daily limit
        if (roulette_count >= 5) {
            await interaction.reply(`You have reached your daily roulette limit of 5 plays. Come back tomorrow!`);
            return;
        }

        // Check for bet limits
        if (betAmount > 250) {
            await interaction.reply(`The maximum bet is 250 points.`);
            return;
        }

        if (points < betAmount) {
            await interaction.reply(`You don't have enough points to bet. You currently have ${points} points.`);
            return;
        }

        // Deduct points for the bet
        updateUserData(userId, -betAmount);

        // Simulate roulette spin
        const spinResult = Math.floor(Math.random() * 37); // 0-36 for roulette numbers
        const color = spinResult === 0 ? 'green' : spinResult % 2 === 0 ? 'red' : 'black';

        let winnings = 0;
        let resultMessage = `🎰 The ball landed on **${spinResult} (${color})**.\n`;

        if (space === 'number' && parseInt(options.getString('betvalue'), 10) === spinResult) {
            winnings = betAmount * 36;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (space === 'red' && color === 'red') {
            winnings = betAmount * 2;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (space === 'black' && color === 'black') {
            winnings = betAmount * 2;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (space === 'even' && spinResult !== 0 && spinResult % 2 === 0) {
            winnings = betAmount * 2;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (space === 'odd' && spinResult % 2 === 1) {
            winnings = betAmount * 2;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (space === '1-18' && spinResult >= 1 && spinResult <= 18) {
            winnings = betAmount * 2;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (space === '19-36' && spinResult >= 19 && spinResult <= 36) {
            winnings = betAmount * 2;
            resultMessage += `🎉 You won ${winnings} points!`;
        } else if (['1-12', '13-24', '25-36'].includes(space) && spinResult >= parseInt(space.split('-')[0], 10) && spinResult <= parseInt(space.split('-')[1], 10)) {
            winnings = betAmount * 3;
            resultMessage += `🎉 You won ${winnings} points!`;
        }

        // Update the user's points
        updateUserData(userId, winnings);

        // Increment the roulette count
        await incrementRouletteCount(userId);

        await interaction.reply(resultMessage);
    }

    else if (commandName === 'addpoints') {
        if (userId !== '821127442810273793') {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        const targetUserId = options.getUser('target').id;
        const pointsToAdd = options.getInteger('amount');

        if (pointsToAdd <= 0) {
            return interaction.reply({ content: "The amount of points must be greater than zero.", ephemeral: true });
        }

        updateUserData(targetUserId, pointsToAdd);

        await interaction.reply(`You have successfully added ${pointsToAdd} points to <@${targetUserId}>.`);
    }
});

client.login(token);