export type Round = {
    prompt: string,
    image: string | null,
    player: string
}

export type PromptStream = Round[]

export type PromptStreamQueue = PromptStream[]

export type GameStatus = 'PENDING' | 'RUNNING' | 'FINISHED';

export type PlayerList = {
    player: string,
    nextPlayer: PlayerList
}

export type Game = {
    status: GameStatus,
    players: Map<string, PlayerState>,
    nextPlayer: Map<string, string>
}

export type PlayerState = {
    current: PromptStream | null,
    inbox: PromptStreamQueue
}

export function createNewGame(): Game {
    return {
        status: 'PENDING',
        players: new Map<string, PlayerState>(),
        nextPlayer: new Map<string, string>()
    };
}

export function addPlayerToGame(game: Game, player: string, prompt: string, imageUrl: string): boolean {
    if ( game.status === "RUNNING" ){
        return false;
    }
    // create a new prompt stream for player
    const playerPromptStream: PromptStream = [{prompt: prompt, image: imageUrl, player: player }];

    game.players.set(player, {current: playerPromptStream, inbox: []});

    return true;
}

export function startGame(game: Game) {
    const players = [ ...game.players.keys()];
    
    // create positions map
    for (let i=0; i < players.length - 1; i++) {
        game.nextPlayer.set(players[i], players[i+1]);
    }

    game.nextPlayer.set(players[players.length], players[0]);

    // update queues
    for (let player in players) {
        // pop item off player's prompt stream
        const item = game.players.get(player)?.current;

        // pass to next player
        const nextPlayer = game.nextPlayer.get(player);

        if (item === undefined || item === null || nextPlayer === undefined) {
            console.log('error')
            return
        }
        game.players.get(nextPlayer)?.inbox.push(item);
    }
    
}

export function insertPlayerGuess(game: Game, player: string, prompt: string, imageUrl: string) : boolean {
    // get player state
    const playerState = game.players.get(player);

    if (playerState === undefined) {
        return false;
    }

    // add guess to current
    const current = playerState.current;

    if (current === undefined || current === null) {
        return false;
    }

    current.push({prompt: prompt, player: player, image: imageUrl});

    // push current to inbox of next player
    const nextPlayer = game.nextPlayer.get(player);

    if (nextPlayer === undefined) {
        return false;
    }

    game.players.get(nextPlayer)?.inbox.push(current);

    // set current to null
    playerState.current = null;

    return true;

}

export function getImageUrlForPlayer() {
    // see if current is not null

    // return image url

}