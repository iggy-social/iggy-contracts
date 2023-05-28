// Deploy minter V2 contract
// npx hardhat run scripts/post/IggyPostNft1155/minterV2.deploy.js --network songbird
// It will automatically set different fees (if needed) and set the staking contract address (if needed).
// It will also automatically add the minter to the ChatTokenMinter contract and change the minter address in the post contract.
// If any of these actions fail, you must do them manually.

const contractName = "IggyPostMinterV2";

const chatTokenMinterAddress = "0x31CfDF366dd9753b8443B6fc3c59598415697131";
const daoAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // DAO or web3 community which owns the frontend
const devAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // person or entity that is doing the development
const devFeeUpdaterAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // the address that can change dev fee (can be a multisig)
const postAddress = "0x99Dbf11aCd46baFBCE82506FaeB4F13E6Ea1726A";
const chatEthRatio = 1000; // 1 ETH/SGB = 1,000 CHAT
const chatRewardsDuration = 60 * 60 * 24 * 30 * 12; // 30 days * 12 months = 1 year

// enumeration contract
const enumEnabled = true; // have it enabled by default so that users can see minted posts on their profile
const enumAddress = "0x0BF6333Fc85159663A30Ac89FD02c5031B97c5ee";

// set fees separately (only set if needed)
let daoFee = 0; // = 450; // 4.5%
let devFee = 0; // = 900; // 9%
let referrerFee; // = 200; // = 200; // 2%
let stakingFee = 1800; // = 450; // 4.5%
const stakingContractAddress = "0xCA9749778327CD67700d3a777731a712330beB9A"; // if you don't have it yet, leave it blank (but you'll need to set it later)

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

  // change post minter address in enum contract
  if (enumEnabled && enumAddress) {
    console.log("Change post minter address in enum contract");

    const enumContract = await ethers.getContractFactory("IggyPostEnumeration");
    const enumContractInstance = await enumContract.attach(enumAddress);

    // setMinterAddress
    const tx2b = await enumContractInstance.setMinterAddress(instance.address);
    await tx2b.wait();

    // check if enumEnabled in smart contract is true
    const enumEnabledInContract = await instance.enumEnabled();

    if (!enumEnabledInContract) {
      console.log("Enum enabled in contract is false. Enabling it now...");
      const tx2c = await instance.toggleEnumEnabled();
      await tx2c.wait();
    }

    // change enum address in post minter contract
    console.log("Change enum address in post minter contract");
    const tx2d = await instance.changeEnumAddress(enumAddress);
    await tx2d.wait();
  }

  // set staking contract address
  if (stakingContractAddress) {
    console.log("Setting staking contract address...");
    const tx3 = await instance.changeStakingAddress(stakingContractAddress);
    await tx3.wait();
    console.log("Staking contract address set!");
  } else {
    console.log("Staking contract address not set. Please set it manually.");
  }

  // set dao fee
  if (daoFee === 0 || daoFee > 0) {
    console.log("Setting DAO fee...");
    const tx4 = await instance.changeDaoFee(daoFee);
    await tx4.wait();
    console.log("DAO fee set!");
  }

  // set dev fee
  if (devFee === 0 || devFee > 0) {
    console.log("Setting dev fee...");
    const tx5 = await instance.changeDevFee(devFee);
    await tx5.wait();
    console.log("Dev fee set!");
  }

  // set referrer fee
  if (referrerFee === 0 || referrerFee > 0) {
    console.log("Setting referrer fee...");
    const tx6 = await instance.changeReferrerFee(referrerFee);
    await tx6.wait();
    console.log("Referrer fee set!");
  }

  // set staking fee
  if (stakingFee === 0 || stakingFee > 0) {
    console.log("Setting staking fee...");
    const tx7 = await instance.changeStakingFee(stakingFee);
    await tx7.wait();
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