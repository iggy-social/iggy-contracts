// Deploy minter V2 contract
// npx hardhat run scripts/post/IggyPostNft1155/minterV2.deploy.js --network polygonMumbai
// It will automatically set different fees (if needed) and set the staking contract address (if needed).
// It will also automatically add the minter to the ChatTokenMinter contract and change the minter address in the post contract.
// If any of these actions fail, you must do them manually.

const contractName = "IggyPostMinterV2";

const chatTokenMinterAddress = "0x2C6A9F47a2B1BA7976ACd14CDd8f6f35d27C1e28";
const daoAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // DAO or web3 community which owns the frontend
const devAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // person or entity that is doing the development
const devFeeUpdaterAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // the address that can change dev fee (can be a multisig)
const postAddress = "0x9f48c192561f3A6f0efeeE5Fce00Fd9788675eF8";
const chatEthRatio = 10000000; // 1 ETH = 10,000,000 CHAT
const chatRewardsDuration = 60 * 60 * 24 * 30 * 12; // 30 days * 12 months = 1 year

// set fees separately (only set if needed)
let daoFee; // = 450; // 4.5%
let devFee; // = 900; // 9%
let referrerFee = 200; // = 200; // 2%
let stakingFee; // = 450; // 4.5%
const stakingContractAddress = ""; // if you don't have it yet, leave it blank (but you'll need to set it later)

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    chatTokenMinterAddress,
    daoAddress,
    devAddress,
    devFeeUpdaterAddress,
    postAddress,
    chatEthRatio,
    chatRewardsDuration
  );

  console.log(contractName + " contract address:", instance.address);

  await instance.deployed();

  console.log("Deploy transaction mined!");

  console.log("Add post minter contract address as a minter in the ChatTokenMinter contract");

  // add as minter to ChatTokenMinter contract
  const chatTokenMinterContract = await ethers.getContractFactory("ChatTokenMinter");
  const chatTokenMinterInstance = await chatTokenMinterContract.attach(chatTokenMinterAddress);
  const tx1 = await chatTokenMinterInstance.addMinter(instance.address);
  //await tx1.wait();

  // change minter address in post contract
  console.log("Change minter address in post contract");
  console.log("MAKE SURE THE POST CONTRACT IS OWNED BY THIS DEPLOYER! (Otherwise make the transaction manually)");

  const postInterface = new ethers.utils.Interface([
    "function ownerChangeMinterAddress(address _newMinterAddress) external",
    "function owner() external view returns (address)"
  ]);

  //const postContract = new ethers.Contract(postAddress, postInterface, deployer);
  const postContract = await ethers.getContractFactory("IggyPostNft1155");
  const postContractInstance = await postContract.attach(postAddress);

  const postContractOwner = await postContractInstance.owner();
  console.log("Post contract owner:", postContractOwner);

  if (String(postContractOwner).toLowerCase() == String(deployer.address).toLowerCase()) {
    const tx2 = await postContractInstance.ownerChangeMinterAddress(instance.address);
    //await tx2.wait();
  } else {
    console.log("Post contract is not owned by this deployer. Please change the minter address manually.");
  }

  // set staking contract address
  if (stakingContractAddress) {
    console.log("Setting staking contract address...");
    const tx3 = await instance.changeStakingAddress(stakingContractAddress);
    //await tx3.wait();
    console.log("Staking contract address set!");
  }

  // set dao fee
  if (daoFee) {
    console.log("Setting DAO fee...");
    const tx4 = await instance.changeDaoFee(daoFee);
    //await tx4.wait();
    console.log("DAO fee set!");
  }

  // set dev fee
  if (devFee) {
    console.log("Setting dev fee...");
    const tx5 = await instance.changeDevFee(devFee);
    //await tx5.wait();
    console.log("Dev fee set!");
  }

  // set referrer fee
  if (referrerFee) {
    console.log("Setting referrer fee...");
    const tx6 = await instance.changeReferrerFee(referrerFee);
    //await tx6.wait();
    console.log("Referrer fee set!");
  }

  // set staking fee
  if (stakingFee) {
    console.log("Setting staking fee...");
    const tx7 = await instance.changeStakingFee(stakingFee);
    //await tx7.wait();
    console.log("Staking fee set!");
  }
  
  // verify contract
  console.log("Wait a minute and then run this command to verify contract on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + chatTokenMinterAddress + " " + daoAddress + " " + devAddress + " " + devFeeUpdaterAddress + " " + postAddress + ' "' + chatEthRatio + '" "' + chatRewardsDuration + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });