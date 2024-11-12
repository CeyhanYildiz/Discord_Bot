import discord
from discord.ext import commands, tasks
from discord.ext.commands import cooldown, BucketType
import aiosqlite
import asyncio

# Load token from config
from config import TOKEN

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# Database setup
async def setup_db():
    async with aiosqlite.connect("points.db") as db:
        await db.execute(
            """CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            points INTEGER DEFAULT 0,
            last_claim INTEGER DEFAULT 0
        )"""
        )
        await db.commit()

# Helper functions to manage points and claim times
async def get_user_points(user_id):
    async with aiosqlite.connect("points.db") as db:
        cursor = await db.execute("SELECT points FROM users WHERE id = ?", (user_id,))
        row = await cursor.fetchone()
        return row[0] if row else 0

async def update_user_points(user_id, points):
    async with aiosqlite.connect("points.db") as db:
        await db.execute("INSERT OR IGNORE INTO users (id, points) VALUES (?, ?)", (user_id, points))
        await db.execute("UPDATE users SET points = points + ? WHERE id = ?", (points, user_id))
        await db.commit()

async def get_last_claim(user_id):
    async with aiosqlite.connect("points.db") as db:
        cursor = await db.execute("SELECT last_claim FROM users WHERE id = ?", (user_id,))
        row = await cursor.fetchone()
        return row[0] if row else 0

async def update_last_claim(user_id, timestamp):
    async with aiosqlite.connect("points.db") as db:
        await db.execute("INSERT OR IGNORE INTO users (id) VALUES (?)", (user_id,))
        await db.execute("UPDATE users SET last_claim = ? WHERE id = ?", (timestamp, user_id))
        await db.commit()

# Claim command with cooldown
@bot.tree.command(name="claim", description="Claim your daily points.")
@cooldown(1, 86400, BucketType.user)  # 24-hour cooldown
async def claim(interaction: discord.Interaction):
    user_id = interaction.user.id
    last_claim = await get_last_claim(user_id)
    current_time = int(discord.utils.utcnow().timestamp())
    
    if current_time - last_claim < 86400:
        remaining_time = 86400 - (current_time - last_claim)
        hours, remainder = divmod(remaining_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        await interaction.response.send_message(
            f"You already claimed your points. Come back in {int(hours)}h {int(minutes)}m {int(seconds)}s."
        )
    else:
        await update_user_points(user_id, 10)
        await update_last_claim(user_id, current_time)
        points = await get_user_points(user_id)
        await interaction.response.send_message(f"You claimed 10 points! You now have {points} points.")

# Shop command displaying items with points costs
@bot.tree.command(name="shop", description="Display the list of items available in the shop.")
async def shop(interaction: discord.Interaction):
    embed = discord.Embed(
        title="TMA SHOP!", 
        description="🔥 Buy items by using the `/buy [index]` command.",
        color=0xE0B0FF
    )

    # List of items with corresponding emojis
    items = [
        ("[1] Custom Role", "🔥 300 points", "🛡️"),      # Emoji for Custom Role
        ("[2] Custom Command", "🔥 350 points", "⚔️"),    # Emoji for Custom Command
        ("[3] Host An Event", "🔥 500 points", "🎉"),    # Emoji for Host An Event
        ("[4] Classic Nitro", "🔥 700 points", "🎇"),    # Emoji for Classic Nitro
        ("[5] Full Nitro", "🔥 1100 points", "🚀"),     # Emoji for Full Nitro
        ("[6] 10$ Wallet Voucher", "🔥 1200 points", "💸"), # Emoji for Wallet Voucher
        ("[7] 25$ Worth Of Game", "🔥 3000 points", "🎮"),  # Emoji for 25$ Game
        ("[8] 60$ Worth Of Game", "🔥 6000 points", "💰")   # Emoji for 60$ Game
    ]

    # Adding items and their respective emojis to the embed
    for name, price, emoji in items:
        embed.add_field(name=f"{emoji} {name}", value=price, inline=True)

    await interaction.response.send_message(embed=embed)

# Buy command using item index
@bot.tree.command(name="buy", description="Buy an item using your points.")
async def buy(interaction: discord.Interaction, item_index: int):
    user_id = interaction.user.id
    item_list = [
        ("Custom Role 🛡️", 300),
        ("Custom Command ⚔️", 350),
        ("Host An Event 🎉", 500),
        ("Classic Nitro 🎇", 700),
        ("Full Nitro 🚀", 1100),
        ("10$ Wallet Voucher 💸", 1200),
        ("25$ Game 🎮", 3000),
        ("60$ Game 💰", 6000)
    ]

    if item_index < 1 or item_index > len(item_list):
        await interaction.response.send_message("Invalid item index. Please check the shop and select a valid item.")
        return

    item, cost = item_list[item_index - 1]
    user_points = await get_user_points(user_id)

    if user_points < cost:
        await interaction.response.send_message(f"You don't have enough points for this item. You need {cost} points, but you only have {user_points}.")
        return

    await update_user_points(user_id, -cost)
    await interaction.response.send_message(f"You bought {item} for {cost} points! You now have {user_points - cost} points. ")

# Give command restricted to a specific user
@bot.tree.command(name="give", description="Give points to a user.")
async def give(interaction: discord.Interaction, member: discord.Member, amount: int):
    giver_id = interaction.user.id
    target_id = member.id
    
    # Restrict the command to only the user with ID 821127442810273793 (cey_with_a_j)
    if giver_id != 821127442810273793:
        await interaction.response.send_message("You do not have permission to use this command.")
        return

    # Update points for the target user
    await update_user_points(target_id, amount)
    new_points = await get_user_points(target_id)

    await interaction.response.send_message(f"Successfully gave {amount} points to {member.mention}. They now have {new_points} points.")

# /wallet command to display user points
@bot.tree.command(name="wallet", description="Check your current fire points.")
async def wallet(interaction: discord.Interaction):
    user_id = interaction.user.id
    # Fetch fire points from database
    fire_points = await get_user_points(user_id)
    
    # Create an embed for a cooler display
    embed = discord.Embed(
        title=f"Wallet Info for {interaction.user.name}",
        color=0xFFA500,  # Orange color for the embed
        description=f"💰 **Fire Points**: {fire_points} points"
    )
    
    # Set a cool thumbnail, could be any image you want
    embed.set_thumbnail(url=interaction.user.avatar.url)
    
    # Send the embedded message
    await interaction.response.send_message(embed=embed)

# On bot ready, sync commands and setup DB
@bot.event
async def on_ready():
    await bot.tree.sync()
    await setup_db()
    print(f"Bot is ready. Logged in as {bot.user}.")

# Run the bot
bot.run(TOKEN)
