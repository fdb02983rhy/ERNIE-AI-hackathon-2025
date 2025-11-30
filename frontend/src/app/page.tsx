import AuthButton from '@/components/AuthButton';
import CalendarManager from '@/components/CalendarManager';
import { auth } from '@/utils/auth';

export default async function Home() {
	const session = await auth();

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
			<h1 className="text-4xl font-bold">Prescription/処方箋 reminder</h1>
			<AuthButton />
			{session && <CalendarManager />}
		</main>
	);
}
