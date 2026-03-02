<script lang="ts">
	import Setup from '$lib/components/Setup.svelte';
	import Match from '$lib/components/Match.svelte';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import { tournament } from '$lib/state/tournament.svelte';

	// Reactive state view
	let showState = $derived.by(() => {
		if (!tournament.tournamentStarted) return 'setup';
		if (tournament.tournamentFinished) return 'leaderboard';
		return 'match';
	});
</script>

<div
	class="flex h-[100dvh] flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
>
	<!-- Header -->
	<header
		class="flex items-center justify-between border-b border-white/10 bg-black/20 p-6 shadow-lg backdrop-blur-sm"
	>
		<h1
			class="truncate bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text font-serif text-2xl font-bold text-transparent md:text-3xl"
		>
			⚔️ BHC Tournament Tracker
		</h1>
		{#if tournament.tournamentStarted && !tournament.tournamentFinished}
			<div class="hidden text-sm text-gray-400 md:block">
				Match {tournament.currentMatchIndex + 1} of {tournament.matches.length}
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="flex-1 overflow-y-auto p-4 md:p-8">
		{#if showState === 'setup'}
			<Setup />
		{:else if showState === 'match'}
			<Match />
		{:else if showState === 'leaderboard'}
			<Leaderboard />
		{/if}
	</main>

	<!-- Footer -->
	<footer class="border-t border-white/5 p-4 text-center text-xs text-gray-600">
		&copy; {new Date().getFullYear()} Tournament Tracker
	</footer>
</div>
