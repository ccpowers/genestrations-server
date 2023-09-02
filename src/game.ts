import { ImageGenerator, ImageGeneratorFactory } from "./imageGenerator";

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

export type WaitingPlayer = {
    status: 'WAITING',
} & PlayerState;

export type GuessingPlayer = {
    status: 'GUESSING',
    current: PromptStream
} & PlayerState;

export type PlayerState = {
    playerImageGenerator: ImageGenerator,
    inbox: PromptStreamQueue
}

export type PendingGame = {
    status: 'PENDING',
    initialPrompts: Map<string, string>
}

export type PlayerUnion = (GuessingPlayer | WaitingPlayer);
export type Game = {
    status: 'RUNNING',
    players: Map<string, PlayerUnion>,
    nextPlayer: Map<string, string>,
}

/**export type FinalizedGame = {

}**/

export function createNewGame(): PendingGame {
    return {
        status: 'PENDING',
        initialPrompts: new Map<string, string>()
    };
}

export function addPlayerToGame(game: PendingGame, player: string, prompt: string) {
    console.log(`Adding player ${player} to pending game`);
    game.initialPrompts.set(player, prompt);
}

export function startGame(pending: PendingGame, imageGeneratorFactory: ImageGeneratorFactory) : Game | boolean{
    const game: Game = {
        status: 'RUNNING',
        players: new Map<string, PlayerUnion>(),
        nextPlayer: new Map<string, string>()
    }


    const players = [ ...pending.initialPrompts.keys()];
    console.log(`Starting pending game with players ${JSON.stringify(players)}`)
    const playerQueues = new Map<string, PromptStreamQueue>();
    // create positions map
    for (let i=0; i < players.length - 1; i++) {
        game.nextPlayer.set(players[i], players[i+1]);
        // all the queues must be created before the image generators

    }

    game.nextPlayer.set(players[players.length], players[0]);

    // update queues
    for (let player in players) {
        playerQueues.set(player, []);
    }

    for (let player in players) {
        // have to get the player and next player inboxes here for type reasons
        const playerInbox = playerQueues.get(player);
        const nextPlayer = game.nextPlayer.get(player);

        if (nextPlayer === undefined ) {
            return false;
        }

        const nextPlayerInbox = playerQueues.get(nextPlayer);

        if (playerInbox === undefined || nextPlayerInbox === undefined) {
            return false;
        }

        const playerImageGenerator = imageGeneratorFactory(nextPlayerInbox, player);
        const playerState: PlayerUnion = {
            status: 'WAITING',
            inbox: playerInbox,
            playerImageGenerator: playerImageGenerator
        }

        game.players.set(player, playerState);
    }
    console.log(`Done starting game ${JSON.stringify(game)}`);
    return game;
}

export function insertPlayerGuess(player: GuessingPlayer, prompt: string) : WaitingPlayer {
    const playerImageGenerator = player.playerImageGenerator;
    playerImageGenerator(prompt, player.current);

    // set current to null
    const waitingPlayer: WaitingPlayer = {
        status: 'WAITING',
        playerImageGenerator: player.playerImageGenerator,
        inbox: player.inbox
    }

    return waitingPlayer;

}



export function doInboxCheckForPlayer(player: WaitingPlayer) : WaitingPlayer | GuessingPlayer {
    // if inbox is not empty, return guessing player
    if (player.inbox.length === 0) {
        return player;
    } else {
        // get first item out of inbox
        const current = player.inbox.pop();

        // we've already checked inbox length, but whatever
        if (current === undefined) {
            return player;
        }

        const guessingPlayer: GuessingPlayer = {
            status: 'GUESSING',
            inbox: player.inbox,
            current: current, 
            playerImageGenerator: player.playerImageGenerator
        };
        
        return guessingPlayer;
    }


}