// npx hardhat run scripts/staking/iggyStakingRewards.deploy.js --network polygonMumbai
const contractName = "IggyStakingRewards";

const assetAddress = "0xF874f79eBfB8FEe898a289C4cAa5dc4383873431"; // token to stake
const tokenName = "Iggy Chat Go";
const symbol = "ICG";
const claimRewardsMinimum = ethers.utils.parseEther("0.000001");
const minDeposit = ethers.utils.parseEther("0.00000001");
const periodLength = 3500; // almost 1 hour // 604800; // 7 days

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    assetAddress, tokenName, symbol, claimRewardsMinimum, minDeposit, periodLength
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + assetAddress + ' "' + tokenName + '" "' + symbol + '" "' + claimRewardsMinimum + '" "' + minDeposit + '" "' + periodLength + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });