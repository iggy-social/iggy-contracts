// npx hardhat run scripts/chat/commentsContextTokenGated.deploy.js --network superposition

const contractName = "CommentsContextTokenGated";

const modTokenAddress = "0x8460eCC9cA85234a14fd973168937c4F3d093c21";
const modMinBalance = 1; // 1 NFT
const commentMinBalance = 1; // 1 NFT
const chatOwnerAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D";
const price = ethers.utils.parseEther("0.00001");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    modTokenAddress,
    chatOwnerAddress,
    commentMinBalance,
    modMinBalance,
    price
  );
  await instance.deployed();

  console.log(`${contractName} deployed to:`, instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + modTokenAddress + " " + chatOwnerAddress + ' "' + commentMinBalance + '" "' + modMinBalance + '" "' + price + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });