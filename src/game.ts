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

export type PlayerStatus = 'WAITING' | 'GUESSING' | 'FINISHED';
export type WaitingPlayer = {
    status: 'WAITING',
} & PlayerState;

export type GuessingPlayer = {
    status: 'GUESSING',
    current: PromptStream
} & PlayerState;

export type FinishedPlayer = {
    status: 'FINISHED',
    promptStream: PromptStream,
    name: string
};

export type PlayerState = {
    playerImageGenerator: ImageGenerator,
    inbox: PromptStreamQueue,
    name: string
}

export type PendingGame = {
    status: 'PENDING',
    initialPrompts: Map<string, string>
}

export type PlayerUnion = (GuessingPlayer | WaitingPlayer | FinishedPlayer);
export type Game = {
    status: 'RUNNING',
    players: Map<string, PlayerUnion>,
    nextPlayer: Map<string, string>,
}

export type FinishedGame = {
    status: 'FINISHED',
    players: Map<string, FinishedPlayer>
}

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

    // if there are too few players, don't start the game
    const players = [ ...pending.initialPrompts.keys()];

    if (players.length < 3) {
        console.log(`Attempting to start game with fewer than three players.`);
        return pending;
    }

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
            name: player,
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
        name: player.name,
        playerImageGenerator: player.playerImageGenerator,
        inbox: player.inbox
    }

    return waitingPlayer;

}

export function doInboxCheckForPlayer(player: WaitingPlayer) : WaitingPlayer | GuessingPlayer | FinishedPlayer {
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
        
        if (current.length === 0) {
            // this is an error!! 
            console.log(`Why is prompt stream length 0??`);
            return player;
        } else {
            const firstPrompt = current[0];
            if (firstPrompt.player == player.name) {
                console.log(`Player ${player.name} got their own stack back, they are done!`);

                return {
                    status: 'FINISHED',
                    name: player.name,
                    promptStream: current
                };
            }
        }

        const guessingPlayer: GuessingPlayer = {
            status: 'GUESSING',
            inbox: player.inbox,
            current: current, 
            name: player.name,
            playerImageGenerator: player.playerImageGenerator
        };
        
        return guessingPlayer;
    }


}

export function getImageUrlForGuessingPlayer(player: GuessingPlayer) : string {
    return player.current[player.current.length-1].image;
}

export function doFinishedCheckForGame(game: Game | FinishedGame | PendingGame) : Game | FinishedGame | PendingGame {
    // if game is already done, return
    if (game.status === 'FINISHED' || game.status === 'PENDING') {
        return game;
    }
    
    // check if all players are finished
    let allFinished = true;

    const finishedGame: FinishedGame = {
        status: 'FINISHED',
        players: new Map<string, FinishedPlayer>()
    }

    for (let player of game.players) {
        if (player[1].status === 'FINISHED') {
            finishedGame.players.set(player[0], player[1]);
        } else {
            allFinished = false;
            console.log(`Game is not over, player ${player[0]} is not finished.`);
        }
    }

    if( !allFinished ) {
        return game;
    } else {
        return finishedGame;
    }
}