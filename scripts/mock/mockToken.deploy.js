// npx hardhat run scripts/mock/mockToken.deploy.js --network polygonMumbai

const contractName = "MockErc20TokenDecimals";

const tokenName = "Mock LP Token";
const symbol = "MLPT";
const decimals = 18;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    tokenName, symbol, decimals
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + tokenName + '" "' + symbol + '" "' + decimals + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });