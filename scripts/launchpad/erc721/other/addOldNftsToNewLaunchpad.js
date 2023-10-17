// Add NFTs from the old launchpad to the new one
// npx hardhat run scripts/launchpad/erc721/other/addOldNftsToNewLaunchpad.js --network flare

const launchpadContractName = "IggyLaunchpad721Bonding";
const newLaunchpadAddress = "";

const nfts = [
  
];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const launchpadContract = await ethers.getContractFactory(launchpadContractName);
  const instance = await launchpadContract.attach(newLaunchpadAddress);

  // add nfts to contract via addImageToCollection() function
  for (let i = 0; i < nfts.length; i++) {
    console.log("Adding NFT", nfts[i]);
    const tx = await instance.addNftAddressToAll(nfts[i]);
    await tx.wait();
    sleep(2000);
  }

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });