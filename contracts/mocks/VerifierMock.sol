// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.17;

import "../interfaces/IVerifierRollup.sol";

contract VerifierMock is IVerifierRollup {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) public view override returns (bool) {
        return true;
    }
}
