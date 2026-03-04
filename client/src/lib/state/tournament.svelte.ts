import { version as appVersion } from '$app/environment';

export type HitLocation = 'head' | 'body' | 'arms';

export interface Participant {
    id: number;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    totalPoints: number;
    pointsScored: number;
    pointsAgainst: number;
    matchesPlayed: number;
}

export interface Match {
    id: number;
    p1Id: number;
    p2Id: number;
    rounds: {
        p1Score: number;
        p2Score: number;
        type: 'hit' | 'double' | 'draw' | 'afterblow';
        hitLocation?: HitLocation;
        scorerId?: number;
    }[];
    status: 'pending' | 'active' | 'completed';
    winnerId?: number | null;
}

export interface Settings {
    roundsPerMatch: number;
    maxPointsEnabled: boolean;
    maxPoints: number;
    preventDraws: boolean;
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

interface TournamentSnapshot {
    version: typeof appVersion;
    participants: Participant[];
    matches: Match[];
    settings: Settings;
    currentMatchIndex: number;
    tournamentStarted: boolean;
    tournamentFinished: boolean;
    nextParticipantId: number;
    nextMatchId: number;
    savedAt: string;
}

const STORAGE_KEY = 'bhc-tournament-state';
const DEFAULT_SETTINGS: Settings = {
    roundsPerMatch: 3,
    maxPointsEnabled: false,
    maxPoints: 10,
    preventDraws: false,
    points: {
        head: 3,
        body: 2,
        arms: 1
    },
    afterblow: {
        attacker: 2,
        defender: 1
    }
};

export class TournamentStore {
    // State
    participants = $state<Participant[]>([]);
    matches = $state<Match[]>([]);
    settings = $state<Settings>({ ...DEFAULT_SETTINGS });

    currentMatchIndex = $state(0);
    tournamentStarted = $state(false);
    tournamentFinished = $state(false);

    // Monotonic ID counters (avoids collisions after participant removal)
    private nextParticipantId = 1;
    private nextMatchId = 1;

    // Derived
    currentMatch = $derived(this.matches[this.currentMatchIndex]);

    constructor() {
        this.load();
    }

    // ── Persistence ──────────────────────────────────────────────────

    private save() {
        try {
            const snapshot: TournamentSnapshot = {
                version: appVersion,
                participants: $state.snapshot(this.participants),
                matches: $state.snapshot(this.matches),
                settings: $state.snapshot(this.settings),
                currentMatchIndex: this.currentMatchIndex,
                tournamentStarted: this.tournamentStarted,
                tournamentFinished: this.tournamentFinished,
                nextParticipantId: this.nextParticipantId,
                nextMatchId: this.nextMatchId,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (e) {
            console.warn('Failed to save tournament state:', e);
        }
    }

    private load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const snapshot: TournamentSnapshot = JSON.parse(raw);
            if (snapshot.version !== appVersion) return;

            this.participants = snapshot.participants;
            this.matches = snapshot.matches;
            this.settings = snapshot.settings;
            this.currentMatchIndex = snapshot.currentMatchIndex;
            this.tournamentStarted = snapshot.tournamentStarted;
            this.tournamentFinished = snapshot.tournamentFinished;
            this.nextParticipantId = snapshot.nextParticipantId;
            this.nextMatchId = snapshot.nextMatchId;
        } catch (e) {
            console.warn('Failed to load tournament state:', e);
        }
    }

    /** Export current state as a JSON string (for manual backup / download). */
    exportState(): string {
        const snapshot: TournamentSnapshot = {
            version: appVersion,
            participants: $state.snapshot(this.participants),
            matches: $state.snapshot(this.matches),
            settings: $state.snapshot(this.settings),
            currentMatchIndex: this.currentMatchIndex,
            tournamentStarted: this.tournamentStarted,
            tournamentFinished: this.tournamentFinished,
            nextParticipantId: this.nextParticipantId,
            nextMatchId: this.nextMatchId,
            savedAt: new Date().toISOString()
        };
        return JSON.stringify(snapshot, null, 2);
    }

    /** Import state from a JSON string (for manual restore). Returns true on success. */
    importState(json: string): boolean {
        try {
            const snapshot: TournamentSnapshot = JSON.parse(json);
            if (snapshot.version !== appVersion) return false;

            this.participants = snapshot.participants;
            this.matches = snapshot.matches;
            this.settings = snapshot.settings;
            this.currentMatchIndex = snapshot.currentMatchIndex;
            this.tournamentStarted = snapshot.tournamentStarted;
            this.tournamentFinished = snapshot.tournamentFinished;
            this.nextParticipantId = snapshot.nextParticipantId;
            this.nextMatchId = snapshot.nextMatchId;

            this.save();
            return true;
        } catch (e) {
            console.warn('Failed to import tournament state:', e);
            return false;
        }
    }

    // ── Tournament Actions ───────────────────────────────────────────

    addParticipant(name: string) {
        if (!name.trim()) return;
        this.participants.push({
            id: this.nextParticipantId++,
            name: name.trim(),
            wins: 0,
            losses: 0,
            draws: 0,
            totalPoints: 0,
            pointsScored: 0,
            pointsAgainst: 0,
            matchesPlayed: 0
        });
        this.save();
    }

    removeParticipant(id: number) {
        this.participants = this.participants.filter(p => p.id !== id);
        this.save();
    }

    startTournament() {
        if (this.participants.length < 2) return;
        this.generateSchedule();
        this.tournamentStarted = true;
        this.currentMatchIndex = 0;
        this.tournamentFinished = false;

        this.participants.forEach(p => {
            p.wins = 0;
            p.losses = 0;
            p.draws = 0;
            p.totalPoints = 0;
            p.pointsScored = 0;
            p.pointsAgainst = 0;
            p.matchesPlayed = 0;
        });
        this.save();
    }

