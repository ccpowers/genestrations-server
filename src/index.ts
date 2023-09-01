import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {writeFileSync, createWriteStream} from 'fs';
import { Game, PromptStream } from './game';
import cors from 'cors';
import { generateImage } from './imageGenerator';
dotenv.config();

const app = express();
// allow cors
app.use(cors());
const port = process.env.PORT;
const API_TOKEN = process.env.API_TOKEN;
const currentGame: Game = {
    status: 'PENDING',
    promptStreams: new Map<string, PromptStream>()
};

export interface TypedRequestBody<T> extends Express.Request {
    body: T
}


app.get('/', (req: Request, res: Response) => {
  res.send('Genestrations backend');
});

app.use(express.static('public'))
app.use(express.json())
type RegisterRequest = TypedRequestBody<{player: string, prompt: string}>;
app.post('/register', async (req: RegisterRequest, res: Response) => {
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
        // todo return number/names of other players?
        const players = currentGame.promptStreams.keys();
        res.send(JSON.stringify(players));
    } else {
        console.log('Cannot register player when game is running.');
        res.sendStatus(500);
    }
});

app.get('/start', (req: Request, res: Response) => {
    if (currentGame.status === 'PENDING') {
        currentGame.status = 'RUNNING';
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

type ImageRequest = TypedRequestBody<{player: string}>;
app.get('/image', (req: Request, res: Response) => {
    if (currentGame.status != 'RUNNING') {
        console.log(`Tried to get image when game is not running.`)
        res.sendStatus(500);
    }

    // check if player is in game
    if (!currentGame.promptStreams.has(req.body.player)) {
        console.log(`Player ${req.body.player} not found in game`)
        res.sendStatus(500);
    }

    // check if image is available yet
    res.sendStatus(200);

});

app.get('/prompt', async (req: Request, res: Response) => {
    // call ai api
    const fn = generateImage(req.body.prompt);
    res.send(fn);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});