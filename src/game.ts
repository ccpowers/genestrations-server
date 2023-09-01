export type Round = {
    prompt: string,
    image: string | null,
}

export type PromptStream = Round[]


export type Game = {
    status: 'PENDING' | 'RUNNING' | 'FINISHED',
    promptStreams: Map<string, PromptStream>
}