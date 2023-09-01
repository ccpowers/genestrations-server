export type Round = {
    prompt: string,
    image: string | null,
}

export type PromptStream = Round[]

export type GameStatus = 'PENDING' | 'RUNNING' | 'FINISHED';
export type Game = {
    status: GameStatus,
    promptStreams: Map<string, PromptStream>
}

export function createNewGame(): Game {
    return {
        status: 'PENDING',
        promptStreams: new Map<string, PromptStream>()
    };
}