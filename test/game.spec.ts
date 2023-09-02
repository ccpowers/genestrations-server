import { createNewGame } from "../src/game";
import { assert } from 'chai';

describe("game", () => {
    it("should start with empty stuff", () => {
        const game = createNewGame();
        assert.equal(0, [...game.promptStreams.keys()].length)
    })
})