const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('FlightSuretyData', () => {
    it('registers first airline when deployed', async () => {
        const instance = await FlightSuretyData.deployed();
        const registeredCount = await instance.registeredAirlinesCount.call();
        assert.equal(registeredCount.toNumber(), 1);
    });
});
