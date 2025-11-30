import AuthButton from '@/components/AuthButton';
import CalendarManager from '@/components/CalendarManager';
import VideoStream from '@/components/VideoStream';
import { auth } from '@/utils/auth';

export default async function Home() {
	const session = await auth();

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
			<h1 className="text-4xl font-bold">Google Auth with NextAuth</h1>
			<AuthButton />
			{session && <CalendarManager />}
			<VideoStream />
		</main>
	);
}
