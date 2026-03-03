<script lang="ts">
	import { tournament } from '$lib/state/tournament.svelte';

	// Sort participants by Wins desc, then Total Points desc
	let sortedParticipants = $derived(
		[...tournament.participants].sort((a, b) => {
			if (a.wins !== b.wins) return b.wins - a.wins;
			return b.totalPoints - a.totalPoints;
		})
	);
</script>

<div class="mx-auto flex h-full max-w-4xl flex-col p-4">
	<h2 class="mb-8 text-center font-serif text-4xl font-bold text-amber-500">Tournament Results</h2>

	<div class="flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
		<div class="overflow-x-auto">
			<table class="w-full max-w-full text-left">
				<thead
					class="bg-black/40 text-xs font-bold tracking-widest text-amber-500 uppercase md:text-sm"
				>
					<tr>
						<th class="p-3 md:p-4">Rank</th>
						<th class="p-3 md:p-4">Fighter</th>
						<th class="p-3 text-center md:p-4">Wins</th>
						<th class="p-3 text-center md:p-4">Losses</th>
						<th class="hidden p-3 text-center sm:table-cell md:p-4">Draws</th>
						<th class="p-3 text-center text-blue-400 md:p-4" title="Points For (Hits Dealt)"
							>Hits</th
						>
						<th class="p-3 text-center text-red-400 md:p-4" title="Points Against (Hits Received)"
							>Received</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/5">
					{#each sortedParticipants as p, i (p.id)}
						<tr class="transition-colors hover:bg-white/5">
							<td class="p-3 font-bold text-gray-400 md:p-4">#{i + 1}</td>
							<td class="p-3 text-base font-bold text-white md:p-4 md:text-lg">{p.name}</td>
							<td class="p-3 text-center font-bold text-green-400 md:p-4">{p.wins}</td>
							<td class="p-3 text-center text-red-400 md:p-4">{p.losses}</td>
							<td class="hidden p-3 text-center text-gray-400 sm:table-cell md:p-4">{p.draws}</td>
							<td class="p-3 text-center font-mono text-blue-300 md:p-4">{p.pointsScored}</td>
							<td class="p-3 text-center font-mono text-red-300 md:p-4">{p.pointsAgainst}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="mt-8 flex justify-center">
		<button
			onclick={() => tournament.reset()}
			class="rounded border border-white/20 bg-white/10 px-8 py-3 font-bold tracking-widest text-white uppercase transition-all hover:bg-white/20"
		>
			New Tournament
		</button>

		<button
			onclick={() => tournament.undoLastRound()}
			class="ml-4 rounded border border-yellow-500/20 bg-yellow-500/10 px-8 py-3 font-bold tracking-widest text-yellow-500 uppercase transition-all hover:bg-yellow-500/20"
		>
			Undo Last Action
		</button>
	</div>
</div>
