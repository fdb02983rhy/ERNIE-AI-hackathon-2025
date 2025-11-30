'use server';

import { google } from 'googleapis';
import { auth } from '@/utils/auth';

export async function listTasks() {
	const session = await auth();

	if (!session || !session.accessToken) {
		throw new Error('Not authenticated');
	}

	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: session.accessToken as string });

	const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

	try {
		const response = await tasks.tasks.list({
			tasklist: '@default',
			showCompleted: false,
			maxResults: 10,
		});

		return response.data.items || [];
	} catch (error) {
		console.error('Error fetching tasks:', error);
		throw new Error('Failed to fetch tasks');
	}
}

export async function addTask(taskDetails: { title: string; due?: string }) {
	const session = await auth();

	if (!session || !session.accessToken) {
		throw new Error('Not authenticated');
	}

	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: session.accessToken as string });

	const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

	try {
		const task = {
			title: taskDetails.title,
			due: taskDetails.due
				? new Date(taskDetails.due).toISOString()
				: undefined,
		};

		const response = await tasks.tasks.insert({
			tasklist: '@default',
			requestBody: task,
		});

		return response.data;
	} catch (error) {
		console.error('Error adding task:', error);
		throw new Error('Failed to add task');
	}
}
