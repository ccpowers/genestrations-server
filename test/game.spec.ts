import { createNewGame, addPlayerToGame, startGame, insertPlayerGuess, Game } from "../src/game";
import { assert } from 'chai';
import { mockImageGeneratorFactory } from "./mockImageGenerator";

describe("game", () => {
    it("should start with empty stuff", () => {
        const game = createNewGame();
        assert.equal(0, [...game.initialPrompts.keys()].length)
    })

    it("should add new players", () => {
        const game = createNewGame();
        addPlayerToGame(game, "playerA", "promptA0");
        addPlayerToGame(game, "playerB", "promptB0");
        const running = startGame(game, mockImageGeneratorFactory);

        assert.isTrue(!!game);

        //assert.equal(game.playerPositions.get("playerA"), undefined);
        //assert.equal(game.playerPositions.get("playerB"), "playerA");
    })

    /**it("should update first player position when game starts", () => {
        const game = createNewGame();
        addPlayerToGame(game, "playerA", "promptA0", "imageA0");
        addPlayerToGame(game, "playerB", "promptB0", "imageB0");

        startGame(game);
        assert.equal(game.playerPositions.get("playerA"), "playerB");
    })

    it("should update player position when guess submitted", () => {
        const game = createNewGame();
        addPlayerToGame(game, "playerA", "promptA0", "imageA0");
        addPlayerToGame(game, "playerB", "promptB0", "imageB0");
        addPlayerToGame(game, "playerC", "promptC0", "imageC0");
        addPlayerToGame(game, "playerD", "promptD0", "imageD0");

        startGame(game);
        assert.equal(game.playerPositions.get("playerA"), "playerD");

        // player C guesses first
        insertPlayerGuess(game, "playerC", "guessC1", "imageC1");
        
        // player C should have no current items until player D guesses

    })**/


})