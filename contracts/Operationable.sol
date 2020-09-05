pragma solidity ^0.5.2;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Operationable is Ownable {
    bool private operational = true;

    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;
    }

    function isOperational()
        public
        view
        returns(bool)
    {
        return operational;
    }

    function setOperatingStatus(bool mode)
        public
        onlyOwner
    {
        require(mode != operational, "New mode must be different from existing mode");
        operational = mode;
    }
}
