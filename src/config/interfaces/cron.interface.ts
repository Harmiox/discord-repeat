export interface ICronJob {
	active: boolean;
	authorUserId: string;
	expression: string;
	identifier: string;
	payload: string;
	textChannelId: string;
}