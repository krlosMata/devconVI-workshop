// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IVerifierRollup.sol";

contract zkAirdrop is ERC721Enumerable, Ownable {
    // Base uri for token metadata
    string public baseURI;

    // Merkle root of Hermez
    bytes32 public hermezMerkleRoot;

    // ZK verifier
    IVerifierRollup public zkVerifier;

    // Mapping of idx nullifiers
    mapping(uint256 => bool) public idxNullifier;

    /**
     * @dev Emitted when a unicorn is claimed
     */
    event Claimed(uint256 indexed tokenID, address reciever);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        string memory __baseURI,
        bytes32 _hermezMerkleRoot,
        IVerifierRollup _zkVerifier
    ) ERC721(tokenName, tokenSymbol) {
        baseURI = __baseURI;
        hermezMerkleRoot = _hermezMerkleRoot;
        zkVerifier = _zkVerifier;
    }


    function claimHermezNft(
        uint256 index,
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC
    ) public {
        require(
            idxNullifier[index] == false,
            "zkAirdrop::claimHermezNft ALREADY_CLAIMED"
        );

        // Verify proof
        require(
            zkVerifier.verifyProof(proofA, proofB, proofC, [uint256(hermezMerkleRoot), index]),
            "zkAirdrop::claimHermezNft: INVALID_PROOF"
        );

        // Mark index as claimed
        idxNullifier[index] = true;

        // Mint NFT
        _mint(msg.sender, totalSupply() + 1);

        emit Claimed(totalSupply(), msg.sender);
    }

    // Overriden erc721 functions
    function _baseURI() view internal override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        return baseURI;
    }


    // Set base uri
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }
}
