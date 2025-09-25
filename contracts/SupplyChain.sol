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
        // Per-role balances to maintain accurate quantity flow
        uint256 farmerQty;
        uint256 distributorQty;
        uint256 retailerQty;
        uint256 consumerQty;
    }

    // Mapping from batch ID to batch information
    mapping(string => Batch) public batches;
    
    // Array to store all batch IDs for enumeration
    string[] public batchIds;
    
    // Events
    event BatchCreated(string indexed batchId, string product, uint256 quantity, address farmer);
    event BatchUpdated(string indexed batchId, string status, address updatedBy);
    // Include quantity moved so off-chain consumers can reconcile balances
    event BatchTransferred(string indexed batchId, address from, address to, string role, uint256 quantity);

    // Modifier to check if batch exists
    modifier batchExists(string memory _batchId) {
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
            exists: true,
            farmerQty: _quantity,
            distributorQty: 0,
            retailerQty: 0,
            consumerQty: 0
        });
        
        batchIds.push(_batchId);
        
        emit BatchCreated(_batchId, _product, _quantity, msg.sender);
    }

    // Function to update batch status (any authorized party can call this)
    function updateBatchStatus(
        string memory _batchId,
        string memory _status
    ) external batchExists(_batchId) {
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
        address _distributor,
        uint256 _quantityMoved
    ) external batchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(msg.sender == batch.farmer, "Only farmer can transfer to distributor");
        require(_distributor != address(0), "Invalid distributor address");
        require(_quantityMoved > 0, "Quantity must be > 0");
        require(batch.farmerQty >= _quantityMoved, "Insufficient farmer quantity");
        
        batch.distributor = _distributor;
        batch.farmerQty -= _quantityMoved;
        batch.distributorQty += _quantityMoved;
        batch.status = "Transferred to Distributor";
        batch.updatedAt = block.timestamp;
        
        emit BatchTransferred(_batchId, batch.farmer, _distributor, "Distributor", _quantityMoved);
    }

    // Function to transfer batch to retailer
    function transferToRetailer(
        string memory _batchId,
        address _retailer,
        uint256 _quantityMoved
    ) external batchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(msg.sender == batch.distributor, "Only distributor can transfer to retailer");
        require(_retailer != address(0), "Invalid retailer address");
        require(_quantityMoved > 0, "Quantity must be > 0");
        require(batch.distributorQty >= _quantityMoved, "Insufficient distributor quantity");
        
        batch.retailer = _retailer;
        batch.distributorQty -= _quantityMoved;
        batch.retailerQty += _quantityMoved;
        batch.status = "Transferred to Retailer";
        batch.updatedAt = block.timestamp;
        
        emit BatchTransferred(_batchId, batch.distributor, _retailer, "Retailer", _quantityMoved);
    }

    // Function to transfer batch to consumer
    function transferToConsumer(
        string memory _batchId,
        address _consumer,
        uint256 _quantityMoved
    ) external batchExists(_batchId) {
        Batch storage batch = batches[_batchId];
        require(msg.sender == batch.retailer, "Only retailer can transfer to consumer");
        require(_consumer != address(0), "Invalid consumer address");
        require(_quantityMoved > 0, "Quantity must be > 0");
        require(batch.retailerQty >= _quantityMoved, "Insufficient retailer quantity");
        
        batch.consumer = _consumer;
        batch.retailerQty -= _quantityMoved;
        batch.consumerQty += _quantityMoved;
        batch.status = "Sold to Consumer";
        batch.updatedAt = block.timestamp;
        
        emit BatchTransferred(_batchId, batch.retailer, _consumer, "Consumer", _quantityMoved);
    }

    // Function to get batch information
    function getBatchInfo(string memory _batchId) 
        external 
        view 
        batchExists(_batchId) 
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

    // Expose per-role balances so the UI can reconcile flows
    function getBatchBalances(string memory _batchId) external view batchExists(_batchId) returns (uint256, uint256, uint256, uint256) {
        Batch memory batch = batches[_batchId];
        return (batch.farmerQty, batch.distributorQty, batch.retailerQty, batch.consumerQty);
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
