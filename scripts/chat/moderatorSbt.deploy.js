// npx hardhat run scripts/chat/moderatorSbt.deploy.js --network sepolia

const contractName = "ModeratorSbt";

const modTokenName = "Iggy Demo Moderator";
const modTokenSymbol = "IGGYMOD";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    modTokenName,
    modTokenSymbol,
    // add nonce 64
    //{ nonce: 64 }
  );
  await instance.deployed();

  console.log(`${contractName} deployed to:`, instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + modTokenName + '" "' + modTokenSymbol + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });