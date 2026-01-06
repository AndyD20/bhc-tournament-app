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
        type: 'hit' | 'double' | 'draw';
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
        const newMatches: Match[] = [];
        const ids = this.participants.map(p => p.id);

        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                newMatches.push({
                    id: crypto.randomUUID(),
                    p1Id: ids[i],
                    p2Id: ids[j],
                    rounds: [],
                    status: 'pending'
                });
            }
        }

        // Shuffle matches for variance? Or keep standard order. 
        // Standard order is fine for now.
        this.matches = newMatches;
    }

    recordRound(type: 'hit' | 'double', scorerId?: string, location?: HitLocation) {
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
