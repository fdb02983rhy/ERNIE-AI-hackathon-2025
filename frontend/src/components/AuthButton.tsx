'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthButton() {
	const { data: session } = useSession();

	if (session) {
		return (
			<div className="flex flex-col items-center gap-4">
				<p className="text-lg">
					Signed in as{' '}
					<span className="font-semibold">{session.user?.email}</span>
				</p>
				<button
					onClick={() => signOut()}
					className="rounded-full bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600"
				>
					Sign out
				</button>
			</div>
		);
	}

	return (
		<button
			onClick={() => signIn('google')}
			className="rounded-full bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
		>
			Sign in with Google
		</button>
	);
}
