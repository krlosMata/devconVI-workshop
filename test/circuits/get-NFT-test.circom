pragma circom 2.0.9;

include "../../src/get-nft.circom";

component main {public [root, idx, ethAddr]} = GetNFT(16);