// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


/// @notice This contract is for a supply chain dapp for tracking products
/// @dev Uses OpenZeppelin's EnumerableMap for efficient key values.
contract SupplyChain {
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    
    using Strings for string;

    struct Product {
        uint256 id;
        string name;
        string origin;
        string[] actions;
        address[] actors;
        uint256[] timestamps;
    }

    mapping(uint256 => Product) public products;
    uint256 public productCount;
    
    EnumerableMap.UintToAddressMap private productOwnership;

    event ProductAdded(uint256 id, string name, string origin, address owner);
    event OwnershipTransferred(uint256 id, address previousOwner, address newOwner);
    
    /// @notice Adds a new product to the supply chain
    /// @dev Increments productCount and sets up initial product data
	/// @return The ID of the newly added product
    function addProduct(string memory name, string memory origin) public returns (uint256) {
        productCount++;
        
        products[productCount] = Product({
            id: productCount,
            name: name,
            origin: origin,
            actions: new string[](0),
            actors: new address[](0),
            timestamps: new uint256[](0)
        });
        
        products[productCount].actions.push("Product Created");
        products[productCount].actors.push(msg.sender);
        products[productCount].timestamps.push(block.timestamp);
        productOwnership.set(productCount, msg.sender);
        emit ProductAdded(productCount, name, origin, msg.sender);
        return productCount;
    }

	/// @notice Transfers ownership of a product to a new address
	/// @dev Only the current owner can transfer ownership
    function transferOwnership(uint256 productId, address newOwner) public {
        require(productId > 0 && productId <= productCount, "Wrong product ID");
        (bool exists, address currentOwner) = productOwnership.tryGet(productId);
        require(exists && currentOwner == msg.sender, "You are not the owner");
        require(newOwner != address(0), "Invalid new owner address");

        productOwnership.set(productId, newOwner);
        products[productId].actions.push("Ownership Transferred");
        products[productId].actors.push(newOwner);
        products[productId].timestamps.push(block.timestamp);

        emit OwnershipTransferred(productId, msg.sender, newOwner);
    }

    /// @notice Retrieves product information
    /// @dev Returns product details including current owner
    /// @return id The product id
    /// @return Name of the product
    /// @return The product origin
    /// @return The current owner's address
    function getProduct(uint256 productId) public view returns (uint256, string memory, string memory, address) {
        require(productId > 0 && productId <= productCount, "Wrong product ID");
        Product storage product = products[productId];
        (bool exists, address owner) = productOwnership.tryGet(productId);
        require(exists, "Product ownership not found");
        return (product.id, product.name, product.origin, owner);
    }

    /// @notice Retrieves the movement history of a product
    /// @dev Returns actions, actors, and timestamps as separate arrays
    /// @return A string of action descriptions
    /// @return An array of addresses that performed actions
    /// @return An array of timestamps for each action
    function getMovements(uint256 productId) public view returns (string memory, address[] memory, uint256[] memory) {
        require(productId > 0 && productId <= productCount, "Wrong product ID");
        return (joinStrings(products[productId].actions), products[productId].actors, products[productId].timestamps);
    }

	/// @notice Joins an array of strings into a single string
    /// @return result A single string with all elements
	function joinStrings(string[] memory arr) public pure returns (string memory result) {
    	if (arr.length == 0) {
        	return "";
    	}
    	
    	result = arr[0];
    	for (uint i = 1; i < arr.length; i++) {
        	result = string(abi.encodePacked(result, "; ", arr[i]));
    	}
	}
    	
    /// @notice Retrieves all product ids owned by a specific address
    /// @dev Iterates through all products to find those owned by the given address
    /// @return An array of product ids owned by the given address
    function getProductsOwnedBy(address ownerAddress) public view returns (uint256[] memory) {
        uint256 ownedCount = 0;
        uint256 totalProducts = productOwnership.length();
        
        for (uint256 i = 0; i < totalProducts; i++) {
            (, address currentOwner) = productOwnership.at(i);
            if (currentOwner == ownerAddress) {
                ownedCount++;
            }
        }
        
        uint256[] memory ownedProducts = new uint256[](ownedCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < totalProducts; i++) {
            (uint256 productId, address currentOwner) = productOwnership.at(i);
            if (currentOwner == ownerAddress) {
                ownedProducts[currentIndex] = productId;
                currentIndex++;
            }
        }
        
        return ownedProducts;
    }
}
