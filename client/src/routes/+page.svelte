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

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
    <!-- Header -->
    <header class="p-6 border-b border-white/10 flex justify-between items-center shadow-lg bg-black/20 backdrop-blur-sm">
        <h1 class="text-2xl md:text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 truncate">
            ⚔️ BHC Tournament Tracker
        </h1>
        {#if tournament.tournamentStarted && !tournament.tournamentFinished}
            <div class="text-sm text-gray-400 hidden md:block">
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
    <footer class="p-4 text-center text-xs text-gray-600 border-t border-white/5">
        &copy; {new Date().getFullYear()} Tournament Tracker
    </footer>
</div>
