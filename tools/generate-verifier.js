const snarkjs = require("snarkjs");
const { execSync } = require("child_process");
const path = require("path");

async function main(){
    const pathCircuit = path.join(__dirname, "../test/circuits/get-NFT-test.circom");
    const cmd = `circom ${pathCircuit} --r1cs --wasm`;
    console.log("Building circuit");
    execSync(cmd);

    let cmdSnarkjs = "npx snarkjs powersoftau new bn128 13 pot13_0000.ptau";
    console.log("snarkjs powersoftau new bn128 13");
    execSync(cmdSnarkjs);
    cmdSnarkjs = "npx snarkjs powersoftau contribute pot13_0000.ptau pot13_0001.ptau --name='DevconVI' --entropy='CarlosJesus'";
    console.log("contribute");
    execSync(cmdSnarkjs);
    cmdSnarkjs = "npx snarkjs powersoftau prepare phase2 pot13_0001.ptau pot13_final.ptau";
    console.log("prepare phase2");
    execSync(cmdSnarkjs);
    cmdSnarkjs = "npx snarkjs groth16 setup get-NFT-test.r1cs pot13_final.ptau getnft_0000.zkey";
    console.log("groth16 setup");
    execSync(cmdSnarkjs);
    cmdSnarkjs = "npx snarkjs zkey contribute getnft_0000.zkey getnft_0001.zkey --name='1st Contributor Name' --entropy='JesusCarlos'";
    console.log("zkey contribute");
    execSync(cmdSnarkjs);
    cmdSnarkjs = "npx snarkjs zkey export verificationkey getnft_0001.zkey verification_key.json";
    console.log("zkey export");
    execSync(cmdSnarkjs);
    cmdSnarkjs = "npx snarkjs zkey export solidityverifier getnft_0001.zkey verifier.sol";
    console.log("zkey export solidityverifier");
    execSync(cmdSnarkjs);
}

main();