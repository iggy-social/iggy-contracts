// npx hardhat run scripts/token/ChatTokenMinter/chatTokenMinter.deploy.js --network sepolia
// This script deploys the ChatTokenMinter contract and sets it as the minter in the ChatToken contract.
// If setting the minter address fails, do it manually by calling the setMinter function in the ChatToken contract.

const contractName = "ChatTokenMinter";

const chatTokenAddress = "0x305912c0d03C22e6eB7D37E06A47ab899e48B9Af";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    chatTokenAddress
  );

  console.log(contractName + " contract address:", instance.address);

  console.log("Wait for deploy transaction to be mined...");

  await instance.deployed();

  console.log("Set minter contract address as the Minter in the ChatToken contract");

  const chatTokenContract = await ethers.getContractFactory("ChatToken");
  const chatTokenInstance = await chatTokenContract.attach(chatTokenAddress);

  await chatTokenInstance.setMinter(instance.address);

  console.log("Done!");
  
  console.log("Lastly, verify the Minter contract on block explorer");

  console.log("Wait a minute and then run this command to verify contract on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + chatTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });