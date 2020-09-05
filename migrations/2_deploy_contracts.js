const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(FlightSuretyData);
    await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

    // authorize FlightSuretyApp contract
    const instance = await FlightSuretyData.deployed();
    await instance.authorizeContract(FlightSuretyApp.address, { from: accounts[0] });
};
