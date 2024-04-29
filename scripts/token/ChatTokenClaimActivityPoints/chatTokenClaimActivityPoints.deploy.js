// npx hardhat run scripts/token/ChatTokenClaimActivityPoints/chatTokenClaimActivityPoints.deploy.js --network sepolia
// This script deploys the ChatTokenClaimActivityPoints contract and sets it as a minter in the ChatTokenMinter contract.
// If setting the minter address fails, do it manually by calling the addMinter function in the ChatTokenMinter contract.

const contractName = "ChatTokenClaimActivityPoints";

const chatTokenMinterAddress = "0xfAE210dfa2AC6CaF9Aaf9AeaDbB00A9B339B1e47"; // TODO
const activityPointsAddress = "0xC3623737209Cc141592B20bcEBCA6052AFCcD183"; // TODO
const chatEthRatio = 1_000_000; // TODO: 1 ETH = 1,000 CHAT

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    chatTokenMinterAddress,
    activityPointsAddress,
    chatEthRatio
  );

  console.log(contractName + " contract address:", instance.address);

  console.log("Wait for deploy transaction to be mined...");

  await instance.deployed();

  console.log("Deploy transaction mined!");

  console.log("Add ChatTokenClaimActivityPoints contract address as the Minter in the ChatTokenMinter contract");

  const chatTokenMinterContract = await ethers.getContractFactory("ChatTokenMinter");
  const chatTokenMinterInstance = await chatTokenMinterContract.attach(chatTokenMinterAddress);

  await chatTokenMinterInstance.addMinter(instance.address);

  console.log("Done!");
  
  console.log("Lastly, verify the Minter contract on block explorer");

  console.log("Wait a minute and then run this command to verify contract on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + chatTokenMinterAddress + " " + activityPointsAddress + ' "' + chatEthRatio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });