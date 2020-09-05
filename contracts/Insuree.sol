pragma solidity ^0.5.2;

contract Insuree {
    mapping(bytes32 => uint) private insurances;

    function register(bytes32 key, uint amount) internal {
        // prevent from buying same insurance twice
        require(insurances[key] == 0, "Already bought this insurance");
        insurances[key] = amount;
    }

    function refund(bytes32 key) internal returns(uint) {
        require(insurances[key] > 0, "No amount to payout");

        uint amount = insurances[key];
        delete insurances[key];

        return amount;
    }
}
