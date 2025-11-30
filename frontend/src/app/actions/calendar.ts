'use server';

import { google } from 'googleapis';
import { auth } from '@/utils/auth';

// Unique identifier for pill reminders created by this app
const APP_EVENT_ID = 'ERNIE_AI_PILL_REMINDER';

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

export async function listEvents() {
	const session = await auth();

	if (!session || !session.accessToken) {
		throw new Error('Not authenticated');
	}

	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: session.accessToken as string });

	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	try {
		const now = new Date();
		const response = await calendar.events.list({
			calendarId: 'primary',
			timeMin: now.toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: 'startTime',
		});

		// Filter events created by this app using the APP_EVENT_ID marker
		const events = response.data.items || [];
		return events.filter((event) => event.description?.includes(APP_EVENT_ID)) || [];
	} catch (error) {
		console.error('Error fetching events:', error);
		throw new Error('Failed to fetch events');
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
	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	try {
		const dueDate = taskDetails.due
			? new Date(taskDetails.due).toISOString()
			: undefined;

		const task = {
			title: taskDetails.title,
			due: dueDate,
		};

		const taskResponse = await tasks.tasks.insert({
			tasklist: '@default',
			requestBody: task,
		});

		// If due date with time is provided, create a pill reminder event on the calendar
		if (taskDetails.due && taskDetails.due.includes('T')) {
			const dueDateTime = new Date(taskDetails.due);
			const endDateTime = new Date(dueDateTime.getTime() + 15 * 60000); // Add 15 minutes

			await calendar.events.insert({
				calendarId: 'primary',
				requestBody: {
					summary: `💊 ${taskDetails.title}`,
					description: `[${APP_EVENT_ID}] ${taskDetails.title}`,
					start: {
						dateTime: dueDateTime.toISOString(),
						timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					},
					end: {
						dateTime: endDateTime.toISOString(),
						timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					},
				},
			});
		}

		return taskResponse.data;
	} catch (error) {
		console.error('Error adding task:', error);
		throw new Error('Failed to add task');
	}
}
