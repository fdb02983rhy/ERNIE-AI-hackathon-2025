'use client';

import { useState, useEffect } from 'react';
import { listEvents, addEvent } from '../app/actions/calendar';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, PlusIcon, Loader2 } from 'lucide-react';

export default function CalendarManager() {
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [adding, setAdding] = useState(false);
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

		setAdding(true);
		try {
			await addEvent(newEvent);
			setNewEvent({ summary: '', start: '', end: '' });
			await fetchEvents();
		} catch (error) {
			console.error('Failed to add event', error);
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarIcon className="h-5 w-5" />
						Upcoming Events
					</CardTitle>
					<CardDescription>
						Your next 10 events from Google Calendar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading && events.length === 0 ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<ul className="space-y-4">
							{events.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No upcoming events found.
								</p>
							) : (
								events.map((event) => (
									<li
										key={event.id}
										className="flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
									>
										<p className="font-medium leading-none">{event.summary}</p>
										<p className="text-xs text-muted-foreground">
											{event.start.dateTime
												? new Date(event.start.dateTime).toLocaleString(
														undefined,
														{
															dateStyle: 'medium',
															timeStyle: 'short',
														},
												  )
												: event.start.date}
										</p>
									</li>
								))
							)}
						</ul>
					)}
				</CardContent>
			</Card>

			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PlusIcon className="h-5 w-5" />
						Add New Event
					</CardTitle>
					<CardDescription>
						Schedule a new event on your primary calendar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleAddEvent} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="summary">Event Summary</Label>
							<Input
								id="summary"
								placeholder="e.g. Team Meeting"
								value={newEvent.summary}
								onChange={(e) =>
									setNewEvent({ ...newEvent, summary: e.target.value })
								}
								required
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="start">Start Time</Label>
								<Input
									id="start"
									type="datetime-local"
									value={newEvent.start}
									onChange={(e) =>
										setNewEvent({ ...newEvent, start: e.target.value })
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="end">End Time</Label>
								<Input
									id="end"
									type="datetime-local"
									value={newEvent.end}
									onChange={(e) =>
										setNewEvent({ ...newEvent, end: e.target.value })
									}
									required
								/>
							</div>
						</div>
						<Button type="submit" className="w-full" disabled={adding}>
							{adding ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								'Add Event'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
