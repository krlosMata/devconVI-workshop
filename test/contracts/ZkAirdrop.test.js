const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("UniAirdrop test", function () {
    let deployer;
    let userAWallet;

    let zkAirdropContract;

    const tokenName = "zk NFT";
    const tokenSymbol = "ZKNFT";
    const exampleURL = "http://example";
    const merkleRoot = ethers.constants.HashZero;

    beforeEach("Deploy contract", async () => {
        // Load signers
        const signers = await ethers.getSigners();

        // Assign signers
        deployer = signers[0];
        userAWallet = signers[1];

        // Deploy mock verifier
        const VeirfierMock = await ethers.getContractFactory(
            'VerifierMock',
        );
        verifierContract = await VeirfierMock.deploy();


        // Deploy zkAirdrop
        const zkAirdropFactory = await ethers.getContractFactory("zkAirdrop");
        zkAirdropContract = await zkAirdropFactory.deploy(tokenName, tokenSymbol, exampleURL, merkleRoot, verifierContract.address);

        await zkAirdropContract.deployed();
    });

    it("should check the constructor", async () => {
        expect(await zkAirdropContract.name()).to.be.equal(tokenName);
        expect(await zkAirdropContract.symbol()).to.be.equal(tokenSymbol);
        expect(await zkAirdropContract.baseURI()).to.be.equal(exampleURL);
        expect(await zkAirdropContract.hermezMerkleRoot()).to.be.equal(merkleRoot);
        expect(await zkAirdropContract.zkVerifier()).to.be.equal(verifierContract.address);

    });

    it("Should mint a NFT happy flow", async () => {
        const userAddress = userAWallet.address
        const proofMockA = ['0', '0'];
        const proofMockB = [
            ['0', '0'],
            ['0', '0'],
        ];
        const proofMockC = ['0', '0'];

        // merkle params
        const indexLeaf = 0;

        // Check Index is not claimed
        expect(await zkAirdropContract.idxNullifier(indexLeaf)).to.be.equal(false);

        // Claim zk
        await expect(zkAirdropContract.connect(userAWallet).claimHermezNft(indexLeaf, proofMockA, proofMockB, proofMockC))
            .to.emit(zkAirdropContract, "Claimed").withArgs(1, userAddress);

        // Check zk NFT
        const tokenIDMinted = 1
        expect(await zkAirdropContract.totalSupply()).to.be.equal(tokenIDMinted);
        expect(await zkAirdropContract.ownerOf(tokenIDMinted)).to.be.equal(userAddress);
        expect(await zkAirdropContract.tokenURI(tokenIDMinted)).to.be.equal(exampleURL);
        expect(await zkAirdropContract.tokenByIndex(0)).to.be.equal(tokenIDMinted);
        expect(await zkAirdropContract.tokenOfOwnerByIndex(userAddress, 0)).to.be.equal(tokenIDMinted);

        // Check Index is claimed
        expect(await zkAirdropContract.idxNullifier(indexLeaf)).to.be.equal(true);

        // Check can't be claimed again
        await expect(zkAirdropContract.connect(userAWallet).claimHermezNft(indexLeaf, proofMockA, proofMockB, proofMockC))
            .to.be.revertedWith("zkAirdrop::claimHermezNft ALREADY_CLAIMED");
    });
});
