const path = require("path");

const wasm_tester = require("circom_tester").wasm;
const stateUtils = require("@hermeznetwork/commonjs").stateUtils;

const { depositTx, depositOnlyExitTx, assertBatch, assertAccountsBalances } = require("./helpers/helpers");

describe("Test get-NFT", function () {
    this.timeout(0);
    let circuit;

    let nTx = 3;
    let nLevels = 16;
    let maxL1Tx = 2;
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
    });

    it("Should check minimum nonce", async () => {
        const rollupDB = await newState();

        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);
        await depositTx(bb, account1, 1, 0);
        await depositTx(bb, account2, 2, 0);
        await bb.build();
        await rollupDB.consolidate(bb);

        const s1 = await rollupDB.getStateByIdx(256);
        console.log(s1);
    });

    // it("Should check hash with Js version", async () => {
    //     const state = {
    //         tokenID: 1,
    //         nonce: 49,
    //         balance: Scalar.e(12343256),
    //         sign: 1,
    //         ay: "144e7e10fd47e0c67a733643b760e80ed399f70e78ae97620dbb719579cd645d",
    //         ethAddr: "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
    //     };

    //     const hashJs = stateUtils.hashState(state);

    //     const input = {
    //         tokenID: Scalar.e(state.tokenID),
    //         nonce: Scalar.e(state.nonce),
    //         balance: Scalar.e(state.balance),
    //         sign: Scalar.e(state.tokenID),
    //         ay: Scalar.fromString(state.ay, 16),
    //         ethAddr: Scalar.fromString(state.ethAddr, 16),
    //     };

    //     const witness = await circuit.calculateWitness(input, true);
    //     await circuit.checkConstraints(witness);

    //     const output = {
    //         out: hashJs
    //     };

    //     await circuit.assertOut(witness, output);
    // });
});