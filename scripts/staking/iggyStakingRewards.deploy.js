// npx hardhat run scripts/staking/iggyStakingRewards.deploy.js --network polygonMumbai
const contractName = "IggyStakingRewards";

const assetAddress = "0xF874f79eBfB8FEe898a289C4cAa5dc4383873431"; // token to stake
const wethAddress = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"; // wrapped native coin (WETH, WSGB, WBNB, etc.)
const tokenName = "Iggy Governance Token";
const symbol = "IGT";
const claimRewardsMinimum = ethers.utils.parseEther("0.001"); // 10 SGB/ETH minimum total reward for a given week (if not met, rewards are rolled over to the next week)
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