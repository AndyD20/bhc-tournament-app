<script lang="ts">
	import { tournament, type HitLocation } from '$lib/state/tournament.svelte';

	let currentRound = $derived(tournament.currentMatch?.rounds.length || 0);
	let maxRounds = $derived(tournament.settings.roundsPerMatch);

	let p1 = $derived(tournament.participants.find((p) => p.id === tournament.currentMatch?.p1Id));
	let p2 = $derived(tournament.participants.find((p) => p.id === tournament.currentMatch?.p2Id));

	let p1Score = $derived(
		tournament.currentMatch?.rounds.reduce((sum, r) => sum + r.p1Score, 0) || 0
	);
	let p2Score = $derived(
		tournament.currentMatch?.rounds.reduce((sum, r) => sum + r.p2Score, 0) || 0
	);

	let isTiebreaker = $derived(
		tournament.settings.preventDraws &&
			p1Score === p2Score &&
			(currentRound >= maxRounds ||
				(tournament.settings.maxPointsEnabled &&
					(p1Score >= tournament.settings.maxPoints || p2Score >= tournament.settings.maxPoints)))
	);

	function recordHit(location: HitLocation, scorerId: number) {
		tournament.recordRound('hit', scorerId, location);
	}

	function recordAfterblow(scorerId: number) {
		tournament.recordRound('afterblow', scorerId);
	}

	function recordDouble() {
		tournament.recordRound('double');
	}

	const btnClass =
		'py-3 px-4 rounded text-white font-bold uppercase tracking-wider transition-all transform active:scale-95 shadow-lg w-full';
</script>

{#if tournament.currentMatch && p1 && p2}
	<div class="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center p-4">
		<!-- Match Header -->
		<div class="mb-8 text-center">
			<h2 class="mb-2 font-serif text-3xl font-bold text-amber-500">
				Match {tournament.currentMatchIndex + 1}
			</h2>
			<div class="text-xl text-gray-400">
				{#if isTiebreaker}
					<span class="animate-pulse font-bold text-amber-500">Tiebreaker Round</span>
				{:else}
					Round <span class="font-bold text-white">{currentRound + 1}</span> of {maxRounds}
				{/if}
			</div>
		</div>

		<!-- Scoreboard -->
		<div class="mb-12 flex w-full flex-col items-stretch justify-between gap-8 md:flex-row">
			<!-- P1 -->
			<div
				class="flex flex-1 flex-col items-center rounded-xl border border-blue-500/30 bg-blue-900/20 p-6 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
			>
				<div class="mb-2 text-4xl font-bold text-white">{p1.name}</div>
				<div class="mb-6 text-6xl font-black text-blue-400">{p1Score}</div>

				<div class="grid w-full grid-cols-1 gap-2">
					<button
						onclick={() => recordHit('head', p1.id)}
						class="{btnClass} bg-blue-600 hover:bg-blue-500"
					>
						Head (+{tournament.settings.points.head})
					</button>
					<button
						onclick={() => recordHit('body', p1.id)}
						class="{btnClass} bg-blue-700 hover:bg-blue-600"
					>
						Body (+{tournament.settings.points.body})
					</button>
					<button
						onclick={() => recordHit('arms', p1.id)}
						class="{btnClass} bg-blue-800 hover:bg-blue-700"
					>
						Arms (+{tournament.settings.points.arms})
					</button>
					<button
						onclick={() => recordAfterblow(p1.id)}
						class="{btnClass} mt-2 border-t border-white/10 bg-indigo-900/80 hover:bg-indigo-800"
					>
						Hit/Afterblow (+{tournament.settings.afterblow.attacker}/{tournament.settings.afterblow
							.defender})
					</button>
				</div>
			</div>

			<!-- VS / Controls -->
			<div class="flex flex-col items-center justify-center gap-4">
				<div class="text-2xl font-black text-gray-600 italic">VS</div>

				<button
					onclick={recordDouble}
					disabled={isTiebreaker}
					class="w-full rounded-full border border-red-500/50 bg-red-900/50 px-8 py-4 text-center font-bold tracking-widest text-red-200 uppercase shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all hover:scale-105 hover:bg-red-800 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale md:w-auto"
				>
					Double Hit
				</button>
			</div>

			<!-- P2 -->
			<div
				class="flex flex-1 flex-col items-center rounded-xl border border-red-500/30 bg-red-900/20 p-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
			>
				<div class="mb-2 text-4xl font-bold text-white">{p2.name}</div>
				<div class="mb-6 text-6xl font-black text-red-400">{p2Score}</div>

				<div class="grid w-full grid-cols-1 gap-2">
					<button
						onclick={() => recordHit('head', p2.id)}
						class="{btnClass} bg-red-600 hover:bg-red-500"
					>
						Head (+{tournament.settings.points.head})
					</button>
					<button
						onclick={() => recordHit('body', p2.id)}
						class="{btnClass} bg-red-700 hover:bg-red-600"
					>
						Body (+{tournament.settings.points.body})
					</button>
					<button
						onclick={() => recordHit('arms', p2.id)}
						class="{btnClass} bg-red-800 hover:bg-red-700"
					>
						Arms (+{tournament.settings.points.arms})
					</button>
					<button
						onclick={() => recordAfterblow(p2.id)}
						class="{btnClass} mt-2 border-t border-white/10 bg-rose-900/80 hover:bg-rose-800"
					>
						Hit/Afterblow (+{tournament.settings.afterblow.attacker}/{tournament.settings.afterblow
							.defender})
					</button>
				</div>
			</div>
		</div>

		<!-- History / Last Action -->
		{#if tournament.currentMatch.rounds.length > 0}
			<div class="text-sm text-gray-400 italic">
				Last action:
				{#if tournament.currentMatch.rounds.at(-1)?.type === 'double'}
					Double Hit
				{:else if tournament.currentMatch.rounds.at(-1)?.type === 'afterblow'}
					{@const lastRound = tournament.currentMatch.rounds.at(-1)}
					Hit w/ Afterblow by {lastRound?.scorerId === p1.id ? p1.name : p2.name}
				{:else}
					{@const lastRound = tournament.currentMatch.rounds.at(-1)}
					Hit to {lastRound?.hitLocation} by {lastRound?.scorerId === p1.id ? p1.name : p2.name}
				{/if}
			</div>
		{/if}

		<div class="mt-8 flex justify-center">
			<button
				onclick={() => tournament.undoLastRound()}
				disabled={tournament.currentMatchIndex === 0 &&
					(!tournament.currentMatch || tournament.currentMatch.rounds.length === 0)}
				class="rounded border border-yellow-500/50 px-6 py-2 text-sm font-bold tracking-wider text-yellow-500 uppercase transition-colors hover:bg-yellow-500/10 disabled:pointer-events-none disabled:opacity-0"
			>
				Undo Last Action
			</button>
		</div>
	</div>
{:else}
	<div class="text-center text-white">Loading match data...</div>
{/if}
