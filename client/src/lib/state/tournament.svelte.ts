import { browser } from '$app/environment';

export type HitLocation = 'head' | 'body' | 'arms';

export interface Participant {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    totalPoints: number;
    matchesPlayed: number;
}

export interface Match {
    id: string;
    p1Id: string;
    p2Id: string;
    rounds: {
        p1Score: number;
        p2Score: number;
        type: 'hit' | 'double' | 'draw' | 'afterblow';
        hitLocation?: HitLocation; // For p1 or p2 hit
        scorerId?: string; // Who got the points
    }[];
    status: 'pending' | 'active' | 'completed';
    winnerId?: string | null; // null for draw
}

export interface Settings {
    roundsPerMatch: number;
    points: {
        head: number;
        body: number;
        arms: number;
    };
    afterblow: {
        attacker: number;
        defender: number;
    };
}

export class TournamentStore {
    // State
    participants = $state<Participant[]>([]);
    matches = $state<Match[]>([]);
    settings = $state<Settings>({
        roundsPerMatch: 3,
        points: {
            head: 3,
            body: 2,
            arms: 1
        },
        afterblow: {
            attacker: 2,
            defender: 1
        }
    });

    currentMatchIndex = $state(0);
    tournamentStarted = $state(false);
    tournamentFinished = $state(false);

    // Derived
    currentMatch = $derived(this.matches[this.currentMatchIndex]);

    constructor() {
        // Load from local storage if available? Maybe later.
    }

    addParticipant(name: string) {
        if (!name.trim()) return;
        this.participants.push({
            id: crypto.randomUUID(),
            name: name.trim(),
            wins: 0,
            losses: 0,
            draws: 0,
            totalPoints: 0,
            matchesPlayed: 0
        });
    }

    removeParticipant(id: string) {
        this.participants = this.participants.filter(p => p.id !== id);
    }

    startTournament() {
        if (this.participants.length < 2) return;
        this.generateSchedule();
        this.tournamentStarted = true;
        this.currentMatchIndex = 0;
        this.tournamentFinished = false;

        // Reset stats
        this.participants.forEach(p => {
            p.wins = 0;
            p.losses = 0;
            p.draws = 0;
            p.totalPoints = 0;
            p.matchesPlayed = 0;
        });
    }

