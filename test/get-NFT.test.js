const path = require("path");
const { expect } = require("chai");
const Scalar = require("ffjavascript").Scalar;
const wasm_tester = require("circom_tester").wasm;
const SMTMemDB = require("@hermeznetwork/commonjs/node_modules/circomlib/index").SMTMemDB;

const stateUtils = require("@hermeznetwork/commonjs").stateUtils;
const Account = require("@hermeznetwork/commonjs").HermezAccount;
const Constants = require("@hermeznetwork/commonjs").Constants;
const RollupDB = require("@hermeznetwork/commonjs").RollupDB;
const SMTTmpDb = require("@hermeznetwork/commonjs").SMTTmpDb;

const { depositTx, getLeafInfo } = require("./helpers/helpers");

describe("Test get-NFT", function () {
    this.timeout(0);
    let circuit;

    let nTx = 32;
    let nLevels = 16;
    let maxL1Tx = 16;
    let maxFeeTx = 2;

    const account1 = new Account(1);
    const account2 = new Account(2);
    const account3 = new Account(3);

    const accounts = [];
    // save idx that will be assigned during the test
    account1.idx = Constants.firstIdx + 1;
    account2.idx = Constants.firstIdx + 2;
    account3.idx = Constants.firstIdx + 3;
    accounts.push(account1);
    accounts.push(account2);
    accounts.push(account3);

    async function newState(){
        const db = new SMTMemDB();
        const rollupDB = await RollupDB(db);
        return rollupDB;
    }

    before( async() => {
        circuit = await wasm_tester(path.join(__dirname, "circuits", "get-NFT-test.circom"));
        await circuit.loadConstraints();
        console.log("Constraints: " + circuit.constraints.length + "\n");
    });

    it("Should check minimum nonce", async () => {
        const rollupDB = await newState();

        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);
        await depositTx(bb, account1, 1, 1000);
        await depositTx(bb, account2, 2, 2000);
        await bb.build();
        await rollupDB.consolidate(bb);

        const bb2 = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);

        for (let i = 0; i < 5; i++){
            const tx = {
                fromIdx: account1.idx,
                loadAmountF: 0,
                tokenID: 1,
                fromBjjCompressed: 0,
                fromEthAddr: 0,
                toIdx: account2.idx,
                amount: 25,
                userFee: 0,
                onChain: 0,
                nonce: i,
            };

            account1.signTx(tx);
            bb2.addTx(tx);
        }
        await bb2.build();

        await rollupDB.consolidate(bb2);

        const leafInfo = await getLeafInfo(rollupDB, 256, 2);
        const { siblings } = leafInfo;
        while (siblings.length < nLevels+1) siblings.push(Scalar.e(0));

        const input = {
            root: await rollupDB.getRoot(),
            idx: 256,
            tokenID: Scalar.e(leafInfo.state.tokenID),
            nonce: Scalar.e(leafInfo.state.nonce),
            sign: Scalar.e(leafInfo.state.sign),
            balance: Scalar.e(leafInfo.state.balance),
            ay: Scalar.fromString(leafInfo.state.ay, 16),
            ethAddr: Scalar.fromString(leafInfo.state.ethAddr, 16),
            siblings: siblings,
        };

        try {
            await circuit.calculateWitness(input, true);
            expect(false).to.be.equal(true);
        } catch (error) {
            console.log(error.message);
            expect(error.message.includes("Error in template GetNFT_235 line: 44")).to.be.equal(true);
        }
    });

    it("Should check correct nonce", async () => {
        const rollupDB = await newState();

        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);
        await depositTx(bb, account1, 1, 1000);
        await depositTx(bb, account2, 2, 2000);
        await bb.build();
        await rollupDB.consolidate(bb);

        const bb2 = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);

        for (let i = 0; i < 11; i++){
            const tx = {
                fromIdx: account1.idx,
                loadAmountF: 0,
                tokenID: 1,
                fromBjjCompressed: 0,
                fromEthAddr: 0,
                toIdx: account2.idx,
                amount: 25,
                userFee: 0,
                onChain: 0,
                nonce: i,
            };

            account1.signTx(tx);
            bb2.addTx(tx);
        }
        await bb2.build();

        await rollupDB.consolidate(bb2);

        const leafInfo = await getLeafInfo(rollupDB, 256, 2);
        const { siblings } = leafInfo;
        while (siblings.length < nLevels+1) siblings.push(Scalar.e(0));

        const input = {
            root: await rollupDB.getRoot(),
            idx: 256,
            tokenID: Scalar.e(leafInfo.state.tokenID),
            nonce: Scalar.e(leafInfo.state.nonce),
            sign: Scalar.e(leafInfo.state.sign),
            balance: Scalar.e(leafInfo.state.balance),
            ay: Scalar.fromString(leafInfo.state.ay, 16),
            ethAddr: Scalar.fromString(leafInfo.state.ethAddr, 16),
            siblings: siblings,
        };

        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);
    });

    it("Should check invalid smt proof", async () => {
        const rollupDB = await newState();

        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);
        await depositTx(bb, account1, 1, 1000);
        await depositTx(bb, account2, 2, 2000);
        await bb.build();
        await rollupDB.consolidate(bb);

        const bb2 = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);

        for (let i = 0; i < 11; i++){
            const tx = {
                fromIdx: account1.idx,
                loadAmountF: 0,
                tokenID: 1,
                fromBjjCompressed: 0,
                fromEthAddr: 0,
                toIdx: account2.idx,
                amount: 25,
                userFee: 0,
                onChain: 0,
                nonce: i,
            };

            account1.signTx(tx);
            bb2.addTx(tx);
        }
        await bb2.build();

        await rollupDB.consolidate(bb2);

        const leafInfo = await getLeafInfo(rollupDB, 256, 2);
        const { siblings } = leafInfo;
        while (siblings.length < nLevels+1) siblings.push(Scalar.e(0));

        const input = {
            root: await rollupDB.getRoot(),
            idx: 256,
            tokenID: Scalar.e(leafInfo.state.tokenID),
            nonce: Scalar.e(leafInfo.state.nonce),
            sign: Scalar.e(leafInfo.state.sign),
            balance: Scalar.e(leafInfo.state.balance),
            ay: Scalar.fromString(leafInfo.state.ay, 16),
            ethAddr: Scalar.fromString("0x012345679A012345679A012345679A012345679A", 16), // try to cheat msg.sender
            siblings: siblings,
        };

        try {
            await circuit.calculateWitness(input, true);
        } catch (error){
            expect(error.message.includes("Error in template SMTVerifier")).to.be.equal(true);
        }
    });
});