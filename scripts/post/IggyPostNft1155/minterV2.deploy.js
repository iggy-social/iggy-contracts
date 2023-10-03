// Deploy minter V2 contract
// npx hardhat run scripts/post/IggyPostNft1155/minterV2.deploy.js --network polygonMumbai
// It will automatically set different fees (if needed).
// It will also automatically add the minter to the ChatTokenMinter contract and change the minter address in the post contract.
// If any of these actions fail, you must do them manually.

const contractName = "IggyPostMinterV2";

const chatTokenMinterAddress = "0x2C6A9F47a2B1BA7976ACd14CDd8f6f35d27C1e28";
const daoAddress = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d"; // DAO or web3 community which owns the frontend
const devAddress = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d"; // person or entity that is doing the development
const devFeeUpdaterAddress = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d"; // the address that can change dev fee (can be a multisig)
const postAddress = "0x63FE8216a66737CFE474DF3949F9081EbD4Bd800";
const chatEthRatio = 10; // 1 ETH/SGB = 10 CHAT
const chatRewardsDuration = 60 * 60 * 24 * 30 * 11; // 30 days * 12 months = 1 year

// stats contract
const statsEnabled = false; // have it enabled by default so that users can see minted posts on their profile
const statsAddress = "";

// set fees separately (only set if needed)
let daoFee = 0; // = 450; // 4.5%
let devFee = 0; // = 900; // 9%
let referrerFee; // = 200; // = 200; // 2%

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
  await tx1.wait();

  // change minter address in post contract
  console.log("Change minter address in post contract");
  console.log("MAKE SURE THE POST CONTRACT IS OWNED BY THIS DEPLOYER! (Otherwise make the transaction manually)");

  const postContract = await ethers.getContractFactory("IggyPostNft1155");
  const postContractInstance = await postContract.attach(postAddress);

  const postContractOwner = await postContractInstance.owner();
  console.log("Post contract owner:", postContractOwner);

  if (String(postContractOwner).toLowerCase() == String(deployer.address).toLowerCase()) {
    const tx2 = await postContractInstance.ownerChangeMinterAddress(instance.address);
    await tx2.wait();
  } else {
    console.log("Post contract is not owned by this deployer. Please change the minter address manually.");
  }

  // change post minter address in stats contract
  if (statsEnabled && statsAddress) {
    console.log("Change post minter address in stats contract");

    const statsContract = await ethers.getContractFactory("IggyPostStats");
    const statsContractInstance = await statsContract.attach(statsAddress);

    // setMinterAddress
    const tx2b = await statsContractInstance.setMinterAddress(instance.address);
    await tx2b.wait();

    // check if statsEnabled in smart contract is true
    const statsEnabledInContract = await instance.statsEnabled();

    if (!statsEnabledInContract) {
      console.log("Stats enabled in contract is false. Enabling it now...");
      const tx2c = await instance.toggleStatsEnabled();
      await tx2c.wait();
    }

    // change stats address in post minter contract
    console.log("Change stats address in post minter contract");
    const tx2d = await instance.changeStatsAddress(statsAddress);
    await tx2d.wait();
  }

  // set dao fee
  if (daoFee > 0) {
    console.log("Setting DAO fee...");
    const tx4 = await instance.changeDaoFee(daoFee);
    await tx4.wait();
    console.log("DAO fee set!");
  }

  // set dev fee
  if (devFee > 0) {
    console.log("Setting dev fee...");
    const tx5 = await instance.changeDevFee(devFee);
    await tx5.wait();
    console.log("Dev fee set!");
  }

  // set referrer fee
  if (referrerFee > 0) {
    console.log("Setting referrer fee...");
    const tx6 = await instance.changeReferrerFee(referrerFee);
    await tx6.wait();
    console.log("Referrer fee set!");
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