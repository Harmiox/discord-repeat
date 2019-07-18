import { Command, Message } from '@yamdbf/core';
import { TextChannel } from 'discord.js';
import { EchoClient } from '../../client/echo-client';
import { AppLogger } from '../../util/app-logger';

/**
 * Channel Command
 */

 export default class extends Command<EchoClient> {
	 private logger: AppLogger = new AppLogger('ChannelCommand');

	 public constructor() {
		 super({
			callerPermissions: [ 'ADMINISTRATOR' ],
			desc: 'Restrict which channel commands can be used in your guild.',
			group: 'Administration',
			guildOnly: true,
			name: 'channel',
			usage: '<prefix>channel #bot-control'
		 });
	 }

	 public async action(message: Message, args: string[]): Promise<Message | Message[]> {
		const channel: TextChannel = message.mentions.channels.first();
		if (!channel) { return message.reply('please mention the channel you want to restrict commands to.'); }
		message.guild.storage.set('channelId', channel.id);

		return message.reply(`I've restricted commands to ${channel}.`);
	 }
 }