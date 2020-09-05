pragma solidity ^0.5.2;

contract OracleManager {

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Track all oracle responses
    mapping (bytes32 => ResponseInfo) private oracleResponses;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;
        bool isOpen;
        mapping (uint8 => address[]) responses;
    }

    event OracleRegistered(address indexed account, uint8[3] indexes);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier isRegisteredOracle() {
        require(oracles[msg.sender].isRegistered, "Not registered oracle");
        _;
    }

    modifier isValidOracleIndex(uint8 index) {
        require(
            (oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );
        _;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    // Register an oracle with the contract
    function registerOracle() public payable {
        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
            isRegistered: true,
            indexes: indexes
        });

        emit OracleRegistered(msg.sender, indexes);
    }

    function getOracleIndexes() external view returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }

    function registerRequest(bytes32 key, address requester) internal {
        oracleResponses[key] = ResponseInfo({
            requester: requester,
            isOpen: true
        });
    }

    function isRequestOpen(bytes32 key) internal view returns(bool) {
        return oracleResponses[key].isOpen;
    }

    function pushResponse(bytes32 key, uint8 statusCode, address account) internal {
        address[] memory addresses = oracleResponses[key].responses[statusCode];

        bool isDuplicate = false;
        for(uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == account) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "Already registered this response");

        oracleResponses[key].responses[statusCode].push(account);
    }

    function getResponseCount(bytes32 key, uint8 statusCode) internal view returns(uint) {
        return oracleResponses[key].responses[statusCode].length;
    }

    function closeRequest(bytes32 key) internal {
        oracleResponses[key].isOpen = false;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }
}
