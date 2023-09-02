export type Round = {
    prompt: string,
    image: string | null,
}

export type PromptStream = Round[]

export type GameStatus = 'PENDING' | 'RUNNING' | 'FINISHED';
export type Game = {
    status: GameStatus,
    promptStreams: Map<string, PromptStream>
    playerPositions: Map<string, string | undefined>
}

export function createNewGame(): Game {
    return {
        status: 'PENDING',
        promptStreams: new Map<string, PromptStream>(),
        playerPositions: new Map<string, string | undefined>()
    };
}

export function addPlayerToGame(game: Game, player: string, prompt: string, imageUrl: string): Game {
    // create a new prompt stream for player
    const playerPromptStream: PromptStream = [{prompt: prompt, image: imageUrl }];

    // start player pointer to last player
    const lastPlayer = [ ...game.promptStreams.keys()].pop();

    game.promptStreams.set(player, playerPromptStream);
    game.playerPositions.set(player, lastPlayer);
    return game;
}

export function insertPlayerGuess(game: Game, player: string, prompt: string, imageUrl: string) : boolean {
    // find which stream to put it in
    const playerPosition = game.playerPositions.get(player);

    if (playerPosition) {
        const stream = game.promptStreams.get(playerPosition);

        if (stream) {
            stream.push({prompt: prompt, image: imageUrl});
        } else {
            return false;
        }
    } else {
        return false;
    }

    // update pointer

    return true;
}

export function getImageUrlForPlayer() {

}