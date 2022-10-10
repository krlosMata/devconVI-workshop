pragma circom 2.0.9;

include "./hash-state.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/smt/smtverifier.circom";

/**
 * Verifes that an account has a nonce greater than 10 and it belomgs to a given hermez rollup snapshot
 * @input root - {Field} - snapshot hermez rollup root
 * @input idx - {Uint32} - merkle tree index
 * @input tokenID - {Uint32} - token identifier
 * @input nonce - {Uint40} - nonce
 * @input sign - {Bool} - babyjubjub sign
 * @input balance - {Uint192} - account balance
 * @input ay - {Field} - babyjubjub Y coordinate
 * @input ethAddr - {Uint160} - ethereum address
 * @input siblings[nLevels + 1] - {[Array(Field)]} - siblings merkle proof of the sender leaf
 */
template GetNFT(nLevels) {
    // root
    signal input root; // public input that comes from the smart contract

    // leaf index
    signal input idx; // public input that comes from the smart contract. Used as a nullifier

    // state
    signal input tokenID;
    signal input nonce;
    signal input sign;
    signal input balance;
    signal input ay;
    signal input ethAddr; // public input that comes from the smart contract

    // data to verify smt proof
    signal input siblings[nLevels+1];

    // checks: nonce > MIN_NONCE
    var MIN_NONCE = 10;
    component minNonce = GreaterThan(252);

    minNonce.in[0] <== nonce;
    minNonce.in[1] <== MIN_NONCE;

    minNonce.out === 1;

    // build state
    component state = HashState();
    state.tokenID <== tokenID;
    state.nonce <== nonce;
    state.sign <== sign;
    state.balance <== balance;
    state.ay <== ay;
    state.ethAddr <== ethAddr;

    // verify leaf exist on the given root
	component smtVerify = SMTVerifier(nLevels + 1);
	smtVerify.enabled <== 1;
	smtVerify.fnc <== 0;
	smtVerify.root <== root;
	for (var i = 0; i < nLevels + 1; i++) {
		smtVerify.siblings[i] <== siblings[i];
	}
	smtVerify.oldKey <== 0;
	smtVerify.oldValue <== 0;
	smtVerify.isOld0 <== 0;
	smtVerify.key <== idx;
	smtVerify.value <== state.out;
}