'use client';

import { useState, useEffect } from 'react';
import { listTasks, addTask } from '../app/actions/calendar';
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
	const [tasks, setTasks] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [adding, setAdding] = useState(false);
	const [newTask, setNewTask] = useState({
		title: '',
		due: '',
	});

	const fetchTasks = async () => {
		setLoading(true);
		try {
			const data = await listTasks();
			setTasks(data);
		} catch (error) {
			console.error('Failed to fetch tasks', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTasks();
	}, []);

	const handleAddTask = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTask.title) return;

		setAdding(true);
		try {
			await addTask(newTask);
			setNewTask({ title: '', due: '' });
			await fetchTasks();
		} catch (error) {
			console.error('Failed to add task', error);
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CheckSquare className="h-5 w-5" />
						Upcoming Tasks
					</CardTitle>
					<CardDescription>
						Your next 10 incomplete tasks from Google Tasks.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading && tasks.length === 0 ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<ul className="space-y-4">
							{tasks.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-4">
									No upcoming tasks found.
								</p>
							) : (
								tasks.map((task) => (
									<li
										key={task.id}
										className="flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
									>
										<p className="font-medium leading-none">{task.title}</p>
										{task.due && (
											<p className="text-xs text-muted-foreground">
												Due:{' '}
												{new Date(task.due).toLocaleDateString(undefined, {
													dateStyle: 'medium',
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

			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PlusIcon className="h-5 w-5" />
						Add New Task
					</CardTitle>
					<CardDescription>
						Create a new task in your default task list.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleAddTask} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Task Title</Label>
							<Input
								id="title"
								placeholder="e.g. Buy Groceries"
								value={newTask.title}
								onChange={(e) =>
									setNewTask({ ...newTask, title: e.target.value })
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="due">Due Date (Optional)</Label>
							<Input
								id="due"
								type="date"
								value={newTask.due}
								onChange={(e) =>
									setNewTask({ ...newTask, due: e.target.value })
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
								'Add Task'
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
