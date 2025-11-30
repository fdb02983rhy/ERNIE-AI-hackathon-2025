'use client';

import { useState, useEffect } from 'react';
import { listEvents, addEvent } from '../app/actions/calendar';

export default function CalendarManager() {
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [newEvent, setNewEvent] = useState({
		summary: '',
		start: '',
		end: '',
	});

	const fetchEvents = async () => {
		setLoading(true);
		try {
			const data = await listEvents();
			setEvents(data);
		} catch (error) {
			console.error('Failed to fetch events', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEvents();
	}, []);

	const handleAddEvent = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newEvent.summary || !newEvent.start || !newEvent.end) return;

		setLoading(true);
		try {
			await addEvent(newEvent);
			setNewEvent({ summary: '', start: '', end: '' });
			await fetchEvents();
		} catch (error) {
			console.error('Failed to add event', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-2xl space-y-8">
			<div className="rounded-lg border p-6 shadow-sm">
				<h2 className="mb-4 text-2xl font-bold">Upcoming Events</h2>
				{loading && events.length === 0 ? (
					<p>Loading events...</p>
				) : (
					<ul className="space-y-2">
						{events.length === 0 ? (
							<p>No upcoming events found.</p>
						) : (
							events.map((event) => (
								<li key={event.id} className="border-b pb-2 last:border-0">
									<p className="font-semibold">{event.summary}</p>
									<p className="text-sm text-gray-500">
										{event.start.dateTime
											? new Date(event.start.dateTime).toLocaleString()
											: event.start.date}
									</p>
								</li>
							))
						)}
					</ul>
				)}
			</div>

			<div className="rounded-lg border p-6 shadow-sm">
				<h2 className="mb-4 text-2xl font-bold">Add New Event</h2>
				<form onSubmit={handleAddEvent} className="space-y-4">
					<div>
						<label className="block text-sm font-medium">Event Summary</label>
						<input
							type="text"
							value={newEvent.summary}
							onChange={(e) =>
								setNewEvent({ ...newEvent, summary: e.target.value })
							}
							className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-black"
							required
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium">Start Time</label>
							<input
								type="datetime-local"
								value={newEvent.start}
								onChange={(e) =>
									setNewEvent({ ...newEvent, start: e.target.value })
								}
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-black"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">End Time</label>
							<input
								type="datetime-local"
								value={newEvent.end}
								onChange={(e) =>
									setNewEvent({ ...newEvent, end: e.target.value })
								}
								className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-black"
								required
							/>
						</div>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
					>
						{loading ? 'Adding...' : 'Add Event'}
					</button>
				</form>
			</div>
		</div>
	);
}
