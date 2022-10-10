const path = require("path");
const { expect } = require("chai");
const Scalar = require("ffjavascript").Scalar;
const SMTMemDB = require("@hermeznetwork/commonjs/node_modules/circomlib/index").SMTMemDB;

const Account = require("@hermeznetwork/commonjs").HermezAccount;
const Constants = require("@hermeznetwork/commonjs").Constants;
const RollupDB = require("@hermeznetwork/commonjs").RollupDB;

const { depositTx, getLeafInfo } = require("../helpers/helpers");
const snarkjs = require("snarkjs");
const { ethers } = require("hardhat");

describe("Test get-NFT", function () {
    this.timeout(0);
    let deployer;
    let userAWallet;
    let verifierContract;
    let zkAirdropContract;

    const tokenName = "zk NFT";
    const tokenSymbol = "ZKNFT";
    const exampleURL = "http://example";
    let rollupDB;

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

    async function newState() {
        const db = new SMTMemDB();
        const rollupDB = await RollupDB(db);
        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);
        await depositTx(bb, account1, 1, 1000);
        await depositTx(bb, account2, 2, 2000);
        await bb.build();
        await rollupDB.consolidate(bb);

        const bb2 = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx, maxFeeTx);

        for (let i = 0; i < 11; i++) {
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
        return rollupDB;
    }

    beforeEach("Deploy contract", async () => {
        // Load signers
        const signers = await ethers.getSigners();

        // Assign signers
        deployer = signers[0];
        userAWallet = signers[1];

        // Deploy mock verifier
        verifierFactory = await ethers.getContractFactory(
            'Verifier',
        );
        verifierContract = await verifierFactory.deploy();


        // Calculate rollupDB
        rollupDB = await newState();
        const merkleRoot = await rollupDB.getRoot();

        // Deploy zkAirdrop
        const zkAirdropFactory = await ethers.getContractFactory("zkAirdrop");
        zkAirdropContract = await zkAirdropFactory.deploy(tokenName, tokenSymbol, exampleURL, `0x0${merkleRoot.toString(16)}`, verifierContract.address);

        await zkAirdropContract.deployed();
    });

    it("Should check correct nonce", async () => {
        const index = 256;
        const leafInfo = await getLeafInfo(rollupDB, index, 2);
        const { siblings } = leafInfo;
        while (siblings.length < nLevels + 1) siblings.push(Scalar.e(0));

        const input = {
            root: await rollupDB.getRoot(),
            idx: index,
            tokenID: Scalar.e(leafInfo.state.tokenID),
            nonce: Scalar.e(leafInfo.state.nonce),
            sign: Scalar.e(leafInfo.state.sign),
            balance: Scalar.e(leafInfo.state.balance),
            ay: Scalar.fromString(leafInfo.state.ay, 16),
            ethAddr: Scalar.fromString(leafInfo.state.ethAddr, 16),
            siblings: siblings,
        };

        const prove = await snarkjs.groth16.fullProve(input, path.join(__dirname, "./circuits/get-NFT-test.wasm"), path.join(__dirname, "./circuits/get-NFT-test_0001.zkey"));
        const proofA = [prove.proof.pi_a[0],
        prove.proof.pi_a[1]
        ];
        const proofB = [
            [
                prove.proof.pi_b[0][1],
                prove.proof.pi_b[0][0]
            ],
            [
                prove.proof.pi_b[1][1],
                prove.proof.pi_b[1][0]
            ]
        ];
        const proofC = [prove.proof.pi_c[0],
        prove.proof.pi_c[1]
        ];


        expect(await verifierContract.verifyProof(
            proofA,
            proofB,
            proofC,
            prove.publicSignals,
        )).to.be.equal(true);


        const walletUserA = new ethers.Wallet(account1.privateKey, ethers.provider);
        const params = {
            to: walletUserA.address,
            value: ethers.utils.parseEther('1.0')
        };
        await deployer.sendTransaction(params);

        // Claim zk
        await expect(zkAirdropContract.connect(walletUserA).claimHermezNft(index, proofA, proofB, proofC))
            .to.emit(zkAirdropContract, "Claimed").withArgs(1, walletUserA.address);
    });
});