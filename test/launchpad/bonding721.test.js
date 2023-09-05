// npx hardhat test test/launchpad/bonding721.test.js

const { expect } = require("chai");

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

describe("IggyLaunchpad721Bonding", function () {
  let launchpadContract;
  let statsContract;
  let statsMiddlewareContract;
  let metadataContract;

  let factoryOwner;
  let feeReceiver;
  let nftContractOwner;
  let user1;
  let user2;

  const feePercent = ethers.utils.parseEther("0.05");
  const priceLaunch = ethers.utils.parseEther("69"); // price for launching a new NFT contract
  const ratio = ethers.utils.parseEther("1"); // ratio for the bonding curve

  // NFT contract data
  const nftDescription = "Iggy NFT is a new unique NFT project";
  const nftImage = "https://iggy.social/assets/img/preview.jpg";
  const nftMetadataName = "Iggy";
  const nftName = "Iggy NFT";
  const nftSymbol = "IGGY";
  const nftUniqueId = "justsomethingunique";

  beforeEach(async function () {
    [factoryOwner, feeReceiver, nftContractOwner, user1, user2] = await ethers.getSigners();

    const StatsMiddleware = await ethers.getContractFactory("StatsMiddleware");
    statsMiddlewareContract = await StatsMiddleware.deploy();
    await statsMiddlewareContract.deployed();

    const LaunchpadStats = await ethers.getContractFactory("LaunchpadStats");
    statsContract = await LaunchpadStats.deploy();
    await statsContract.deployed();

    // add launchpad stats contract address to middleware contract
    await statsMiddlewareContract.setStatsAddress(statsContract.address);

    // add middleware contract address to launchpad stats contract
    await statsContract.setStatsWriterAddress(statsMiddlewareContract.address);

    const NftMetadata = await ethers.getContractFactory("NftMetadata");
    metadataContract = await NftMetadata.deploy();
    await metadataContract.deployed();

    const IggyLaunchpad721Bonding = await ethers.getContractFactory("IggyLaunchpad721Bonding");
    launchpadContract = await IggyLaunchpad721Bonding.deploy(
      metadataContract.address,
      feeReceiver.address,
      statsMiddlewareContract.address,
      feePercent,
      priceLaunch,
      ratio
    );
    await launchpadContract.deployed();

    // add launchpad contract address to stats middleware contract as writer
    await statsMiddlewareContract.addWriter(launchpadContract.address);
  });

  it("creates a new NFT contract via launchpad and mints&burns a bunch of NFTs", async function () {
    // get user1 balance before
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceBefore: " + ethers.utils.formatEther(user1BalanceBefore) + " ETH");

    // get fee receiver balance before
    const feeReceiverBalanceBefore = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceBefore: " + ethers.utils.formatEther(feeReceiverBalanceBefore) + " ETH");

    // launch a new NFT contract
    const tx = await launchpadContract.connect(user1).launch(
      user1.address, // NFT contract owner
      nftDescription,
      nftImage,
      nftMetadataName,
      nftName,
      nftSymbol,
      nftUniqueId,
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
    const nftContractAddress = await launchpadContract.getNftContractAddress(nftUniqueId);
    console.log("nftContractAddress: " + nftContractAddress);

    // create NFT contract instance
    const Nft721Bonding = await ethers.getContractFactory("Nft721Bonding");
    const nftContract = await Nft721Bonding.attach(nftContractAddress);

    console.log("-- Mint NFTs #1 & #2 --");

    // get NFT total supply
    const nftTotalSupply1 = await nftContract.totalSupply();
    console.log("Total Supply 1: " + nftTotalSupply1);

    // get burn price 1
    const burnPrice1 = await nftContract.getBurnPrice();
    console.log("Burn Price 1: " + ethers.utils.formatEther(burnPrice1) + " ETH");

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

    // check the owner of the NFT #1 (should be the NFT contract owner)
    const nftOwner1 = await nftContract.ownerOf(1);
    expect(nftOwner1).to.equal(user1.address);

    // check the owner of the NFT #2 (should be the user2)
    const nftOwner2 = await nftContract.ownerOf(2);
    expect(nftOwner2).to.equal(user2.address);

    console.log("-- Burn NFT #2 --");

    // get NFT total supply
    const nftTotalSupply2 = await nftContract.totalSupply();
    console.log("Total Supply 2: " + nftTotalSupply2);

    // get burn price 2
    const burnPrice2 = await nftContract.getBurnPrice();
    console.log("Burn Price 2: " + ethers.utils.formatEther(burnPrice2) + " ETH");

    // get mint price 2
    const mintPrice2 = await nftContract.getMintPrice();
    console.log("Mint Price 2: " + ethers.utils.formatEther(mintPrice2) + " ETH");

    // burn NFT #2
    const tx2 = await nftContract.connect(user2).burn(
      2 // token ID #2 (user2 owns it, while user1 owns token ID #1)
    );
    const receipt2 = await tx2.wait();
    //calculateGasCosts("burn", receipt2);

    // get user1 balance 2
    const user1Balance2 = await ethers.provider.getBalance(user1.address);
    console.log("user1 balance 2: " + ethers.utils.formatEther(user1Balance2) + " ETH");

    // get fee receiver balance 2
    const feeReceiverBalance2 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("fee receiver balance 2: " + ethers.utils.formatEther(feeReceiverBalance2) + " ETH");

    // get user2 balance 2
    const user2Balance2 = await ethers.provider.getBalance(user2.address);
    console.log("user2 balance 2: " + ethers.utils.formatEther(user2Balance2) + " ETH");

    // get NFT contract balance 2
    const nftContractBalance2 = await ethers.provider.getBalance(nftContractAddress);
    console.log("NFT contract balance 2: " + ethers.utils.formatEther(nftContractBalance2) + " ETH");

    console.log("-- Mint NFT #3 --");

    // get NFT total supply
    const nftTotalSupply3 = await nftContract.totalSupply();
    console.log("Total Supply 3: " + nftTotalSupply3);

    // get burn price 3
    const burnPrice3 = await nftContract.getBurnPrice();
    console.log("Burn Price 3: " + ethers.utils.formatEther(burnPrice3) + " ETH");

    // get mint price 3
    const mintPrice3 = await nftContract.getMintPrice();
    console.log("Mint Price 3: " + ethers.utils.formatEther(mintPrice3) + " ETH");

    // mint NFT #3
    const tx3 = await nftContract.connect(user2).mint(
      user2.address, 
      { value: mintPrice3 }
    );
    const receipt3 = await tx3.wait();
    //calculateGasCosts("mint3", receipt3);

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

    console.log("-- Mint NFT #4 --");

    // get NFT total supply
    const nftTotalSupply4 = await nftContract.totalSupply();
    console.log("Total Supply 4: " + nftTotalSupply4);

    // get burn price 4
    const burnPrice4 = await nftContract.getBurnPrice();
    console.log("Burn Price 4: " + ethers.utils.formatEther(burnPrice4) + " ETH");

    // get mint price 4
    const mintPrice4 = await nftContract.getMintPrice();
    console.log("Mint Price 4: " + ethers.utils.formatEther(mintPrice4) + " ETH");

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

    console.log("-- Mint NFT #5 --");

    // get NFT total supply
    const nftTotalSupply5 = await nftContract.totalSupply();
    console.log("Total Supply 5: " + nftTotalSupply5);

    // get burn price 5
    const burnPrice5 = await nftContract.getBurnPrice();
    console.log("Burn Price 5: " + ethers.utils.formatEther(burnPrice5) + " ETH");

    // get mint price 5
    const mintPrice5 = await nftContract.getMintPrice();
    console.log("Mint Price 5: " + ethers.utils.formatEther(mintPrice5) + " ETH");

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

    console.log("-- Mint NFT #6 --");

    // get NFT total supply
    const nftTotalSupply6 = await nftContract.totalSupply();
    console.log("Total Supply 6: " + nftTotalSupply6);

    // get burn price 6
    const burnPrice6 = await nftContract.getBurnPrice();
    console.log("Burn Price 6: " + ethers.utils.formatEther(burnPrice6) + " ETH");

    // get mint price 6
    const mintPrice6 = await nftContract.getMintPrice();
    console.log("Mint Price 6: " + ethers.utils.formatEther(mintPrice6) + " ETH");

    // mint NFT #6
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
  });

  it("get only mint price data", async function () {

    // launch a new NFT contract
    const tx = await launchpadContract.connect(user1).launch(
      user1.address, // NFT contract owner
      nftDescription,
      nftImage,
      nftMetadataName,
      nftName,
      nftSymbol,
      nftUniqueId,
      { value: priceLaunch }
    );

    // get NFT contract address
    const nftContractAddress = await launchpadContract.getNftContractAddress(nftUniqueId);
    console.log("nftContractAddress: " + nftContractAddress);

    // create NFT contract instance
    const Nft721Bonding = await ethers.getContractFactory("Nft721Bonding");
    const nftContract = await Nft721Bonding.attach(nftContractAddress);

    const numberOfMintPriceData = 25;

    for (let i = 0; i < numberOfMintPriceData; i++) {
      let mintPrice = await nftContract.getMintPrice();
      console.log(ethers.utils.formatEther(mintPrice));

      // mint NFT 
      await nftContract.connect(user2).mint(
        user2.address, 
        { value: mintPrice }
      );
    }

  });

});