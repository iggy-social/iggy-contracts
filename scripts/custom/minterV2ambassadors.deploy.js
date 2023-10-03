// Deploy minter V2 contract
// npx hardhat run scripts/custom/minterV2ambassadors.deploy.js --network songbird
// It will automatically set different fees (if needed) and set the staking contract address (if needed).
// It will also automatically add the minter to the ChatTokenMinter contract and change the minter address in the post contract.
// If any of these actions fail, you must do them manually.

const contractName = "IggyPostMinterV2Ambassadors";

const chatTokenMinterAddress = "0x31CfDF366dd9753b8443B6fc3c59598415697131";
const daoAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // DAO or web3 community which owns the frontend
const devAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // person or entity that is doing the development
const devFeeUpdaterAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // the address that can change dev fee (can be a multisig)
const postAddress = "0xE33F27496A9cE75313f6d1FA2BA95657Fc904387"; // post NFT contract
const stakingContractAddress = "0xCA9749778327CD67700d3a777731a712330beB9A"; // if you don't have it yet, leave it blank (but you'll need to set it later)
const ambassador1 = "0x17a2063e1f5C6034F4c94cfb0F4970483647a2E5"; // ambassador 1 address
const ambassador2 = "0x772bA1Faf2a2b49B452A5b287B2165cba89EfAE2"; // ambassador 2 address

// stats contract
const statsEnabled = true; // have it enabled by default so that users can see minted posts on their profile
const statsAddress = "";

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
    stakingContractAddress,
    ambassador1,
    ambassador2
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
  
  // verify contract
  console.log("Wait a minute and then run this command to verify contract on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + chatTokenMinterAddress + " " + daoAddress + " " + devAddress + " " + devFeeUpdaterAddress + " " + postAddress + " " + stakingContractAddress + " " + ambassador1 + " " + ambassador2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });