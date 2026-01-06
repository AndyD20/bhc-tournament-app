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

    function removeParticipant(id: string) {
        tournament.removeParticipant(id);
    }
</script>

<div class="space-y-8 p-4 max-w-2xl mx-auto">
    <div class="bg-white/5 p-6 rounded-xl border border-white/10 shadow-xl">
        <h2 class="text-2xl font-bold mb-4 font-serif text-amber-500">Tournament Setup</h2>
        
        <!-- Participants -->
        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-2 text-gray-200">Participants</h3>
            <form onsubmit={addParticipant} class="flex gap-2 mb-4">
                <input 
                    type="text" 
                    bind:value={newParticipantName} 
                    placeholder="Enter fighter name..." 
                    class="flex-1 bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                />
                <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50">
                    Add
                </button>
            </form>

            {#if tournament.participants.length > 0}
                <ul class="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {#each tournament.participants as p (p.id)}
                        <li class="flex justify-between items-center bg-white/5 p-3 rounded group animate-in fade-in slide-in-from-top-2">
                            <span class="font-medium text-gray-200">{p.name}</span>
                            <button 
                                onclick={() => removeParticipant(p.id)}
                                class="text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label="Remove participant"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="text-gray-500 italic text-sm">No details added yet.</p>
            {/if}
        </div>

        <!-- Settings -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
                <h3 class="text-lg font-semibold mb-3 text-gray-200">Match Settings</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1" for="rounds">Rounds per Fight</label>
                        <input 
                            id="rounds"
                            type="number" 
                            min="1" 
                            max="20" 
                            bind:value={tournament.settings.roundsPerMatch}
                            class="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 class="text-lg font-semibold mb-3 text-gray-200">Points</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="text-sm text-gray-400" for="pts-head">Head</label>
                        <input 
                            id="pts-head"
                            type="number" 
                            bind:value={tournament.settings.points.head}
                            class="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-sm text-gray-400" for="pts-body">Body</label>
                        <input 
                            id="pts-body"
                            type="number" 
                            bind:value={tournament.settings.points.body}
                            class="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-sm text-gray-400" for="pts-arms">Arms/Hands</label>
                        <input 
                            id="pts-arms"
                            type="number" 
                            bind:value={tournament.settings.points.arms}
                            class="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>
        </div>

        <button 
            onclick={() => tournament.startTournament()}
            disabled={tournament.participants.length < 2}
            class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded text-lg uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-900/20"
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
