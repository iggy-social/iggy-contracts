// Deploy NftMetadata contract for multiple onchain images
// npx hardhat run scripts/launchpad/erc721/other/addImagesToNftMetadata.js --network degen

const contractName = "NftMetadata";
const contractAddress = "0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e"; // NftMetadata contract address
const nftAddress = "0x0B9144d62C3efC16656fdD8f5Ad29635b2cAc6e4";
const imageBase = "https://bafybeihbd5ooped6hhssdwsmsny3uidp4eznjdy4fbypslqhzyrsgclwqq.ipfs.nftstorage.link/punk_tophat_";
const startId = 148; // CHECK!!!
const endId = 5000;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.attach(contractAddress);
  
  console.log(contractName + " contract address:", instance.address);

  // create a for loop to add images to the NFT metadata contract (use startId and endId variables)
  for (let i = startId; i <= endId; i++) {
    const image = imageBase + i + ".png";
    console.log("Adding image to NFT metadata contract:", image);

    try {
      const tx = await instance.addImageToCollection(nftAddress, image);
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        console.error("Transaction has failed:", receipt);
        break;
      }
    } catch (error) {
      console.error("Error adding image to NFT metadata contract:", error);
      break;
    }

    await sleep(700);
  }

  console.log("END");
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