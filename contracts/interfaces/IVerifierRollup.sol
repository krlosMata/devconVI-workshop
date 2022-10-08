// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.17;

/**
 * @dev Define interface verifier
 */
interface IVerifierRollup {
    function verifyProof(
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC,
        uint256[2] calldata input
    ) external view returns (bool);
}
