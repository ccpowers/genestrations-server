import express, {Express, Request, Response} from 'express';
import { Send } from "express-serve-static-core";
import dotenv from 'dotenv';
import { Game, GameStatus, PromptStream, createNewGame } from './game';
import cors from 'cors';
import { generateImage } from './imageGenerator';
dotenv.config();
const port = process.env.PORT;

const app = express();
// set up middleware
app.use(cors());
app.use(express.static('public'))
app.use(express.json())



// initialize global game 
let currentGame: Game = createNewGame();

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
type RegisterResponse = TypedResponse<{success: boolean, msg?: string, players?: string[]}>;
app.post('/register', async (req: RegisterRequest, res: RegisterResponse) => {
    console.log(JSON.stringify(req.body));
    if (currentGame.status === 'PENDING') {
        // create a new prompt stream for player
        const playerPromptStream: PromptStream = [{prompt: req.body.player, image: null }];

        // insert into game
        // todo ensure player has unique name
        currentGame.promptStreams.set(req.body.player, playerPromptStream);

        console.log(`Added ${req.body.player} with prompt ${req.body.prompt}`);

        // kick off request to create image
        const fn = generateImage(req.body.prompt);
        playerPromptStream[0].image = (await fn);
        console.log(`Saved image ${playerPromptStream[0].image}`);

        // return number/names of other players?
        const players = [ ...currentGame.promptStreams.keys() ];
        res.json({success: true, msg: '', players: players});
    } else {
        console.log('Cannot register player when game is running.');
        res.json({success: false, msg: 'Cannot register while game is in progress', players: []});
    }
});

type InfoResponse = TypedResponse<{status: GameStatus, players: string[]}>;
app.get('/info', (req: Request, res: InfoResponse) => {
    res.json({status: currentGame.status, players: [...currentGame.promptStreams.keys()]});
});

app.get('/start', (req: Request, res: Response) => {
    if (currentGame.status === 'PENDING') {
        currentGame.status = 'RUNNING';
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

app.get('/reset', (req: Request, res: Response) => {
    currentGame = createNewGame();
    res.sendStatus(200);
});

type ImageRequest = TypedRequestBody<{player: string}>;
type ImageStatus = 'PENDING' | 'READY';
type ImageResponse = TypedResponse<{success: boolean, msg: string, status: ImageStatus, url: string}>;
app.get('/image', (req: ImageRequest, res: ImageResponse) => {
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
    if (!currentGame.promptStreams.has(req.body.player)) {
        const msg: string = `Player ${req.body.player} not found in game`;
        console.log(msg);
        res.json({
            success: false,
            msg: msg,
            status: 'PENDING', 
            url: ''
        });
    }

    // check if image is available yet
    // TODO how to get image?
    const imageAvailable: boolean = false;
    if (!imageAvailable) {
        res.json({
            success: true,
            msg: '',
            status: 'PENDING', 
            url: ''
        })
    }

});


app.get('/prompt', async (req: Request, res: Response) => {
    // call ai api
    const fn = generateImage(req.body.prompt);
    res.send(fn);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});