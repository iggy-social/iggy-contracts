// npx hardhat run scripts/chat/moderatorSbt.deploy.js --network superposition

const contractName = "ModeratorSbt";

const modTokenName = "MeowNFTs Moderator";
const modTokenSymbol = "MEOWNFTSMOD";
const moderators = [
  "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D",
  "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2",
  "0x5FfD23B1B0350debB17A2cB668929aC5f76d0E18"
]

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    modTokenName,
    modTokenSymbol,
    //{ nonce: 64 }
  );
  await instance.deployed();

  console.log(`${contractName} deployed to:`, instance.address);

  for (let i = 0; i < moderators.length; i++) {
    await instance.mint(moderators[i]);
    console.log("Moderator added:", moderators[i]);
  }

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + modTokenName + '" "' + modTokenSymbol + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });