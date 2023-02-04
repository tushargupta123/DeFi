pragma solidity ^0.5.0;

import "./DaiToken.sol";
import "./DappToken.sol";

contract TokenFarm{

    string public name = "Dapp Token Farm";
    DappToken public dappToken;
    DaiToken public daiToken; 
    address public owner;

    address[] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(DappToken _dappToken,DaiToken _daiToken) public{
        dappToken = _dappToken;
        daiToken = _daiToken; 
        owner = msg.sender;
    }

    // stake token (deposit)
    function stakeTokens(uint _amount) public{
        require(_amount>0, "amount cannot be 0");

        // transfer mock dai tokens to this contract for staking
        daiToken.transferFrom(msg.sender,address(this),_amount);

        // update staking balance
        stakingBalance[msg.sender] += _amount;

        // add user to stakers array only if they haven't staked already
        if(!hasStaked[msg.sender]){
            stakers.push(msg.sender);
        }

        hasStaked[msg.sender] = true;
        isStaking[msg.sender] = true;
    }

    // issuing tokens
    function issueTokens() public {
        require(msg.sender == owner, "caller must be owner");

        // we will issue same amount of dapp token to investors
        for (uint i=0; i<stakers.length;i++){
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if(balance > 0){
            dappToken.transfer(recipient,balance);
            }
        }
    }

    // unstaking tokens (withdraw)
    function unstakeTokens() public{
        // fetch staking balance
        uint balance = stakingBalance[msg.sender];
        
        require(balance > 0, "staking balace must be greater than 0");
        daiToken.transfer(msg.sender,balance);
        stakingBalance[msg.sender] = 0;
        isStaking[msg.sender] = false;
    }
}

