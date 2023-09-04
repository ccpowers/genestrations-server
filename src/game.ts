import { ImageGenerator, ImageGeneratorFactory } from "./imageGenerator";

export type Round = {
    prompt: string,
    image: string,
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
    console.log(`Game prompts: ${JSON.stringify([...game.initialPrompts.keys()] )}`)
}

export function startGame(pending: PendingGame, imageGeneratorFactory: ImageGeneratorFactory) : Game | PendingGame {
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
        console.log(`Player ${players[i]} passes to ${players[i+1]}`)
        game.nextPlayer.set(players[i], players[i+1]);
    }
    console.log(`Player ${players[players.length-1]} passes to ${players[0]} ${JSON.stringify(players)}`);
    game.nextPlayer.set(players[players.length-1], players[0]);

    // update queues
    for (let player of players) {
        console.log(`Creating player queue for ${player}`);
        playerQueues.set(player, []);
    }

    for (let player of players) {
        // have to get the player and next player inboxes here for type reasons
        const playerInbox = playerQueues.get(player);
        const nextPlayer = game.nextPlayer.get(player);

        if (nextPlayer === undefined ) {
            console.log(`No next player for player ${player}. Cannot start game.`);
            return pending;
        }

        const nextPlayerInbox = playerQueues.get(nextPlayer);

        if (playerInbox === undefined || nextPlayerInbox === undefined) {
            console.log(`Either ${player} or ${nextPlayer} is missing inbox. Cannot start game.`);
            return pending;
        }

        const playerImageGenerator = imageGeneratorFactory(nextPlayerInbox, player);
        // use image generator to initialize inbox for next player
        const playerInitialPrompt = pending.initialPrompts.get(player);
        if (playerInitialPrompt === undefined) {
            console.log(`Player initial prompt for ${player} is undefined, wtf`);
            return pending;
        }
        console.log(`Generating initial image for ${player} with prompt ${playerInitialPrompt}`)
        playerImageGenerator(playerInitialPrompt, [])
        const playerState: WaitingPlayer = {
            status: 'WAITING',
            inbox: playerInbox,
            playerImageGenerator: playerImageGenerator
        }
        console.log(`Player ${player} state is ${JSON.stringify(playerState)}`);
        game.players.set(player, playerState);
    }

    // now set all players to guessing

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
        const current = player.inbox.shift();

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

export function getImageUrlForGuessingPlayer(player: GuessingPlayer) : string {
    return player.current[player.current.length-1].image;
}