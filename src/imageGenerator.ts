import { writeFileSync } from "fs";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();
const API_TOKEN = process.env.API_TOKEN;

export async function generateImage(prompt: string): Promise<string> {
    console.log(`${API_TOKEN}`) 
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
    return fileName;
}
