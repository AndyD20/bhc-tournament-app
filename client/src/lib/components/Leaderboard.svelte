<script lang="ts">
    import { tournament } from '$lib/state/tournament.svelte';

    // Sort participants by Wins desc, then Total Points desc
    let sortedParticipants = $derived([...tournament.participants].sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.totalPoints - a.totalPoints;
    }));
</script>

<div class="max-w-4xl mx-auto p-4 flex flex-col h-full">
    <h2 class="text-4xl font-bold text-center text-amber-500 font-serif mb-8">Tournament Results</h2>

    <div class="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex-1">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-black/40 text-amber-500 uppercase text-sm tracking-wider font-bold">
                    <tr>
                        <th class="p-4">Rank</th>
                        <th class="p-4">Fighter</th>
                        <th class="p-4 text-center">Wins</th>
                        <th class="p-4 text-center">Losses</th>
                        <th class="p-4 text-center">Draws</th>
                        <th class="p-4 text-right">Total Points</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    {#each sortedParticipants as p, i (p.id)}
                        <tr class="hover:bg-white/5 transition-colors">
                            <td class="p-4 font-bold text-gray-400">#{i + 1}</td>
                            <td class="p-4 font-bold text-white text-lg">{p.name}</td>
                            <td class="p-4 text-center text-green-400 font-bold">{p.wins}</td>
                            <td class="p-4 text-center text-red-400">{p.losses}</td>
                            <td class="p-4 text-center text-gray-400">{p.draws}</td>
                            <td class="p-4 text-right text-amber-400 font-mono font-bold">{p.totalPoints}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <div class="mt-8 flex justify-center">
        <button 
            onclick={() => tournament.reset()}
            class="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-3 px-8 rounded transition-all uppercase tracking-widest"
        >
            New Tournament
        </button>

        <button 
            onclick={() => tournament.undoLastRound()}
            class="ml-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 font-bold py-3 px-8 rounded transition-all uppercase tracking-widest"
        >
            Undo Last Action
        </button>
    </div>
</div>
