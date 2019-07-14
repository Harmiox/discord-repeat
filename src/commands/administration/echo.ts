import { Command, Message, Middleware } from '@yamdbf/core';
import { using } from '@yamdbf/core/bin/command/CommandDecorators';
import construe from 'cronstrue';
import { Collection, MessageEmbed, TextChannel } from 'discord.js';
import cron from 'node-cron';
import { EchoClient } from '../../client/echo-client';
import { ICronJob } from '../../config/interfaces/cron.interface';
import { AppLogger } from '../../util/app-logger';

/**
 * Echo Command
 */

 export default class extends Command<EchoClient> {
		private logger: AppLogger = new AppLogger('EchoCommand');

		public constructor() {
			super({
			callerPermissions: [ 'ADMINISTRATOR' ],
			desc: 'TODO',
			group: 'Administration',
			guildOnly: true,
			name: 'echo',
			usage: '<prefix>echo <action>'
			});
		}

		@using(Middleware.resolve(`action: ['new', 'remove']`))
		@using(Middleware.expect(`action: ['new', 'remove']`))
		public async action(message: Message, [action]: [string]): Promise<Message | Message[]> {
			if (action === 'remove') {
				try {
					// Generate message to send
					const embed: MessageEmbed = new MessageEmbed();
					embed.setDescription('Help text here.');
					embed.setColor('#7289DA');
					const jobs: ICronJob[] = (await message.guild.storage.get('jobs')) || [];
					jobs.forEach((job: ICronJob) => {
						const channel: TextChannel = this.client.channels.get(job.textChannelId) as TextChannel;
						const expressionDescribed: string = construe.toString(job.expression);
						if (!channel) { return this.logger.error(`Channel not found for cron job '${job.identifier}'`); }
						embed.addField(job.identifier, `*${expressionDescribed}*\n${job.payload}`);
					});
					const idenitifier: string = await this.awaitRemoveResponse(message, embed);

					// End the task and remove the job from the database
					jobs.forEach((job: ICronJob, index: number) => {
						if (job.identifier === idenitifier) {
							this.client.tasks.get(idenitifier).destroy();
							jobs.splice(index, 1);
						}
					});
					await message.guild.storage.set('jobs', jobs);
				
					return message.reply('done.');
				} catch (err) {
					return message.reply('an error occurred: ' + `\`${err.message}\``);
				}
			} else {
				try {
					// Get the TextChannel
					const textChannel: TextChannel = await this.awaitTextChannel(message);
					if (!textChannel) { return message.reply('no TextChannel was mentioned.'); }
	
					// Get the Cron Expression
					const cronExpression: string = await this.awaitCronExpression(message);
					if (!cronExpression) { return message.reply('no cron expression was given.'); }
					const validExpression: boolean = cron.validate(cronExpression);
					if (!validExpression) { return message.reply('an invalid cron express was given. For help on making a cron expression please visit https://www.freeformatter.com/cron-expression-generator-quartz.html.'); }
					const expressionDescribed: string = construe.toString(cronExpression);
					message.channel.send(`Your message will repeat **${this.uncapitalize(expressionDescribed)}**.`);
	
					// Get the payload text to send
					const payloadMessage: string = await this.awaitPayload(message);
					if (!payloadMessage) { return message.reply('no message was given.'); }

					// Get the idenitifier for the job
					const idenitifier: string = await this.awaitIdentifier(message);
					if (!idenitifier) { return message.reply('no identifier was given.'); }
	
					// Create the ICronJob
					const job: ICronJob = {
						active: true,
						authorUserId: message.author.id,
						expression: cronExpression,
						identifier: idenitifier,
						payload: payloadMessage,
						textChannelId: textChannel.id
					};
	
					// Create the task
					const cronJob: cron.ScheduledTask = cron.schedule(job.expression, () => {
						textChannel.send(job.payload).catch((err: Error) => this.logger.error('Error in cron jon: ', err));
					});
					this.client.tasks.set(job.identifier, cronJob);

					// Save the job
					const jobs: ICronJob[] = (await message.guild.storage.get('jobs')) || [];
					jobs.push(job);
					await message.guild.storage.set('jobs', jobs);
	
					// Start the task
					cronJob.start();
	
					return message.reply(`your message will now repeat in ${textChannel} **${this.uncapitalize(expressionDescribed)}**.`);
				} catch (err) {
					return message.reply("it appears something went wrong.");
				}
			}
		}

		private async awaitTextChannel(message: Message): Promise<TextChannel> {
			try {
				const seconds: number = 60;
				const channel: TextChannel = message.channel as TextChannel;
				const filter = (m: Message) => m.author.id === message.author.id;
				await channel.send(`Mention a valid TextChannel that you want the message to be sent in. (${seconds}s)`);
				const responses: Collection<string, Message> = await channel.awaitMessages(filter, { max: 1, time: (seconds * 1000), errors: ['time'] });
				const mentionedChannel: TextChannel = responses.first().mentions.channels.first() as TextChannel;

				return mentionedChannel;
			} catch (err) {
				return;
			}
		}

		private async awaitCronExpression(message: Message): Promise<string> {
			try {
				const seconds: number = 60;
				const channel: TextChannel = message.channel as TextChannel;
				const filter = (m: Message) => m.author.id === message.author.id;
				await channel.send(`Please give a valid cron expression. (${seconds}s)`);
				const responses: Collection<string, Message> = await channel.awaitMessages(filter, { max: 1, time: (seconds * 1000), errors: ['time'] });

				return responses.first().content;
			} catch (err) {
				return;
			}
		}

		private async awaitPayload(message: Message): Promise<string> {
			try {
				const seconds: number = 60;
				const channel: TextChannel = message.channel as TextChannel;
				const filter = (m: Message) => m.author.id === message.author.id;
				await channel.send(`Please give the message you want to be sent. (${seconds}s)`);
				const responses: Collection<string, Message> = await channel.awaitMessages(filter, { max: 1, time: (seconds * 1000), errors: ['time'] });

				return responses.first().content;
			} catch (err) {
				return;
			}
		}

		private async awaitIdentifier(message: Message): Promise<string> {
			try {
				const seconds: number = 60;
				const channel: TextChannel = message.channel as TextChannel;
				const filter = (m: Message) => m.author.id === message.author.id;
				await channel.send(`Please give a single phrase identifier such as 'NoSpammingEcho'. (${seconds}s)`);
				const responses: Collection<string, Message> = await channel.awaitMessages(filter, { max: 1, time: (seconds * 1000), errors: ['time'] });

				return responses.first().content.split(' ')[0];
			} catch (err) {
				return;
			}
		}

		private async awaitRemoveResponse(message: Message, embed: MessageEmbed): Promise<string> {
			try {
				const seconds: number = 60;
				const channel: TextChannel = message.channel as TextChannel;
				const filter = (m: Message) => m.author.id === message.author.id;
				await channel.send(`Give the **identifier** of the echo you want to remove. (${seconds}s)`, embed);
				const responses: Collection<string, Message> = await channel.awaitMessages(filter, { max: 1, time: (seconds * 1000), errors: ['time'] });

				return responses.first().content;
			} catch (err) {
				return;
			}
		}

		private uncapitalize(text: string): string { return text.charAt(0).toLocaleLowerCase() + text.slice(1); }
 }