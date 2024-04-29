// npx hardhat run scripts/token/ChatTokenClaimDomains/chatTokenClaimDomains.deploy.js --network sepolia
// This script deploys the ChatTokenClaimDomains contract and sets it as a minter in the ChatTokenMinter contract.
// If setting the minter address fails, do it manually by calling the addMinter function in the ChatTokenMinter contract.

const contractName = "ChatTokenClaimDomains";

const chatTokenMinterAddress = "0xfAE210dfa2AC6CaF9Aaf9AeaDbB00A9B339B1e47"; // TODO: Update this address
const tldAddress = "0x1DD820F4f48eBC2B8e7F666F34fbC5820808074e"; // TODO: Update this address
const chatReward = ethers.utils.parseEther("1337"); // TODO: 1 domain = 1337 CHAT tokens
const maxIdEligible = 1337; // TODO: The first X number of domains (by ID) are eligible for claiming

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    chatTokenMinterAddress,
    tldAddress,
    chatReward,
    maxIdEligible
  );

  console.log(contractName + " contract address:", instance.address);

  console.log("Wait for deploy transaction to be mined...");

  await instance.deployed();

  console.log("Deploy transaction mined!");

  console.log("Add ChatTokenClaimDomains contract address as the Minter in the ChatTokenMinter contract");

  const chatTokenMinterContract = await ethers.getContractFactory("ChatTokenMinter");
  const chatTokenMinterInstance = await chatTokenMinterContract.attach(chatTokenMinterAddress);

  await chatTokenMinterInstance.addMinter(instance.address);

  console.log("Done!");
  
  console.log("Lastly, verify the Minter contract on block explorer");

  console.log("Wait a minute and then run this command to verify contract on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + chatTokenMinterAddress + " " + tldAddress + ' "' + chatReward + '" "' + maxIdEligible + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });