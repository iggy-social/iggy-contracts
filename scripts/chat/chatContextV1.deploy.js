// npx hardhat run scripts/chat/chatContextV1.deploy.js --network sepolia

const contractName = "ChatContextV1";

const modTokenAddress = "0x63F36191b3660A70059661083C2189a71be5FBdE";
const modMinBalance = 1; // 1 NFT
const chatOwnerAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D";

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