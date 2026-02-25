// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC20.sol";

contract SaveERC20_Ether {
    address public savingToken;
    address public owner;

    mapping(address => uint256) public ERC20savings;
    mapping(address => uint256) public Ethersavings;

    event SavingSuccessful(address indexed sender, uint256 amount);
    event WithdrawSuccessful(address indexed receiver, uint256 amount);

    constructor(address _savingToken) {
        savingToken = _savingToken;
        owner = msg.sender;
    }

    function depositERC20(uint256 _amount) external {
        require(msg.sender != address(0), "address zero detected");
        require(_amount > 0, "can't save zero value");

        require(
            IERC20(savingToken).transferFrom(msg.sender, address(this), _amount), 
            "failed to transfer"
        );

        ERC20savings[msg.sender] += _amount;

        emit SavingSuccessful(msg.sender, _amount);
    }

    function withdrawERC20(uint256 _amount) external {
        require(msg.sender != address(0), "address zero detected");
        require(_amount > 0, "can't withdraw zero value");

        uint256 _userSaving = ERC20savings[msg.sender];
        require(_userSaving >= _amount, "insufficient funds");

        ERC20savings[msg.sender] -= _amount;

        require(
            IERC20(savingToken).transfer(msg.sender, _amount), 
            "failed to withdraw"
        );

        emit WithdrawSuccessful(msg.sender, _amount);
    }

    function checkERC20Balance(address _user) external view returns (uint256) {
        return ERC20savings[_user];
    }

    function checkContractBalance() external view returns(uint256) {
        return IERC20(savingToken).balanceOf(address(this));
    }

    function depositEther() external payable {
        require(msg.sender != address(0), "Address zero detected");
        require(msg.value > 0, "Can't deposit zero value");

        Ethersavings[msg.sender] += msg.value;

        emit SavingSuccessful(msg.sender, msg.value);
    }

    function withdrawEther(uint256 _amount) external {
        require(msg.sender != address(0), "Address zero detected");
        require(_amount > 0, "Can't withdraw zero value");
        require(Ethersavings[msg.sender] >= _amount, "Insufficient funds");
        
        Ethersavings[msg.sender] -= _amount;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Ether transfer failed");
        
        emit WithdrawSuccessful(msg.sender, _amount);
    }

    function checkEtherBalance() external view returns (uint256) {
        return Ethersavings[msg.sender];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}