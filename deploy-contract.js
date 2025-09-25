const { ethers } = require('ethers');
const solc = require('solc');

// Smart Contract Source Code
const SUPPLY_CHAIN_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    // Struct to represent a batch/product
    struct Batch {
        string batchId;
        string product;
        uint256 quantity;
        address farmer;
        address distributor;
        address retailer;
        address consumer;
        uint256 createdAt;
        uint256 updatedAt;
        string status;
        bool exists;
    }

    // Mapping from batch ID to batch information
    mapping(string => Batch) public batches;
    
    // Array to store all batch IDs for enumeration
    string[] public batchIds;
    
    // Events
    event BatchCreated(string indexed batchId, string product, uint256 quantity, address farmer);
    event BatchUpdated(string indexed batchId, string status, address updatedBy);
    event BatchTransferred(string indexed batchId, address from, address to, string role);

    // Renamed modifier to avoid clashing with the view function name
    modifier requireBatchExists(string memory _batchId) {
        require(batches[_batchId].exists, "Batch does not exist");
        _;
    }

    // Function to create a new batch (only farmer can call this)
    function createBatch(
        string memory _batchId,
        string memory _product,
        uint256 _quantity
    ) external {
        require(!batches[_batchId].exists, "Batch already exists");
        require(_quantity > 0, "Quantity must be greater than 0");
        
        batches[_batchId] = Batch({
            batchId: _batchId,
            product: _product,
            quantity: _quantity,
            farmer: msg.sender,
            distributor: address(0),
            retailer: address(0),
            consumer: address(0),
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            status: "Created by Farmer",
            exists: true
        });
        
        batchIds.push(_batchId);
        
        emit BatchCreated(_batchId, _product, _quantity, msg.sender);
    }

    // Function to update batch status (any authorized party can call this)
    function updateBatchStatus(
        string memory _batchId,
        string memory _status
    ) external requireBatchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        
        // Check if the caller is authorized to update this batch
        require(
            msg.sender == batch.farmer ||
            msg.sender == batch.distributor ||
            msg.sender == batch.retailer ||
            msg.sender == batch.consumer,
            "Not authorized to update this batch"
        );
        
        batch.status = _status;
        batch.updatedAt = block.timestamp;
        
        emit BatchUpdated(_batchId, _status, msg.sender);
    }

    // Function to transfer batch to distributor
    function transferToDistributor(
        string memory _batchId,
        address _distributor
    ) external requireBatchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(msg.sender == batch.farmer, "Only farmer can transfer to distributor");
        require(_distributor != address(0), "Invalid distributor address");
        
        batch.distributor = _distributor;
        batch.status = "Transferred to Distributor";
        batch.updatedAt = block.timestamp;
        
        emit BatchTransferred(_batchId, batch.farmer, _distributor, "Distributor");
    }

    // Function to transfer batch to retailer
    function transferToRetailer(
        string memory _batchId,
        address _retailer
    ) external requireBatchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(msg.sender == batch.distributor, "Only distributor can transfer to retailer");
        require(_retailer != address(0), "Invalid retailer address");
        
        batch.retailer = _retailer;
        batch.status = "Transferred to Retailer";
        batch.updatedAt = block.timestamp;
        
        emit BatchTransferred(_batchId, batch.distributor, _retailer, "Retailer");
    }

    // Function to transfer batch to consumer
    function transferToConsumer(
        string memory _batchId,
        address _consumer
    ) external requireBatchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(msg.sender == batch.retailer, "Only retailer can transfer to consumer");
        require(_consumer != address(0), "Invalid consumer address");
        
        batch.consumer = _consumer;
        batch.status = "Sold to Consumer";
        batch.updatedAt = block.timestamp;
        
        emit BatchTransferred(_batchId, batch.retailer, _consumer, "Consumer");
    }

    // Function to get batch information
    function getBatchInfo(string memory _batchId) 
        external 
        view 
        requireBatchExists(_batchId) 
        returns (
            string memory,
            uint256,
            address,
            address,
            address,
            address,
            uint256,
            uint256,
            string memory
        ) {
        Batch memory batch = batches[_batchId];
        return (
            batch.product,
            batch.quantity,
            batch.farmer,
            batch.distributor,
            batch.retailer,
            batch.consumer,
            batch.createdAt,
            batch.updatedAt,
            batch.status
        );
    }

    // Function to get all batch IDs
    function getAllBatchIds() external view returns (string[] memory) {
        return batchIds;
    }

    // Function to get total number of batches
    function getBatchCount() external view returns (uint256) {
        return batchIds.length;
    }

    // Function to check if a batch exists
    function batchExists(string memory _batchId) external view returns (bool) {
        return batches[_batchId].exists;
    }
}
`;

function compileContract() {
  const input = {
    language: 'Solidity',
    sources: {
      'SupplyChain.sol': { content: SUPPLY_CHAIN_SOURCE },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length) {
      errors.forEach(e => console.error(e.formattedMessage));
      throw new Error('Solidity compilation failed');
    }
  }

  const contract = output.contracts['SupplyChain.sol']['SupplyChain'];
  const abi = contract.abi;
  const bytecode = '0x' + contract.evm.bytecode.object;
  return { abi, bytecode };
}

async function deployContract() {
  try {
    console.log('🚀 Starting Supply Chain contract deployment...');

    // Connect to Ganache
    const provider = new ethers.JsonRpcProvider('http://10.251.27.171:7545');

    // Use farmer wallet for deployment
    const deployerWallet = new ethers.Wallet(
      '0x335f7c47267679961e1ccae8e2e680a59bb2782e620f28e2d163794326bbeb51',
      provider
    );

    console.log('📡 Connected to Ganache at:', 'http://10.251.27.171:7545');
    console.log('👤 Deployer address:', deployerWallet.address);

    const balance = await provider.getBalance(deployerWallet.address);
    console.log('💰 Deployer balance:', ethers.formatEther(balance), 'ETH');

    console.log('⚙️  Compiling contract...');
    const { abi, bytecode } = compileContract();

    const factory = new ethers.ContractFactory(abi, bytecode, deployerWallet);

    console.log('📦 Deploying contract...');
    const contract = await factory.deploy();

    console.log('⏳ Waiting for deployment confirmation...');
    const receipt = await contract.deploymentTransaction().wait();

    const contractAddress = await contract.getAddress();
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract Address:', contractAddress);
    console.log('🔗 Transaction Hash:', receipt.hash);

    // Quick test call
    console.log('🧪 Testing contract...');
    const testBatchId = 'test-batch-' + Date.now();
    const tx = await contract.createBatch(testBatchId, 'Test Product', 100);
    await tx.wait();
    console.log('✅ Test batch created successfully!');

    return contractAddress;

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

if (require.main === module) {
  deployContract()
    .then(address => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('📋 Next steps:');
      console.log('1. Update SUPPLY_CHAIN_ADDRESS in src/utils/blockchain.js');
      console.log('2. Replace the mock address with:', address);
      console.log('3. Test the app with real blockchain transactions');
    })
    .catch(err => process.exit(1));
}

module.exports = { deployContract };
