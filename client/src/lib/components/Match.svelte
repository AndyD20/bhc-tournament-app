<script lang="ts">
    import { tournament, type HitLocation } from '$lib/state/tournament.svelte';

    let currentRound = $derived(tournament.currentMatch?.rounds.length || 0);
    let maxRounds = $derived(tournament.settings.roundsPerMatch);
    
    let p1 = $derived(tournament.participants.find(p => p.id === tournament.currentMatch?.p1Id));
    let p2 = $derived(tournament.participants.find(p => p.id === tournament.currentMatch?.p2Id));
    
    let p1Score = $derived(tournament.currentMatch?.rounds.reduce((sum, r) => sum + r.p1Score, 0) || 0);
    let p2Score = $derived(tournament.currentMatch?.rounds.reduce((sum, r) => sum + r.p2Score, 0) || 0);

    function recordHit(location: HitLocation, scorerId: string) {
        tournament.recordRound('hit', scorerId, location);
    }

    function recordAfterblow(scorerId: string) {
        tournament.recordRound('afterblow', scorerId);
    }

    function recordDouble() {
        tournament.recordRound('double');
    }

    const btnClass = "py-3 px-4 rounded text-white font-bold uppercase tracking-wider transition-all transform active:scale-95 shadow-lg w-full";
</script>

{#if tournament.currentMatch && p1 && p2}
    <div class="h-full flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        <!-- Match Header -->
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-amber-500 font-serif mb-2">Match {tournament.currentMatchIndex + 1}</h2>
            <div class="text-xl text-gray-400">
                Round <span class="text-white font-bold">{currentRound + 1}</span> of {maxRounds}
            </div>
        </div>

        <!-- Scoreboard -->
        <div class="flex flex-col md:flex-row w-full justify-between items-stretch gap-8 mb-12">
            <!-- P1 -->
            <div class="flex-1 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 flex flex-col items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <div class="text-4xl font-bold text-white mb-2">{p1.name}</div>
                <div class="text-6xl font-black text-blue-400 mb-6">{p1Score}</div>
                
                <div class="grid grid-cols-1 gap-2 w-full">
                    <button onclick={() => recordHit('head', p1.id)} class="{btnClass} bg-blue-600 hover:bg-blue-500">
                        Head (+{tournament.settings.points.head})
                    </button>
                    <button onclick={() => recordHit('body', p1.id)} class="{btnClass} bg-blue-700 hover:bg-blue-600">
                        Body (+{tournament.settings.points.body})
                    </button>
                    <button onclick={() => recordHit('arms', p1.id)} class="{btnClass} bg-blue-800 hover:bg-blue-700">
                        Arms (+{tournament.settings.points.arms})
                    </button>
                    <button onclick={() => recordAfterblow(p1.id)} class="{btnClass} bg-indigo-900/80 hover:bg-indigo-800 border-t border-white/10 mt-2">
                        Hit/Afterblow (+{tournament.settings.afterblow.attacker}/{tournament.settings.afterblow.defender})
                    </button>
                </div>
            </div>

            <!-- VS / Controls -->
            <div class="flex flex-col items-center justify-center gap-4">
                <div class="text-2xl font-black text-gray-600 italic">VS</div>
                
                <button 
                    onclick={recordDouble}
                    class="bg-red-900/50 hover:bg-red-800 border border-red-500/50 text-red-200 font-bold py-4 px-8 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:scale-105 transition-all w-full md:w-auto text-center"
                >
                    Double Hit
                </button>
            </div>

            <!-- P2 -->
            <div class="flex-1 bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex flex-col items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <div class="text-4xl font-bold text-white mb-2">{p2.name}</div>
                <div class="text-6xl font-black text-red-400 mb-6">{p2Score}</div>
                
                <div class="grid grid-cols-1 gap-2 w-full">
                    <button onclick={() => recordHit('head', p2.id)} class="{btnClass} bg-red-600 hover:bg-red-500">
                        Head (+{tournament.settings.points.head})
                    </button>
                    <button onclick={() => recordHit('body', p2.id)} class="{btnClass} bg-red-700 hover:bg-red-600">
                        Body (+{tournament.settings.points.body})
                    </button>
                    <button onclick={() => recordHit('arms', p2.id)} class="{btnClass} bg-red-800 hover:bg-red-700">
                        Arms (+{tournament.settings.points.arms})
                    </button>
                    <button onclick={() => recordAfterblow(p2.id)} class="{btnClass} bg-rose-900/80 hover:bg-rose-800 border-t border-white/10 mt-2">
                        Hit/Afterblow (+{tournament.settings.afterblow.attacker}/{tournament.settings.afterblow.defender})
                    </button>
                </div>
            </div>
        </div>

        <!-- History / Last Action -->
        {#if tournament.currentMatch.rounds.length > 0}
            <div class="text-gray-400 text-sm italic">
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
    </div>
{:else}
    <div class="text-center text-white">Loading match data...</div>
{/if}
