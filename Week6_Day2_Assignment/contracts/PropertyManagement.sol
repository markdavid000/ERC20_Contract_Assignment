// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

error NOT_PROPERTY_OWNER();
error PROPERTY_DOES_NOT_EXIST();

contract PropertyManagement {

    IERC20 paymentToken;

    constructor(address _token) {
        require(_token != address(0), "INVALID TOKEN ADDRESS");

        paymentToken = IERC20(_token);
    }

    struct Property {
        uint256 id;
        address owner;
        string name;
        string location;
        string description;
        uint256 price;
        bool isForSale;
        bool exists;
    }

    uint256 propertyIdCounter;
    mapping(uint256 => Property) properties;
    uint256[] allPropertyIds;

    event PropertyCreated(
        uint256 indexed id,
        address indexed creator,
        string name,
        uint256 price
    );

    event PropertyRemoved(uint256 indexed id, address indexed owner);

    event PropertyPurchased(
        uint256 indexed id,
        address indexed buyer,
        uint256 price
    );

    modifier propertyExists(uint256 _id) {
        if(!properties[_id].exists) {
            revert PROPERTY_DOES_NOT_EXIST();
        }
        _;
    }

    modifier onlyCreator(uint256 _id) {
        if(properties[_id].owner != msg.sender) {
            revert NOT_PROPERTY_OWNER();
        }
        _;
    }

    function createProperty(
        string memory _name,
        string memory _location,
        string memory _description,
        uint256 _price,
        bool _isForSale
    ) external {

        propertyIdCounter++;

        properties[propertyIdCounter] = Property({
            id: propertyIdCounter,
            owner: msg.sender,
            name: _name,
            location: _location,
            description: _description,
            price: _price,
            isForSale: _isForSale,
            exists: true
        });

        allPropertyIds.push(propertyIdCounter);

        emit PropertyCreated(propertyIdCounter, msg.sender, _name, _price);
    }

    function removeProperty(uint256 _id)
        external
        propertyExists(_id)
        onlyCreator(_id)
    {
        delete properties[_id];

        uint256 length = allPropertyIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (allPropertyIds[i] == _id) {
                allPropertyIds[i] = allPropertyIds[length - 1];
                allPropertyIds.pop();
                break;
            }
        }

        emit PropertyRemoved(_id, msg.sender);
    }

    function buyProperty(uint256 _id) external propertyExists(_id) {
        Property storage prop = properties[_id];

        require(prop.isForSale, "PROPERTY NOT FOR SALE");
        require(prop.price > 0, "INVALID PRICE");
        require(msg.sender != prop.owner, "CANNOT BUY YOUR OWN PROPERTY");

        require(
            paymentToken.transferFrom(msg.sender, prop.owner, prop.price),
            "TOKEN TRANSFER FAILED"
        );

        prop.owner = msg.sender;
        prop.isForSale = false;

        emit PropertyPurchased(_id, msg.sender, prop.price);
    }

    function getAllProperties() external view returns (Property[] memory) {
        uint256 count = allPropertyIds.length;
        Property[] memory result = new Property[](count);

        for (uint256 i = 0; i < count; i++) {
            result[i] = properties[allPropertyIds[i]];
        }
        return result;
    }
}