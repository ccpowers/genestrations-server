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
    playerInbox: Map<string, PromptStreamQueue>
    playerOutbox: Map<string, PromptStreamQueue>
}

export function createNewGame(): Game {
    return {
        status: 'PENDING',
        players: new Map<string, PromptStreamQueue>(),
    };
}

export function addPlayerToGame(game: Game, player: string, prompt: string, imageUrl: string): boolean {
    if ( game.status === "RUNNING" ){
        return false;
    }
    // create a new prompt stream for player
    const playerPromptStream: PromptStream = [{prompt: prompt, image: imageUrl, player: player }];

    game.playerOutbox.set(player, [ playerPromptStream ]);

    return true;
}

export function startGame(game: Game) {
    const players = [ ...game.promptStreams.keys()];
    
    // create positions map
    for (let i=0; i < players.length - 1; i++) {
        game.playerPositions.set(players[i], players[i+1]);
    }
    game.playerPositions.set(players[players.length], players[0]);

    // update queues
    for (let player in players) {
        // pop item off player's prompt stream
        const item = game.promptStreams.get(player)?.shift();

        // pass to next player
        const nextPlayer = game.playerPositions.get(player);

        if (item === undefined || nextPlayer === undefined) {
            console.log('error')
            return
        }
        game.promptStreams.get(nextPlayer)?.push(item);
    }
    
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
    const playersInOrder = [ ...game.playerPositions.keys() ];
    const currentPlayerPosition = game.playerPositions.get(player);
    if (currentPlayerPosition === undefined) {
        return false;
    }

    const currentPlayerIndex = playersInOrder.indexOf(currentPlayerPosition);
    const nextPlayerPosition = (currentPlayerIndex - 1 >= 0) ? currentPlayerIndex - 1 : playersInOrder.length; // wrap around to back of list
    console.log(`Updating position for ${player} from ${currentPlayerIndex} to ${nextPlayerPosition}`);
    game.playerPositions.set(player, playersInOrder[nextPlayerPosition]);

    return true;
}

export function getImageUrlForPlayer() {

}