    generateSchedule() {
        let allMatches: Match[] = [];
        const ids = this.participants.map(p => p.id);

        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                allMatches.push({
                    id: this.nextMatchId++,
                    p1Id: ids[i],
                    p2Id: ids[j],
                    rounds: [],
                    status: 'pending'
                });
            }
        }

        // Biased shuffle: intentionally not Fisher-Yates so that the greedy
        // scheduler below has an easier time spacing out consecutive fights
        // for the same participant. A truly uniform shuffle would undo the
        // natural spacing from the nested-loop generation order.
        allMatches = allMatches.sort(() => Math.random() - 0.5);

        const scheduled: Match[] = [];
        const used = new Set<number>();

        while (scheduled.length < allMatches.length) {
            const lastMatch = scheduled[scheduled.length - 1];
            const lastParticipants = lastMatch ? [lastMatch.p1Id, lastMatch.p2Id] : [];

            let bestCandidateIndex = -1;

            for (let i = 0; i < allMatches.length; i++) {
                if (used.has(i)) continue;
                const m = allMatches[i];
                if (!lastParticipants.includes(m.p1Id) && !lastParticipants.includes(m.p2Id)) {
                    bestCandidateIndex = i;
                    break;
                }
            }

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
                break;
            }
        }

        this.matches = scheduled;
    }

    recordRound(type: 'hit' | 'double' | 'afterblow', scorerId?: number, location?: HitLocation) {
        if (!this.currentMatch) return;

        let p1Score = 0;
        let p2Score = 0;

        if (type === 'double') {
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

        const currentP1Total = this.currentMatch.rounds.reduce((sum, r) => sum + r.p1Score, 0);
        const currentP2Total = this.currentMatch.rounds.reduce((sum, r) => sum + r.p2Score, 0);

        const maxPointsReached = this.settings.maxPointsEnabled &&
            (currentP1Total >= this.settings.maxPoints || currentP2Total >= this.settings.maxPoints);

        const isDraw = currentP1Total === currentP2Total;
        const reachedLimit = this.currentMatch.rounds.length >= this.settings.roundsPerMatch || maxPointsReached;

        if (reachedLimit && !(this.settings.preventDraws && isDraw)) {
            this.finishMatch();
        }
        this.save();
    }

    finishMatch() {
        if (!this.currentMatch) return;

        this.currentMatch.status = 'completed';

        const p1Total = this.currentMatch.rounds.reduce((sum, r) => sum + r.p1Score, 0);
        const p2Total = this.currentMatch.rounds.reduce((sum, r) => sum + r.p2Score, 0);

        let winnerId: number | null = null;
        if (p1Total > p2Total) winnerId = this.currentMatch.p1Id;
        else if (p2Total > p1Total) winnerId = this.currentMatch.p2Id;

        this.currentMatch.winnerId = winnerId;

        const p1 = this.participants.find(p => p.id === this.currentMatch.p1Id);
        const p2 = this.participants.find(p => p.id === this.currentMatch.p2Id);

        if (p1 && p2) {
            p1.totalPoints += p1Total;
            p2.totalPoints += p2Total;

            p1.pointsScored += p1Total;
            p1.pointsAgainst += p2Total;

            p2.pointsScored += p2Total;
            p2.pointsAgainst += p1Total;

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

        if (this.currentMatchIndex < this.matches.length - 1) {
            this.currentMatchIndex++;
        } else {
            this.tournamentFinished = true;
        }
    }

    undoLastRound() {
        if (!this.tournamentStarted) return;

        if (this.currentMatch && this.currentMatch.status !== 'completed' && this.currentMatch.rounds.length > 0) {
            this.currentMatch.rounds.pop();
            this.save();
            return;
        }

        if (this.currentMatchIndex > 0 || this.tournamentFinished) {
            if (this.tournamentFinished) {
                this.tournamentFinished = false;
            } else {
                this.currentMatchIndex--;
            }

            const match = this.matches[this.currentMatchIndex];

            if (match && match.status === 'completed') {
                const p1 = this.participants.find(p => p.id === match.p1Id);
                const p2 = this.participants.find(p => p.id === match.p2Id);

                if (p1 && p2) {
                    const p1Total = match.rounds.reduce((sum, r) => sum + r.p1Score, 0);
                    const p2Total = match.rounds.reduce((sum, r) => sum + r.p2Score, 0);

                    p1.totalPoints -= p1Total;
                    p2.totalPoints -= p2Total;

                    p1.pointsScored -= p1Total;
                    p1.pointsAgainst -= p2Total;

                    p2.pointsScored -= p2Total;
                    p2.pointsAgainst -= p1Total;

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

                match.status = 'active';
                match.winnerId = null;
                match.rounds.pop();
            }
        }
        this.save();
    }

    reset() {
        this.tournamentStarted = false;
        this.tournamentFinished = false;
        this.matches = [];
        this.currentMatchIndex = 0;

        // Reset participant stats so state is clean between reset and next start
        this.participants.forEach(p => {
            p.wins = 0;
            p.losses = 0;
            p.draws = 0;
            p.totalPoints = 0;
            p.pointsScored = 0;
            p.pointsAgainst = 0;
            p.matchesPlayed = 0;
        });

        this.save();
    }

    /** Wipe everything including participants and return to a blank slate. */
    clearAll() {
        this.participants = [];
        this.matches = [];
        this.settings = { ...DEFAULT_SETTINGS };
        this.currentMatchIndex = 0;
        this.tournamentStarted = false;
        this.tournamentFinished = false;
        this.nextParticipantId = 1;
        this.nextMatchId = 1;
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const tournament = new TournamentStore();