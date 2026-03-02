<script lang="ts">
	import { tournament } from '$lib/state/tournament.svelte';

	let newParticipantName = $state('');

	function addParticipant(e?: Event) {
		e?.preventDefault();
		if (newParticipantName.trim()) {
			tournament.addParticipant(newParticipantName);
			newParticipantName = '';
		}
	}

	function removeParticipant(id: number) {
		tournament.removeParticipant(id);
	}
</script>

<div class="mx-auto max-w-2xl space-y-8 p-4">
	<div class="rounded-xl border border-white/10 bg-white/5 p-6 shadow-xl">
		<h2 class="mb-4 font-serif text-2xl font-bold text-amber-500">Tournament Setup</h2>

		<!-- Participants -->
		<div class="mb-8">
			<h3 class="mb-2 text-lg font-semibold text-gray-200">Participants</h3>
			<form onsubmit={addParticipant} class="mb-4 flex gap-2">
				<input
					type="text"
					bind:value={newParticipantName}
					placeholder="Enter fighter name..."
					class="flex-1 rounded border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded bg-amber-600 px-6 py-2 font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
				>
					Add
				</button>
			</form>

			{#if tournament.participants.length > 0}
				<ul class="custom-scrollbar max-h-60 space-y-2 overflow-y-auto pr-1">
					{#each tournament.participants as p (p.id)}
						<li
							class="group animate-in fade-in slide-in-from-top-2 flex items-center justify-between rounded bg-white/5 p-3"
						>
							<span class="font-medium text-gray-200">{p.name}</span>
							<button
								onclick={() => removeParticipant(p.id)}
								class="text-red-400 opacity-0 transition-colors group-hover:opacity-100 hover:text-red-300 focus:opacity-100"
								aria-label="Remove participant"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
										d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
									/></svg
								>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-gray-500 italic">No details added yet.</p>
			{/if}
		</div>

		<!-- Settings -->
		<div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
			<div>
				<h3 class="mb-3 text-lg font-semibold text-gray-200">Match Settings</h3>
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-sm text-gray-400" for="rounds">Rounds per Fight</label>
						<input
							id="rounds"
							type="number"
							min="1"
							max="20"
							bind:value={tournament.settings.roundsPerMatch}
							class="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<div>
				<h3 class="mb-3 text-lg font-semibold text-gray-200">Points</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<label class="text-sm text-gray-400" for="pts-head">Head</label>
						<input
							id="pts-head"
							type="number"
							bind:value={tournament.settings.points.head}
							class="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-white focus:border-amber-500 focus:outline-none"
						/>
					</div>
					<div class="flex items-center justify-between">
						<label class="text-sm text-gray-400" for="pts-body">Body</label>
						<input
							id="pts-body"
							type="number"
							bind:value={tournament.settings.points.body}
							class="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-white focus:border-amber-500 focus:outline-none"
						/>
					</div>
					<div class="flex items-center justify-between">
						<label class="text-sm text-gray-400" for="pts-arms">Arms/Hands</label>
						<input
							id="pts-arms"
							type="number"
							bind:value={tournament.settings.points.arms}
							class="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-white focus:border-amber-500 focus:outline-none"
						/>
					</div>
				</div>

				<h3 class="mt-6 mb-3 text-lg font-semibold text-gray-200">Afterblow Points</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<label class="text-sm text-gray-400" for="pts-afterblow-atk">Attacker</label>
						<input
							id="pts-afterblow-atk"
							type="number"
							bind:value={tournament.settings.afterblow.attacker}
							class="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-white focus:border-amber-500 focus:outline-none"
						/>
					</div>
					<div class="flex items-center justify-between">
						<label class="text-sm text-gray-400" for="pts-afterblow-def">Defender</label>
						<input
							id="pts-afterblow-def"
							type="number"
							bind:value={tournament.settings.afterblow.defender}
							class="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-center text-white focus:border-amber-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>
		</div>

		<button
			onclick={() => tournament.startTournament()}
			disabled={tournament.participants.length < 2}
			class="w-full rounded bg-amber-600 py-4 text-lg font-bold tracking-wider text-white uppercase shadow-lg transition-all hover:bg-amber-700 hover:shadow-amber-900/20 disabled:bg-gray-700 disabled:text-gray-500"
		>
			Start Tournament
		</button>
	</div>
</div>

<style>
	/* Custom scrollbar for webkit */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
