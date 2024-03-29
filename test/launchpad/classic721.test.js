// npx hardhat test test/launchpad/classic721.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

function calculateGasCosts(testName, receipt) {
  console.log(testName + " gasUsed: " + receipt.gasUsed);

  // coin prices in USD
  const matic = 1.5;
  const eth = 1500;
  
  const gasCostMatic = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("500", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostEthereum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("50", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostArbitrum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("1.25", "gwei")) * Number(receipt.gasUsed)), "ether");

  console.log(testName + " gas cost (Ethereum): $" + String(Number(gasCostEthereum)*eth));
  console.log(testName + " gas cost (Arbitrum): $" + String(Number(gasCostArbitrum)*eth));
  console.log(testName + " gas cost (Polygon): $" + String(Number(gasCostMatic)*matic));
}

describe("IggyLaunchpad721Classic", function () {
  let directoryContract;
  let launchpadContract;
  let statsContract;
  let statsMiddlewareContract;
  let metadataContract;

  let factoryOwner;
  let feeReceiver;
  let nftContractOwner;
  let user1;
  let user2;

  const feePercent = ethers.utils.parseEther("0.02");
  const priceLaunch = ethers.utils.parseEther("69"); // price for launching a new NFT contract

  // NFT contract data
  const nftDescription = "Iggy NFT is a new unique NFT project";
  const nftImage = "https://iggy.social/assets/img/preview.jpg";
  const nftMetadataName = "Iggy";
  const nftName = "Iggy NFT";
  const nftSymbol = "IGGY";
  const nftUniqueId = "justsomethingunique";

  const mintPrice = ethers.utils.parseEther("1"); // price for minting an NFT
  const maxSupply = 1000; // max supply of the NFT contract

  beforeEach(async function () {
    [factoryOwner, feeReceiver, nftContractOwner, user1, user2, referrer] = await ethers.getSigners();

    const Stats = await ethers.getContractFactory("Stats");
    statsContract = await Stats.deploy();
    await statsContract.deployed();

    const StatsMiddleware = await ethers.getContractFactory("StatsMiddleware");
    statsMiddlewareContract = await StatsMiddleware.deploy(statsContract.address);
    await statsMiddlewareContract.deployed();

    // add middleware contract address to launchpad stats contract
    await statsContract.setStatsWriterAddress(statsMiddlewareContract.address);

    const NftMetadata = await ethers.getContractFactory("NftMetadata");
    metadataContract = await NftMetadata.deploy();
    await metadataContract.deployed();

    const NftDirectory = await ethers.getContractFactory("NftDirectory");
    directoryContract = await NftDirectory.deploy();
    await directoryContract.deployed();

    const IggyLaunchpad721Classic = await ethers.getContractFactory("IggyLaunchpad721Classic");
    launchpadContract = await IggyLaunchpad721Classic.deploy(
      metadataContract.address,
      feeReceiver.address,
      directoryContract.address,
      statsMiddlewareContract.address,
      feePercent,
      priceLaunch
    );
    await launchpadContract.deployed();

    // add launchpad contract as writer in the NFT directory contract
    await directoryContract.addWriter(launchpadContract.address);

    // add launchpad contract address to stats middleware contract as writer
    await statsMiddlewareContract.addWriter(launchpadContract.address);
  });

  it("creates a new NFT contract via launchpad and mints a bunch of NFTs", async function () {
    // get user1 balance before
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceBefore: " + ethers.utils.formatEther(user1BalanceBefore) + " ETH");

    // get fee receiver balance before
    const feeReceiverBalanceBefore = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceBefore: " + ethers.utils.formatEther(feeReceiverBalanceBefore) + " ETH");

    // launch a new NFT contract
    const tx = await launchpadContract.connect(user1).launch(
      user1.address, // NFT contract owner
      ethers.constants.AddressZero, // referrer
      nftDescription,
      nftImage,
      nftMetadataName,
      nftName,
      nftSymbol,
      nftUniqueId,
      maxSupply,
      mintPrice,
      { value: priceLaunch }
    );
    const receipt = await tx.wait();
    //calculateGasCosts("launch", receipt);

    // get user1 balance after
    const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter: " + ethers.utils.formatEther(user1BalanceAfter) + " ETH");

    // get fee receiver balance after
    const feeReceiverBalanceAfter = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter: " + ethers.utils.formatEther(feeReceiverBalanceAfter) + " ETH");

    // get NFT contract address
    const nftContractAddress = await directoryContract.getNftContractAddress(nftUniqueId);
    console.log("nftContractAddress: " + nftContractAddress);

    // create NFT contract instance
    const Nft721Classic = await ethers.getContractFactory("Nft721Classic");
    const nftContract = await Nft721Classic.attach(nftContractAddress);

    console.log("-- Mint NFTs #1 & #2 --");

    // get NFT total supply
    const nftTotalSupply1 = await nftContract.totalSupply();
    console.log("Total Supply 1: " + nftTotalSupply1);

    // get mint price 1
    const mintPrice1 = await nftContract.getMintPrice();
    console.log("Mint Price 1: " + ethers.utils.formatEther(mintPrice1) + " ETH");

    // mint 1 NFT
    const tx1 = await nftContract.connect(user2).mint(
      user2.address, 
      { value: mintPrice1 }
    );
    const receipt1 = await tx1.wait();
    //calculateGasCosts("mint1", receipt1);

    // get user1 balance 1
    const user1Balance1 = await ethers.provider.getBalance(user1.address);
    console.log("user1 balance 1: " + ethers.utils.formatEther(user1Balance1) + " ETH");

    // get fee receiver balance 1
    const feeReceiverBalance1 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("fee receiver balance 1: " + ethers.utils.formatEther(feeReceiverBalance1) + " ETH");

    // get user2 balance 1
    const user2Balance1 = await ethers.provider.getBalance(user2.address);
    console.log("user2 balance 1: " + ethers.utils.formatEther(user2Balance1) + " ETH");

    // get NFT contract balance 1
    const nftContractBalance1 = await ethers.provider.getBalance(nftContractAddress);
    console.log("NFT contract balance 1: " + ethers.utils.formatEther(nftContractBalance1) + " ETH");

    // check the owner of the NFT #1 (should be user2)
    const nftOwner1 = await nftContract.ownerOf(1);
    expect(nftOwner1).to.equal(user2.address);

    console.log("-- Mint NFT #2 --");

    // get NFT total supply
    const nftTotalSupply2 = await nftContract.totalSupply();
    console.log("Total Supply 2: " + nftTotalSupply2);

    // get mint price 2
    const mintPrice2 = await nftContract.getMintPrice();
    console.log("Mint Price 2: " + ethers.utils.formatEther(mintPrice2) + " ETH");

    // mint NFT #2
    const tx2 = await nftContract.connect(user2).mint(
      user2.address, 
      { value: mintPrice2 }
    );
    const receipt2 = await tx2.wait();
    //calculateGasCosts("mint2", receipt2);

    // get user1 balance 3
    const user1Balance3 = await ethers.provider.getBalance(user1.address);
    console.log("user1 balance 3: " + ethers.utils.formatEther(user1Balance3) + " ETH");

    // get fee receiver balance 3
    const feeReceiverBalance3 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("fee receiver balance 3: " + ethers.utils.formatEther(feeReceiverBalance3) + " ETH");

    // get user2 balance 3
    const user2Balance3 = await ethers.provider.getBalance(user2.address);
    console.log("user2 balance 3: " + ethers.utils.formatEther(user2Balance3) + " ETH");

    // get NFT contract balance 3
    const nftContractBalance3 = await ethers.provider.getBalance(nftContractAddress);
    console.log("NFT contract balance 3: " + ethers.utils.formatEther(nftContractBalance3) + " ETH");

    console.log("-- Mint NFT #3 --");

    // get NFT total supply
    const nftTotalSupply4 = await nftContract.totalSupply();
    console.log("Total Supply: " + nftTotalSupply4);

    // get mint price 4
    const mintPrice4 = await nftContract.getMintPrice();
    console.log("Mint Price: " + ethers.utils.formatEther(mintPrice4) + " ETH");

    // mint NFT #4
    const tx4 = await nftContract.connect(user2).mint(
      user2.address, 
      { value: mintPrice4 }
    );
    const receipt4 = await tx4.wait();
    //calculateGasCosts("mint4", receipt4);

    // get user1 balance 4
    const user1Balance4 = await ethers.provider.getBalance(user1.address);
    console.log("user1 balance 4: " + ethers.utils.formatEther(user1Balance4) + " ETH");

    // get fee receiver balance 4
    const feeReceiverBalance4 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("fee receiver balance 4: " + ethers.utils.formatEther(feeReceiverBalance4) + " ETH");

    // get user2 balance 4
    const user2Balance4 = await ethers.provider.getBalance(user2.address);
    console.log("user2 balance 4: " + ethers.utils.formatEther(user2Balance4) + " ETH");

    // get NFT contract balance 4
    const nftContractBalance4 = await ethers.provider.getBalance(nftContractAddress);
    console.log("NFT contract balance 4: " + ethers.utils.formatEther(nftContractBalance4) + " ETH");

    console.log("-- Mint NFT #4 --");

    // get NFT total supply
    const nftTotalSupply5 = await nftContract.totalSupply();
    console.log("Total Supply 4: " + nftTotalSupply5);

    // get mint price 5
    const mintPrice5 = await nftContract.getMintPrice();
    console.log("Mint Price 4: " + ethers.utils.formatEther(mintPrice5) + " ETH");

    // mint NFT #5
    const tx5 = await nftContract.connect(user2).mint(
      user2.address, 
      { value: mintPrice5 }
    );
    const receipt5 = await tx5.wait();
    //calculateGasCosts("mint5", receipt5);

    // get user1 balance 5
    const user1Balance5 = await ethers.provider.getBalance(user1.address);
    console.log("user1 balance 5: " + ethers.utils.formatEther(user1Balance5) + " ETH");

    // get fee receiver balance 5
    const feeReceiverBalance5 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("fee receiver balance 5: " + ethers.utils.formatEther(feeReceiverBalance5) + " ETH");

    // get user2 balance 5
    const user2Balance5 = await ethers.provider.getBalance(user2.address);
    console.log("user2 balance 5: " + ethers.utils.formatEther(user2Balance5) + " ETH");

    // get NFT contract balance 5
    const nftContractBalance5 = await ethers.provider.getBalance(nftContractAddress);
    console.log("NFT contract balance 5: " + ethers.utils.formatEther(nftContractBalance5) + " ETH");

    console.log("-- Mint NFT #5 --");

    // get NFT total supply
    const nftTotalSupply6 = await nftContract.totalSupply();
    console.log("Total Supply 5: " + nftTotalSupply6);

    // get mint price 6
    const mintPrice6 = await nftContract.getMintPrice();
    console.log("Mint Price 5: " + ethers.utils.formatEther(mintPrice6) + " ETH");

    // mint NFT #5
    const tx6 = await nftContract.connect(user2).mint(
      user2.address, 
      { value: mintPrice6 }
    );
    const receipt6 = await tx6.wait();
    //calculateGasCosts("mint6", receipt6);

    // get user1 balance 6
    const user1Balance6 = await ethers.provider.getBalance(user1.address);
    console.log("user1 balance 6: " + ethers.utils.formatEther(user1Balance6) + " ETH");

    // get fee receiver balance 6
    const feeReceiverBalance6 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("fee receiver balance 6: " + ethers.utils.formatEther(feeReceiverBalance6) + " ETH");

    // get user2 balance 6
    const user2Balance6 = await ethers.provider.getBalance(user2.address);
    console.log("user2 balance 6: " + ethers.utils.formatEther(user2Balance6) + " ETH");

    // get NFT contract balance 6
    const nftContractBalance6 = await ethers.provider.getBalance(nftContractAddress);
    console.log("NFT contract balance 6: " + ethers.utils.formatEther(nftContractBalance6) + " ETH");

    // change NFT & collection image via metadata contract (use setMdTypeAndUrlOrImage function)
    await metadataContract.connect(user1).setMdTypeAndUrlOrImage(
      nftContractAddress,
      0, // mdType: 0 (static image URL)
      "https://iggy.social/assets/img/preview.jpg",
      "https://iggy.social/assets/img/preview.jpg"
    );

    // check minting fee before
    const mintingFeePercentageBefore = await launchpadContract.mintingFeePercentage();
    console.log("mintingFeePercentageBefore: " + Number(ethers.utils.formatEther(mintingFeePercentageBefore))*100 + "%");

    // fail to change minting fee via setMintingFeePercentage function in the launchpad contract if new fee is too high (over 5%)
    await expect(launchpadContract.setMintingFeePercentage(ethers.utils.parseEther("0.06"))).to.be.revertedWith("IggyLaunchpad721Classic: fee must be lower than 5%");

    // set minting fee to 1% via setMintingFeePercentage function in the NFT contract
    await launchpadContract.setMintingFeePercentage(ethers.utils.parseEther("0.01"));

    // check minting fee after
    const mintingFeePercentageAfter = await launchpadContract.mintingFeePercentage();
    console.log("mintingFeePercentageAfter: " + Number(ethers.utils.formatEther(mintingFeePercentageAfter))*100 + "%");
    expect(mintingFeePercentageAfter).to.equal(ethers.utils.parseEther("0.01"));
    expect(mintingFeePercentageAfter).to.be.lt(mintingFeePercentageBefore);

  });

  it("creates a few new NFT contracts via launchpad and queries them", async function () {

    // check referrer balance
    const referrerBalanceBefore = await ethers.provider.getBalance(referrer.address);
    console.log("referrerBalanceBefore: " + ethers.utils.formatEther(referrerBalanceBefore) + " ETH");

    await launchpadContract.connect(user1).launch(
      user1.address, // NFT contract owner
      referrer.address, // referrer
      nftDescription,
      nftImage,
      nftMetadataName,
      nftName,
      nftSymbol,
      nftUniqueId,
      maxSupply,
      mintPrice,
      { value: priceLaunch }
    );

    // referrer balance after 1
    const referrerBalanceAfter1 = await ethers.provider.getBalance(referrer.address);
    console.log("referrerBalanceAfter1: " + ethers.utils.formatEther(referrerBalanceAfter1) + " ETH");

    await launchpadContract.connect(user1).launch(
      user2.address, // NFT contract owner
      ethers.constants.AddressZero, // referrer
      nftDescription,
      nftImage,
      nftMetadataName,
      nftName,
      nftSymbol,
      nftUniqueId + "2",
      maxSupply,
      mintPrice,
      { value: priceLaunch }
    );

    // referrer balance after 2
    const referrerBalanceAfter2 = await ethers.provider.getBalance(referrer.address);
    console.log("referrerBalanceAfter2: " + ethers.utils.formatEther(referrerBalanceAfter2) + " ETH");

    await launchpadContract.connect(user1).launch(
      user1.address, // NFT contract owner
      referrer.address, // referrer
      nftDescription,
      nftImage,
      nftMetadataName,
      nftName,
      nftSymbol,
      nftUniqueId + "3",
      maxSupply,
      mintPrice,
      { value: priceLaunch }
    );

    // referrer balance after 3
    const referrerBalanceAfter3 = await ethers.provider.getBalance(referrer.address);
    console.log("referrerBalanceAfter3: " + ethers.utils.formatEther(referrerBalanceAfter3) + " ETH");

    // call getLastNftContracts

    const lastNftContracts3 = await directoryContract.getLastNftContracts(3);
    console.log(lastNftContracts3);

    const lastNftContracts2 = await directoryContract.getLastNftContracts(2);
    console.log(lastNftContracts2);

    const lastNftContracts5 = await directoryContract.getLastNftContracts(5);
    console.log(lastNftContracts5);

    const lastFeaturedContracts5 = await directoryContract.getFeaturedNftContracts(5);
    console.log(lastFeaturedContracts5);

    // addNftAddressToFeatured
    await directoryContract.addNftAddressToFeatured(lastNftContracts3[1]);

    const lastFeaturedContracts6 = await directoryContract.getFeaturedNftContracts(6);
    console.log(lastFeaturedContracts6);

  });

});