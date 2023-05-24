// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network polygonMumbai

const contractName = "IggySwapRouter";

const frontendAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const iggyAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const routerAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    frontendAddress,
    iggyAddress,
    routerAddress
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + frontendAddress + " " + iggyAddress + " " + routerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });