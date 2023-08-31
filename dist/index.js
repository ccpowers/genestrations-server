"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const API_TOKEN = process.env.API_TOKEN;
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server?');
});
app.use(express_1.default.static('public'));
app.get('/prompt', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // call ai api
    const resp = yield fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
        "headers": {
            Authorization: `Bearer ${API_TOKEN}`
        },
        "body": "{\"inputs\":\"cookie monster at the woods\"}",
        "method": "POST"
    });
    const buf = yield resp.arrayBuffer();
    (0, fs_1.writeFileSync)("public/image3.jpeg", new Uint8Array(buf), { mode: '0777' });
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
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
