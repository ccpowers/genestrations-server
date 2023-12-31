import express, {Express, Request, Response} from 'express';
import { Send } from "express-serve-static-core";
import dotenv from 'dotenv';
import { FinishedGame, Game, 
    GameStatus, 
    PendingGame,
    PlayerStatus,
    PromptStream,
    addPlayerToGame,
    createNewGame,
    doFinishedCheckForGame,
    doInboxCheckForPlayer,
    getImageUrlForGuessingPlayer,
    insertPlayerGuess,
    startGame } from './game';
import cors from 'cors';
import { imageGeneratorFactory } from './imageGenerator';
import morgan from 'morgan';

dotenv.config();
const port = process.env.PORT;

const app = express();
// set up middleware
app.use(cors());
app.use(express.static('public'))
app.use(express.json())
//app.use(morgan('tiny'))



// initialize global game 
let currentGame: PendingGame | Game | FinishedGame = createNewGame();

// define this to make typing requests easier
export interface TypedRequestBody<T> extends Express.Request {
    body: T
}
export interface TypedResponseBody<T> extends Response {
    ResBody: T
}
export interface TypedResponse<ResBody> extends Express.Response {
    json: Send<ResBody, this>;
}

app.get('/', (req: Request, res: Response) => {
  res.send('Genestrations backend');
});

type RegisterRequest = TypedRequestBody<{player: string, prompt: string}>;
type RegisterResponse = TypedResponse<{success: boolean, msg?: string}>;
app.post('/register', async (req: RegisterRequest, res: RegisterResponse) => {
    console.log(JSON.stringify(req.body));
    const player = req.body.player;
    const prompt = req.body.prompt;

    if( currentGame.status === 'PENDING') {
        addPlayerToGame(currentGame, player, prompt);
        res.json({success: true, msg: 'Welcome to the game!'});
    } else {
        // return error
        res.json({success: false, msg: 'Game is not pending'});
    }
});

type PlayerInfo = {name: string, status: PlayerStatus};
type InfoResponse = TypedResponse<{status: GameStatus, players: PlayerInfo[]}>;
app.get('/info', (req: Request, res: InfoResponse) => {
    let players: PlayerInfo[] = [];

    currentGame = doFinishedCheckForGame(currentGame);
    
    if (currentGame.status === 'PENDING') {
        const pendingPlayers = [...currentGame.initialPrompts.keys()];
        for (let p of pendingPlayers) {
            players.push({name: p, status: 'WAITING'})
        }
        console.log(`Got request for players in pending game with ${pendingPlayers} ${players}`);
    } else if (currentGame.status === 'RUNNING') {
        for ( let p of currentGame.players ) {
            players.push({name: p[0], status: p[1].status});
        }
        console.log(`Got request for players in running game with ${players}`)
    } else if (currentGame.status === 'FINISHED') {
        for ( let p of currentGame.players) {
            players.push({name: p[0], status: 'FINISHED'});
        }
        console.log(`Got request for players in finished game with ${players}`)
    }
    res.json({status: currentGame.status, players: players});
});

app.get('/start', (req: Request, res: Response) => {
    if (currentGame.status === 'PENDING') {
        currentGame = startGame(currentGame, imageGeneratorFactory);

        if (currentGame.status === 'RUNNING') {
            res.sendStatus(200);
        } else {
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(500);
    }
});

app.get('/reset', (req: Request, res: Response) => {
    console.log(`Resetting game`)
    currentGame = createNewGame();
    res.sendStatus(200);
});

type ImageRequest = TypedRequestBody<{player: string}>;
type ImageStatus = 'PENDING' | 'READY';
type ImageResponseJson = {success: boolean, msg: string, status: ImageStatus, url: string};
type ImageResponse = TypedResponse<ImageResponseJson>;
app.post('/image', (req: ImageRequest, res: ImageResponse) => {
    console.log(`Checking for images for ${req.body.player}`);
    if (currentGame.status != 'RUNNING') {
        console.log(`Tried to get image when game is not running.`)
        res.json({
            success: false, 
            msg: 'Tried to get image when game is not running',
            status: 'PENDING',
            url: ''
        });
    }

    // check if player is in game
    // ts should have narrowed the type already, but it did not :shrug:
    if (currentGame.status === 'RUNNING') {
        let player = currentGame.players.get(req.body.player);
        if (player !== undefined) {
            let resJson: ImageResponseJson = {success: false, msg: `No Image available for ${req.body.player}, player is ${player.status}`, status: 'PENDING', url: ''}
            
            if(player.status === 'FINISHED') {
                resJson = { success: false,
                    msg: 'Player has already finished',
                    status: 'PENDING',
                    url: ''
                }
            }

            if (player.status === 'WAITING') {
                console.log(`Checking inbox`);
                player = doInboxCheckForPlayer(player);
                // alright this is a silly combo of functional programming and mutability
                // maybe need to make doInbox check take game and return game??
                currentGame.players.set(req.body.player, player);
            } 

            // player status may have transitioned after inbox check
            if (player.status ==='GUESSING') {
                console.log(`Getting imageurl`)
                const imgUrl = getImageUrlForGuessingPlayer(player);
                resJson = { success: true,
                    msg: '',
                    status: 'READY',
                    url: imgUrl
                }
            }

            res.json(resJson);
        }
    }


});

type PromptRequest = TypedRequestBody<{player: string, prompt: string}>;
type PromptResponse = TypedResponse<{success: boolean, msg: string}>;
app.post('/prompt', async (req: Request, res: Response) => {
    // call ai api
    if ( currentGame.status === 'RUNNING' ) {
        const prompt = req.body.prompt;

        // get reference to player
        const player = currentGame.players.get(req.body.player);

        if (player === undefined) {
            res.json({success: false, msg: `Player ${req.body.player} is not in current game.`});
        } else if (player.status != 'GUESSING' ) {
            res.json({success: false, msg: `Player is not in guessing state.`})
        } else {
            const nextPlayer = insertPlayerGuess(player, prompt);
            currentGame.players.set(req.body.player, nextPlayer);
            res.json({success: true, msg: ''});
        }
    } else {
        res.json({success: false, msg: 'No game is running now.'})
    }
});

type FinishedGameRequest = TypedRequestBody<{}>;
type InfoObject = { player:string, promptStream: PromptStream};
type FinishedGameResponse = TypedResponse<{success: boolean, msg: string, info: InfoObject[]}>;
app.get('/finished', (req: FinishedGameRequest, res: FinishedGameResponse) => {
    currentGame = doFinishedCheckForGame(currentGame);

    if (currentGame.status !== 'FINISHED') {
        res.json({success: false, msg: 'Game is not in finished state.', info: []})
    } else {
        // get info and return it
        const infoObjs: InfoObject[] = [];
        for(let player of currentGame.players ) {
            infoObjs.push({player: player[0], promptStream: player[1].promptStream})
        }
        res.json({success: true, msg: 'TODO put stuff here', info: infoObjs})
    }
})

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});