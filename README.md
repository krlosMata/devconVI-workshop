# devconVI-workshop

## Pre-requisites
- [circom](https://docs.circom.io/getting-started/installation/#installing-dependencies)
- [nodejs](https://nodejs.org/en/)

## Circuit explanation
`get-nft.circom` verifies that a certain account in the rollup given a snaphot (state-root) has been done more than 10 transactions.
This is a proof of rollup usability and if a user is able to prover that it will receive a NFT as a reward

## Constraints
- check `nonce` provided is greater than 10 with [GreaterThan](https://github.com/iden3/circomlib/blob/master/circuits/comparators.circom#L118)
- build state with [HashState](https://github.com/krlosMata/devconVI-workshop/blob/main/src/hash-state.circom)
- verify state in the snapshot root with [SMTVerifier](https://github.com/iden3/circomlib/blob/master/circuits/smt/smtverifier.circom#L41)

## Public inputs
- `root`: snapshot of the hermez rollup state root
- `idx`: unique identifier of the state-tree. Used as a nullifier to avoid double minting
- `ethereumAddress`: `msg.sender` used a a proof of account ownership

## Private inputs
- state leaf parameters: `tokenID`, `nonce`, `sign`, `balance` & `ay`
- `siblings`

## Resources
- [Rollup circuits docs](https://docs.hermez.io/Hermez_1.0/developers/protocol/hermez-protocol/circuits/circuits/)
- [Leaf state-tree](https://docs.hermez.io/Hermez_1.0/developers/protocol/hermez-protocol/protocol/#account)
- [Circom 2.0 installation and tutorial](https://docs.circom.io/getting-started/installation/)