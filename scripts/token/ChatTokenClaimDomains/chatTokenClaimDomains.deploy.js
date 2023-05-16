// npx hardhat run scripts/token/ChatTokenClaimDomains/chatTokenClaimDomains.deploy.js --network polygonMumbai
// This script deploys the ChatTokenClaimDomains contract and sets it as a minter in the ChatTokenMinter contract.
// If setting the minter address fails, do it manually by calling the addMinter function in the ChatTokenMinter contract.

const contractName = "ChatTokenClaimDomains";

const chatTokenMinterAddress = "0x2C6A9F47a2B1BA7976ACd14CDd8f6f35d27C1e28";
const tldAddress = "0x2582EC420195Fefb091B098da6FAdEE49f490740";
const chatReward = 1_000; // 1 domain = 1,000 CHAT
const maxIdEligible = 15; // The first X number of domains (by ID) are eligible for claiming

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