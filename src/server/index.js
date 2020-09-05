const express = require('express');
const Web3 = require('web3');
const FlightSuretyApp = require('../contracts/FlightSuretyApp.json');
const Oracle = require('./Oracle');

const app = express();

const provider = new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
const web3 = new Web3(provider);

let accounts;
let contract;
const oracles = [];

const init = async () => {
    accounts = await web3.eth.getAccounts();

    const networkId = await web3.eth.net.getId();
    const deployedNetwork = FlightSuretyApp.networks[networkId];

    contract = new web3.eth.Contract(
        FlightSuretyApp.abi,
        deployedNetwork && deployedNetwork.address,
    );

    const statusCode = process.env.STATUS_CODE;
    const registrationFee = web3.utils.toWei('1', 'ether');

    // register 20 oracles
    accounts.slice(10, 30).forEach((account) => {
        const oracle = new Oracle(account, statusCode);
        oracle.startListening(contract, registrationFee);
        oracles.push(oracle);
    });
};

init();

app.get('/', (req, res) => {
    const oracleListening = oracles.filter(oracle => oracle.isListening);
    res.send(`Now, ${oracles.length} oracles is instantiating, and ${oracleListening.length} oracles is running.`);
});

app.listen(8080, () => {
    // eslint-disable-next-line no-console
    console.log('Oracle server is running on port 8080');
});
