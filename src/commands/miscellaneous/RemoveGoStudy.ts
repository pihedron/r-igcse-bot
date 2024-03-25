import { GuildPreferencesCache } from "@/redis";
import type { DiscordClient } from "@/registry/DiscordClient";
import BaseCommand, {
	type DiscordChatInputCommandInteraction
} from "@/registry/Structure/BaseCommand";
import Logger from "@/utils/Logger";
import {
	PermissionFlagsBits,
	SlashCommandBuilder
} from "discord.js";

export default class RemoveGoStudyCommand extends BaseCommand {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("remove_gostudy")
				.setDescription(
					"Remove the Forced Mute role. (for mods)"
				)
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("User to remove forced mute from")
						.setRequired(true)
				)
				.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
				.setDMPermission(false)
		);
	}

	async execute(
		client: DiscordClient<true>,
		interaction: DiscordChatInputCommandInteraction<"cached">
	) {
		const user = interaction.options.getUser("user", true)

		if (
			!interaction.member.permissions.has(
				PermissionFlagsBits.ModerateMembers
			)
		) {
			await interaction.reply({
				content: "You do not have permission to remove gostudy from other users.",
				ephemeral: true
			});

			return;
		}

		const guildPreferences = await GuildPreferencesCache.get(
			interaction.guildId
		);

		if (!guildPreferences || !guildPreferences.forcedMuteRoleId) {
			await interaction.reply({
				content: "Please setup the bot using the command `/setup` first.",
				ephemeral: true
			});
			return;
		}

		const role = interaction.guild.roles.cache.get(
			guildPreferences.forcedMuteRoleId
		);

		if (!role) {
			await interaction.reply({
				content: "Forced mute role not found!",
				ephemeral: true
			});

			return;
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			await (await interaction.guild.members.fetch(user)).roles.remove(role);
			await interaction.followUp({
				content: "Forced mute removed from " + user.username,
				ephemeral: true
			});
		} catch (error) {
			client.log(error, `${this.data.name} Command (remove role)`, 
					`**Channel:** <#${interaction.channel?.id}>
					**User:** <@${user.id}>
					**Guild:** ${interaction.guild.name} (${interaction.guildId})\n`);
			Logger.error(error);
			await interaction.followUp({
				content: "There was an error while removing the forced mute role.",
				ephemeral: true
			});
		}
	}
}
