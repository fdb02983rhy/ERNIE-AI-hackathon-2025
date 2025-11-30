'use client';

import { useState, useEffect } from 'react';
import { listEvents, addTask } from '../app/actions/calendar';
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
import { CheckSquare, PlusIcon, Loader2 } from 'lucide-react';

export default function CalendarManager() {
	const [pills, setPills] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [adding, setAdding] = useState(false);
	const [newPill, setNewPill] = useState({
		title: '',
		due: '',
	});

	const fetchPills = async () => {
		setLoading(true);
		try {
			const data = await listEvents();
			setPills(data);
		} catch (error) {
			console.error('Failed to fetch pills', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPills();
	}, []);

	const handleAddPill = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPill.title) return;

		setAdding(true);
		try {
			await addTask(newPill);
			setNewPill({ title: '', due: '' });
			await fetchPills();
		} catch (error) {
			console.error('Failed to add pill', error);
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PlusIcon className="h-5 w-5" />
						Add Pill Reminder
					</CardTitle>
					<CardDescription>
						Set a pill reminder and block time on your calendar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleAddPill} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Pill Name</Label>
							<Input
								id="title"
								placeholder="e.g. Aspirin"
								value={newPill.title}
								onChange={(e) =>
									setNewPill({ ...newPill, title: e.target.value })
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="due">Time to Take (Optional)</Label>
							<Input
								id="due"
								type="datetime-local"
								value={newPill.due}
								onChange={(e) =>
									setNewPill({ ...newPill, due: e.target.value })
								}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={adding}>
							{adding ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								'Add Reminder'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CheckSquare className="h-5 w-5" />
						Upcoming Reminders
					</CardTitle>
					<CardDescription>
						Your next 10 pill reminders from Google Calendar.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading && pills.length === 0 ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<ul className="space-y-4">
							{pills.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No upcoming reminders found.
								</p>
							) : (
								pills.map((pill) => (
									<li
										key={pill.id}
										className="flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
									>
										<p className="font-medium leading-none">{pill.summary}</p>
										{pill.start?.dateTime && (
											<p className="text-xs text-muted-foreground">
												Time:{' '}
												{new Date(pill.start.dateTime).toLocaleString(undefined, {
													dateStyle: 'medium',
													timeStyle: 'short',
												})}
											</p>
										)}
									</li>
								))
							)}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