    generateSchedule() {
        // Round robin: every participant fights every other participant
        let allMatches: Match[] = [];
        const ids = this.participants.map(p => p.id);

        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                allMatches.push({
                    id: crypto.randomUUID(),
                    p1Id: ids[i],
                    p2Id: ids[j],
                    rounds: [],
                    status: 'pending'
                });
            }
        }

        // Shuffle initially for randomness baseline
        allMatches = allMatches.sort(() => Math.random() - 0.5);

        const scheduled: Match[] = [];
        const used = new Set<number>(); // indices of allMatches used

        // Greedy approach to build schedule minimizing consecutive fights
        while (scheduled.length < allMatches.length) {
            const lastMatch = scheduled[scheduled.length - 1];
            const lastParticipants = lastMatch ? [lastMatch.p1Id, lastMatch.p2Id] : [];

            // Find best candidate in remaining pool
            let bestCandidateIndex = -1;

            // 1. Try to find match where neither player fought immediately before
            for (let i = 0; i < allMatches.length; i++) {
                if (used.has(i)) continue;

                const m = allMatches[i];
                if (!lastParticipants.includes(m.p1Id) && !lastParticipants.includes(m.p2Id)) {
                    bestCandidateIndex = i;
                    break;
                }
            }

            // 2. Fallback: If no perfect candidate, just pick the first available
            if (bestCandidateIndex === -1) {
                for (let i = 0; i < allMatches.length; i++) {
                    if (!used.has(i)) {
                        bestCandidateIndex = i;
                        break;
                    }
                }
            }

            if (bestCandidateIndex !== -1) {
                used.add(bestCandidateIndex);
                scheduled.push(allMatches[bestCandidateIndex]);
            } else {
                break; // Should never happen if loop logic is correct
            }
        }

        this.matches = scheduled;
    }

    recordRound(type: 'hit' | 'double' | 'afterblow', scorerId?: string, location?: HitLocation) {
        if (!this.currentMatch) return;

        let p1Score = 0;
        let p2Score = 0;

        if (type === 'double') {
            // Double hit: both get 0 score designated for double, usually treated as null round or specific rule
            // User request: "mark a double hit round where both participants recieve a score of zero"
            p1Score = 0;
            p2Score = 0;
        } else if (type === 'hit' && scorerId && location) {
            const points = this.settings.points[location];
            if (scorerId === this.currentMatch.p1Id) {
                p1Score = points;
            } else {
                p2Score = points;
            }
        } else if (type === 'afterblow' && scorerId) {
            // Scorer is the Attacker (initiator)
            // Opponent is the Defender (afterblow)
            const ptsAttacker = this.settings.afterblow.attacker;
            const ptsDefender = this.settings.afterblow.defender;

            if (scorerId === this.currentMatch.p1Id) {
                p1Score = ptsAttacker;
                p2Score = ptsDefender;
            } else {
                p2Score = ptsAttacker;
                p1Score = ptsDefender;
            }
        }

        this.currentMatch.rounds.push({
            p1Score,
            p2Score,
            type,
            hitLocation: location,
            scorerId
        });

        // Check if match is finished
        if (this.currentMatch.rounds.length >= this.settings.roundsPerMatch) {
            this.finishMatch();
        }
    }

    finishMatch() {
        if (!this.currentMatch) return;

        this.currentMatch.status = 'completed';

        // Calculate totals
        const p1Total = this.currentMatch.rounds.reduce((sum, r) => sum + r.p1Score, 0);
        const p2Total = this.currentMatch.rounds.reduce((sum, r) => sum + r.p2Score, 0);

        // Determine winner
        let winnerId: string | null = null;
        if (p1Total > p2Total) winnerId = this.currentMatch.p1Id;
        else if (p2Total > p1Total) winnerId = this.currentMatch.p2Id;

        this.currentMatch.winnerId = winnerId;

        // Update participant stats
        const p1 = this.participants.find(p => p.id === this.currentMatch.p1Id);
        const p2 = this.participants.find(p => p.id === this.currentMatch.p2Id);

        if (p1 && p2) {
            p1.totalPoints += p1Total;
            p2.totalPoints += p2Total;
            p1.matchesPlayed++;
            p2.matchesPlayed++;

            if (winnerId === p1.id) {
                p1.wins++;
                p2.losses++;
            } else if (winnerId === p2.id) {
                p2.wins++;
                p1.losses++;
            } else {
                p1.draws++;
                p2.draws++;
            }
        }

        // Advance or Finish
        if (this.currentMatchIndex < this.matches.length - 1) {
            this.currentMatchIndex++;
        } else {
            this.tournamentFinished = true;
        }
    }

    undoLastRound() {
        if (!this.tournamentStarted) return;

        // If current match is potentially in progress (has rounds)
        if (this.currentMatch && this.currentMatch.rounds.length > 0) {
            this.currentMatch.rounds.pop();
            return;
        }

        // If current match is empty, we might have just finished the previous match
        // Or we are at the end of tournament (tournamentFinished might be true)
        if (this.currentMatchIndex > 0 || this.tournamentFinished) {
            // If tournament was finished, we need to un-finish it
            if (this.tournamentFinished) {
                this.tournamentFinished = false;
                // currentMatchIndex stays same if we finished (last match), 
                // BUT my finishMatch logic increments index if < length-1. 
                // If it was the *last* match, it sets tournamentFinished = true.
                // Does it increment index on the last match?
                // logic: if (index < length - 1) index++ else finished=true.
                // So if finished, index is pointing to the LAST match.
            } else {
                // If not finished, we are at a new fresh match (index advanced), so step back
                this.currentMatchIndex--;
            }

            const match = this.currentMatch;

            if (match && match.status === 'completed') {
                // Revert stats
                const p1 = this.participants.find(p => p.id === match.p1Id);
                const p2 = this.participants.find(p => p.id === match.p2Id);

                if (p1 && p2) {
                    const p1Total = match.rounds.reduce((sum, r) => sum + r.p1Score, 0);
                    const p2Total = match.rounds.reduce((sum, r) => sum + r.p2Score, 0);

                    p1.totalPoints -= p1Total;
                    p2.totalPoints -= p2Total;
                    p1.matchesPlayed--;
                    p2.matchesPlayed--;

                    if (match.winnerId === p1.id) {
                        p1.wins--;
                        p2.losses--;
                    } else if (match.winnerId === p2.id) {
                        p2.wins--;
                        p1.losses--;
                    } else {
                        p1.draws--;
                        p2.draws--;
                    }
                }

                // Revert match status
                match.status = 'active';
                match.winnerId = null;

                // Pop the round that caused the finish
                match.rounds.pop();
            }
        }
    }

    reset() {
        this.tournamentStarted = false;
        this.tournamentFinished = false;
        this.matches = [];
        this.currentMatchIndex = 0;
    }
}

// Singleton context key if we want to use context, or just export a store instance if global.
// For Svelte 5, creating a global store instance is easy.
export const tournament = new TournamentStore();
