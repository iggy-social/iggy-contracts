// npx hardhat run scripts/token/ChatTokenClaimPostMinters/chatTokenClaimPostMinters.deploy.js --network polygonMumbai
// This script deploys the ChatTokenClaimPostMinters contract and sets it as a minter in the ChatTokenMinter contract.
// If setting the minter address fails, do it manually by calling the addMinter function in the ChatTokenMinter contract.

const contractName = "ChatTokenClaimPostMinters";

const chatTokenMinterAddress = "0x2C6A9F47a2B1BA7976ACd14CDd8f6f35d27C1e28";
const iggyPostEnumAddress = "0xF558E00fc446252293Cf894cAF45F477aD66646A";
const chatEthRatio = 10_000_000; // 1 ETH = 10,000,000 CHAT

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