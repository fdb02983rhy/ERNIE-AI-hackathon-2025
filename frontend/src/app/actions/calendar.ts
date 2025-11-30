'use server';

import { google } from 'googleapis';
import { auth } from '@/utils/auth';

export async function listEvents() {
	const session = await auth();

	if (!session || !session.accessToken) {
		throw new Error('Not authenticated');
	}

	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: session.accessToken as string });

	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	try {
		const response = await calendar.events.list({
			calendarId: 'primary',
			timeMin: new Date().toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: 'startTime',
		});

		return response.data.items || [];
	} catch (error) {
		console.error('Error fetching events:', error);
		throw new Error('Failed to fetch events');
	}
}

export async function addEvent(eventDetails: {
	summary: string;
	start: string;
	end: string;
}) {
	const session = await auth();

	if (!session || !session.accessToken) {
		throw new Error('Not authenticated');
	}

	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: session.accessToken as string });

	const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

	try {
		const event = {
			summary: eventDetails.summary,
			start: {
				dateTime: new Date(eventDetails.start).toISOString(),
			},
			end: {
				dateTime: new Date(eventDetails.end).toISOString(),
			},
		};

		const response = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: event,
		});

		return response.data;
	} catch (error) {
		console.error('Error adding event:', error);
		throw new Error('Failed to add event');
	}
}
