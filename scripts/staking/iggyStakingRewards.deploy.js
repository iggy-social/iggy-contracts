// npx hardhat run scripts/staking/iggyStakingRewards.deploy.js --network songbird
const contractName = "IggyStakingRewards";

const assetAddress = "0xdE533DE5e9A73934B380c70f3611B116b8DF7D0d"; // token to stake
const wethAddress = ""; // wrapped native coin (WETH, WSGB, WBNB, etc.)
const tokenName = "SGB Chat Governance Token";
const symbol = "SCG";
const claimRewardsMinimum = ethers.utils.parseEther("10"); // 10 SGB/ETH minimum total reward for a given week (if not met, rewards are rolled over to the next week)
const minDeposit = ethers.utils.parseEther("0.001"); // 0.001 LP tokens minimum deposit to stake
const periodLength = 604800; // 7 days

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    assetAddress, wethAddress, tokenName, symbol, claimRewardsMinimum, minDeposit, periodLength
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + assetAddress + " " + wethAddress + ' "' + tokenName + '" "' + symbol + '" "' + claimRewardsMinimum + '" "' + minDeposit + '" "' + periodLength + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });