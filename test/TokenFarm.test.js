const { assert } = require('chai');

const TokenFarm = artifacts.require("TokenFarm");
const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");

require('chai').use(require('chai-as-promised')).should()

function token(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {

    let daiToken, dappToken, tokenFarm;

    before(async () => {
        daiToken = await DaiToken.new();
        dappToken = await DappToken.new();
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

        // trasnfer all dapp tokens to farm (1 million)
        await dappToken.transfer(tokenFarm.address, token('1000000'))

        //send tokens to investor
        await daiToken.transfer(investor, token('100'), { from: owner })

    })

    describe('Mock Dai deployement', async () => {
        it("has a name", async () => {
            const name = await daiToken.name();
            assert.equal(name, 'Mock DAI Token');
        })
    });

    describe('Dapp Token deployement', async () => {
        it("has a name", async () => {
            const name = await dappToken.name();
            assert.equal(name, 'DApp Token');
        })
    });

    describe('Token Farm deployement', async () => {
        it("has a name", async () => {
            const name = await tokenFarm.name();
            assert.equal(name, 'Dapp Token Farm');
        });

        it("contract has tokens", async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address);
            assert.equal(balance.toString(), token('1000000'));
        })
    });

    describe('farming token', async () => {
        it("reward investors for staking mDai tokens", async () => {
            let result;

            // check investor balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), token('100'), 'investor MOCK DAI wallet balance correct before staking')

            // asserr Mock DAI tokens
            await daiToken.approve(tokenFarm.address, token('100'), { from: investor })
            await tokenFarm.stakeTokens(token('100'), { from: investor })

            // check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), token('0'), 'investor mock dai wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), token('100'), 'token MOCK DAI wallet balance correct before staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(),token('100'),'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(),'true','investor staking status correct after staking')

            // issue tokens
            await tokenFarm.issueTokens({from: owner})

            // check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(),token('100'),'investor DApp token wallet balance after issunace')

            // ensure that only owner can issue tokens
            await tokenFarm.issueTokens({from: investor}).should.be.rejected;

            // unstake the tokens
            await tokenFarm.unstakeTokens({from:investor})

            // check the result after unstaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(),token('100'),'investor mock dai wallet balance correct after staking');

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(),token('0'),'token farm mock dai wallet balance correct after staking');

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(),token('0'),'investor staking balance correct after staking')
        })
    })
})