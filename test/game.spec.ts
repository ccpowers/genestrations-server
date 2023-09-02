import { createNewGame, addPlayerToGame, startGame, insertPlayerGuess } from "../src/game";
import { assert } from 'chai';

describe("game", () => {
    it("should start with empty stuff", () => {
        const game = createNewGame();
        assert.equal(0, [...game.promptStreams.keys()].length)
    })

    it("should add new players", () => {
        const game = createNewGame();
        addPlayerToGame(game, "playerA", "promptA0", "imageA0");
        addPlayerToGame(game, "playerB", "promptB0", "imageB0");

        assert.equal(game.playerPositions.get("playerA"), undefined);
        assert.equal(game.playerPositions.get("playerB"), "playerA");
    })

    it("should update first player position when game starts", () => {
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
        const playerBStream = game.promptStreams.get("playerB");
        assert.isDefined(playerBStream);

        assert.equal(playerBStream?.length, 2);
        assert.equal(playerBStream[1].image, "imageC1");
        assert.equal(playerBStream[1].prompt, "guessC1");
        assert.equal(game.playerPositions.get("playerC"), "playerA");

    })


})