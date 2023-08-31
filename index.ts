import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import {writeFileSync, createWriteStream} from 'fs';
dotenv.config();

const app = express();
const port = process.env.PORT;
const API_TOKEN = process.env.API_TOKEN;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server?');
});

app.use(express.static('public'))

app.get('/prompt', async (req: Request, res: Response) => {
    // call ai api
    const resp = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
        "headers": {
          Authorization: `Bearer ${API_TOKEN}`
        },
        "body": "{\"inputs\":\"cookie monster at the woods\"}",
        "method": "POST"
      });
    const buf = await resp.arrayBuffer();
    writeFileSync("public/image3.jpeg", new Uint8Array(buf), {mode: '0777'});
    // console.log(`Got image response: ${JSON.stringify(resp)}`)
    // save to public folder
    //const reader = resp.body?.getReader();
    // const imgString = new Uint8Array(imgBuffer).toString();
    //writeFile('image.jpeg', imgString, err => {
    //    if(err) {
    //        console.error(err);
    //    }
    //});
    /*
    let writeStream = createWriteStream('image2.jpeg');
    writeStream.write(resp.body);
    writeStream.on('finish', () => {
        console.log('wrote all data to file');
        let imageUrl: string = '??';
        res.send(imageUrl);
    });
    */
    //console.log('Done saving file')
    // send url??
    res.send("??");

});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});