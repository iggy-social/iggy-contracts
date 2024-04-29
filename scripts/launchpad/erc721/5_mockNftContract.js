// If verifying contract via step 3 does not work, use this script instead
// 5. Deploy mock/test Nft721Bonding contract so that others created through factory can get auto-verified.
// npx hardhat run scripts/launchpad/erc721/5_mockNftContract.js --network sepolia

const contractName = "Nft721Bonding";

const factoryAddress = "0x50045895e1983F39FDC149C9a5AC29C39BEA18fe";
const metadataAddress = "0x498e0e6B245898c5E2dD0299d0456a8928F58ECC";
const mintingFeeReceiver = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d";
const cName = "Test collection";
const cSymbol = "TEST";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const ratio = ethers.utils.parseEther("69");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    factoryAddress,
    metadataAddress,
    mintingFeeReceiver,
    cName,
    cSymbol,
    mintingFeePercentage,
    ratio
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + factoryAddress + " " + metadataAddress + " " + mintingFeeReceiver + ' "' + cName + '" "' + cSymbol + '" "' + mintingFeePercentage + '" "' + ratio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });