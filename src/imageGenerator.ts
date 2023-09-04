import { writeFileSync } from "fs";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { PromptStream, PromptStreamQueue } from "./game";
dotenv.config();
const API_TOKEN = `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`;


/** returns an image Generator that will take a prompt, and place it and the generated image
 * into the nextQueue when the image is ready
 */
export type ImageGenerator = (prompt: string, stream: PromptStream) => Promise<void>;
export type ImageGeneratorFactory = (nextQueue: PromptStreamQueue, player: string) => ImageGenerator;
export function imageGeneratorFactory(nextQueue: PromptStreamQueue, player: string) {

    const ig = async (prompt: string, stream: PromptStream) => {
        generateImage(prompt).then((imageUrl: string) => {
            console.log(`Pushing image ${imageUrl} into queue for player ${player} ${JSON.stringify(stream)}`)
            stream.push({prompt: prompt, image: imageUrl, player: player});
            nextQueue.push(stream);
        })
    }

    return ig;
}

export async function generateImage(prompt: string): Promise<string> {
    console.log(`Sending request for image with prompt ${API_TOKEN}`, prompt); 
    // call ai api
     const resp = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
        "headers": {
          Authorization: `Bearer ${API_TOKEN}`
        },
        "body": `{\"inputs\":\"${prompt}\"}`,
        "method": "POST"
      });
    const buf = await resp.arrayBuffer();
    const fileName = `${uuidv4()}.jpeg`;
    writeFileSync(`public/${fileName}`, new Uint8Array(buf), {mode: '0777'});
    console.log(`Done writing image to file ${fileName}`);
    return fileName;
}
