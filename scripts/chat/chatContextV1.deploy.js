// npx hardhat run scripts/chat/chatContextV1.deploy.js --network songbird

const contractName = "ChatContextV1";

const modTokenAddress = "0xc2EbBc86AC2Ea592e71B6A08360EAf4A9B09C156";
const modMinBalance = 1; // 1 NFT
const chatOwnerAddress = "0x41EDA56be2191fbeDf1BacC45105B57915929665";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    modTokenAddress,
    chatOwnerAddress,
    modMinBalance
  );
  await instance.deployed();

  console.log(`${contractName} deployed to:`, instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + modTokenAddress + " " + chatOwnerAddress + ' "' + modMinBalance + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });