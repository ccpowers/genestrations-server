import { createNewGame, addPlayerToGame, startGame, insertPlayerGuess, Game, doInboxCheckForPlayer, getImageUrlForGuessingPlayer } from "../src/game";
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
        addPlayerToGame(game, "playerC", "promptC0");
        const running = startGame(game, mockImageGeneratorFactory);

        assert.isTrue(!!running);

        //assert.equal(game.playerPositions.get("playerA"), undefined);
        //assert.equal(game.playerPositions.get("playerB"), "playerA");
    })

    /**it("should update first player position when game starts", () => {
        const game = createNewGame();
        addPlayerToGame(game, "playerA", "promptA0", "imageA0");
        addPlayerToGame(game, "playerB", "promptB0", "imageB0");

        startGame(game);
        assert.equal(game.playerPositions.get("playerA"), "playerB");
    })**/

    it("should update player position when guess submitted", () => {
        const game = createNewGame();
        addPlayerToGame(game, "playerA", "promptA0");
        addPlayerToGame(game, "playerB", "promptB0");
        addPlayerToGame(game, "playerC", "promptC0");
        addPlayerToGame(game, "playerD", "promptD0");

        const running = startGame(game, mockImageGeneratorFactory);
        
        // player C guesses first
        assert.isTrue(running.status === 'RUNNING', 'Game is not running');
        // second assert is for type narrowing :woman-shrugging:
        assert(running.status === 'RUNNING');
        let maybePlayerC = running.players.get("playerC");
        assert.isTrue(maybePlayerC !== undefined, 'Player C is undefined');
        assert(maybePlayerC !== undefined);
        let playerC = maybePlayerC;
        //console.log(`${JSON.stringify(playerC)}`)

        // todo method for going from waiting to guessing
        assert(playerC.status === 'WAITING')
        playerC = doInboxCheckForPlayer(playerC);
        assert.isTrue(playerC.status === 'GUESSING', 'Player C is not guessing');
        assert(playerC.status === "GUESSING");
        let waitingPlayerC = insertPlayerGuess(playerC, "guessC1");
        console.log(`Player C after guessing: ${JSON.stringify(waitingPlayerC)}`)
        // player C should have no current items until player B guesses
        let guessingPlayerC = doInboxCheckForPlayer(waitingPlayerC);
        console.log(`Player C after inbox check: ${JSON.stringify(guessingPlayerC)}`)
        assert.strictEqual(guessingPlayerC.status, 'WAITING');

        // get player B to guess
        let playerB = running.players.get("playerB");
        assert(!!playerB);
        assert(playerB.status === 'WAITING');
        playerB = doInboxCheckForPlayer(playerB);
        assert(playerB.status === 'GUESSING');
        playerB = insertPlayerGuess(playerB, "guessB1");
        

        // check player C inbox again
        assert(guessingPlayerC.status === "WAITING");
        let nextPlayerC = doInboxCheckForPlayer(guessingPlayerC);
        console.log(`Player C after inbox check: ${JSON.stringify(nextPlayerC)}`)
        assert.equal(nextPlayerC.status, "GUESSING");
        assert(nextPlayerC.status, "GUESSING")
        let nextGuessPlayerC = nextPlayerC;
        assert(nextGuessPlayerC.status, 'GUESSING');
        const playerCImageUrl = getImageUrlForGuessingPlayer(nextGuessPlayerC);
        console.log(`${playerCImageUrl}`);
        
        
        let playerD = running.players.get("playerD");
        assert(playerD !== undefined && playerD.status === 'WAITING');
        playerD = doInboxCheckForPlayer(playerD);
        console.log(`${JSON.stringify(playerD)}`)
    })


})


/**
 * TODO: Test concurrency
 * Make mock image generator that has a hook to 'when' image should be generated
 * test that image is not in next player's inbox until image is generated
 */