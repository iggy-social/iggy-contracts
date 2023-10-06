// npx hardhat run scripts/other/manager/addManager.js --network base

const managerAddress = "";

const contractAddresses = [
  "", // Post NFT
  "", // Post metadata
  "", // Post minter
  "", // Post stats

  "", // Launchpad
  "", // Launchpad stats middleware
  "", // Launchpad stats

  "", // Keys
  "", // Keys stats

  "", // Activity points
];

async function main() {
  const [ owner ] = await ethers.getSigners();

  console.log("Running script with the account:", owner.address);
  console.log("Account balance:", (await owner.getBalance()).toString());

  const intrfc = new ethers.utils.Interface([
    "function addManager(address manager_) external"
  ]);

  for (let i = 0; i < contractAddresses.length; i++) {
    const contractAddress = contractAddresses[i];
    console.log(`Adding manager address ${managerAddress} to ${contractAddress}`);

    try {
      const contract = new ethers.Contract(contractAddress, intrfc, owner);
      const tx = await contract.addManager(managerAddress);
      await tx.wait();
    } catch (error) {
      console.log(error.code);
      continue;
    }

    console.log(`Manager added to ${contractAddress}`);
  }

  console.log("Done");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });