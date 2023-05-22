// npx hardhat run scripts/token/ChatTokenClaimPostMinters/chatTokenClaimPostMinters.deploy.js --network songbird
// This script deploys the ChatTokenClaimPostMinters contract and sets it as a minter in the ChatTokenMinter contract.
// If setting the minter address fails, do it manually by calling the addMinter function in the ChatTokenMinter contract.

const contractName = "ChatTokenClaimPostMinters";

const chatTokenMinterAddress = "0x31CfDF366dd9753b8443B6fc3c59598415697131"; // TODO
const iggyPostEnumAddress = "0x0BF6333Fc85159663A30Ac89FD02c5031B97c5ee"; // TODO
const chatEthRatio = 1_000; // TODO: 1 ETH/SGB spent for post minting fees = 1,000 CHAT (80 ETH/SGB = 80,000 CHAT)

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    chatTokenMinterAddress,
    iggyPostEnumAddress,
    chatEthRatio
  );

  console.log(contractName + " contract address:", instance.address);

  console.log("Wait for deploy transaction to be mined...");

  await instance.deployed();

  console.log("Deploy transaction mined!");

  console.log("Add ChatTokenClaimPostMinters contract address as the Minter in the ChatTokenMinter contract");

  const chatTokenMinterContract = await ethers.getContractFactory("ChatTokenMinter");
  const chatTokenMinterInstance = await chatTokenMinterContract.attach(chatTokenMinterAddress);

  await chatTokenMinterInstance.addMinter(instance.address);

  console.log("Done!");
  
  console.log("Lastly, verify the Minter contract on block explorer");

  console.log("Wait a minute and then run this command to verify contract on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + chatTokenMinterAddress + " " + iggyPostEnumAddress + ' "' + chatEthRatio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });