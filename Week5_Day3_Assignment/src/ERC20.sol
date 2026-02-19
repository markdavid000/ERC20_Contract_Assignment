// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract ERC20 {
    address public owner;
    string public tokenName;
    string public tokenSymbol;
    uint8 public tokenDecimal;
    uint256 public tokenTotalSupply;

    mapping(address => uint256) public balance;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(
        string memory _name, 
        string memory _symbol, 
        uint8 _decimal,
        uint256 _initialSupply
    ) {
        owner = msg.sender;
        tokenName = _name;
        tokenSymbol = _symbol;
        tokenDecimal = _decimal;
        tokenTotalSupply = _initialSupply * 10**_decimal;
        balance[msg.sender] = tokenTotalSupply;

        emit Transfer(address(0), msg.sender, tokenTotalSupply);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You're not meant to call this function");
        _;
    }

    function name() public view returns (string memory) {
        return tokenName;
    }

    function symbol() public view returns (string memory) {
        return tokenSymbol;
    }

    function decimals() public view returns (uint8) {
        return tokenDecimal;
    }

    function totalSupply() public view returns (uint256) {
        return tokenTotalSupply;
    }

    function balanceOf(address _account) public view returns (uint256) {
        return balance[_account];
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
        return _allowances[_owner][_spender];
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Can't transfer to zero address");
        require(balance[msg.sender] >= _value, "Insufficient balance");
        
        balance[msg.sender] -= _value;
        balance[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "Can't approve zero address");
        
        _allowances[msg.sender][_spender] = _value;
        
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool) {
        require(_to != address(0), "Can't transfer to zero address");
        require(balance[_from] >= _value, "Insufficient balance");
        require(_allowances[_from][msg.sender] >= _value, "Insufficient allowance");
        
        balance[_from] -= _value;
        balance[_to] += _value;
        _allowances[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }

    function mint(address _to, uint256 _value) public onlyOwner {
        require(_to != address(0), "Can't mint to zero address");
        
        tokenTotalSupply += _value;
        balance[_to] += _value;
        
        emit Transfer(address(0), _to, _value);
    }

    function burn(uint256 _value) public {
        require(balance[msg.sender] >= _value, "Insufficient balance to burn");
        
        tokenTotalSupply -= _value;
        balance[msg.sender] -= _value;
        
        emit Transfer(msg.sender, address(0), _value);
    }
}