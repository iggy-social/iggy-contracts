// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network songbird

const contractName = "IggySwapRouter";

const frontendAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const iggyAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const routerAddress = "0x73E93D9657E6f32203f900fe1BD81179a5bf6Ce4";
const wsgbAddress = "0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    frontendAddress,
    iggyAddress,
    routerAddress,
    wsgbAddress
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + frontendAddress + " " + iggyAddress + " " + routerAddress + " " + wsgbAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });