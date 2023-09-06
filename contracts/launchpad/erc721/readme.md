# NFT launchpad smart contracts

Deployment order:

1. Deploy LaunchpadStats contract.
2. Deploy StatsMiddleware contract.
3. Enter address of each deployed contracts into another.
4. Deploy NftMetadata.sol contract.
5. Deploy IggyLaunchpad contract (enter the stats middleware address and the metadata address in the constructor).
6. Enter Launchpad address as a writer into the stats middleware contract.