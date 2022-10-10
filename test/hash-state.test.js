const path = require("path");
const Scalar = require("ffjavascript").Scalar;

const wasm_tester = require("circom_tester").wasm;
const stateUtils = require("@hermeznetwork/commonjs").stateUtils;

describe("Test hash-state", function () {
    this.timeout(0);
    let circuit;

    before( async() => {
        circuit = await wasm_tester(path.join(__dirname, "circuits", "hash-state-test.circom"));
    });

    it("Should check hash with Js version", async () => {
        const state = {
            tokenID: 1,
            nonce: 49,
            balance: Scalar.e(12343256),
            sign: 1,
            ay: "144e7e10fd47e0c67a733643b760e80ed399f70e78ae97620dbb719579cd645d",
            ethAddr: "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
        };

        const hashJs = stateUtils.hashState(state);

        const input = {
            tokenID: Scalar.e(state.tokenID),
            nonce: Scalar.e(state.nonce),
            balance: Scalar.e(state.balance),
            sign: Scalar.e(state.sign),
            ay: Scalar.fromString(state.ay, 16),
            ethAddr: Scalar.fromString(state.ethAddr, 16),
        };

        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);

        const output = {
            out: hashJs
        };

        await circuit.assertOut(witness, output);
    });
});