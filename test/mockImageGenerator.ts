import { PromptStream, PromptStreamQueue } from "../src/game";
import { v4 as uuidv4 } from 'uuid';

export function mockImageGeneratorFactory(nextQueue: PromptStreamQueue, player: string) {
    const ig = async (prompt: string, stream: PromptStream) => {
        const fileName = `${prompt}_mock.jpeg`;
        stream.push({prompt: prompt, image: fileName, player: player});
        nextQueue.push(stream);
        console.log(`Created mock ${fileName}`);
    }
    return ig;
}