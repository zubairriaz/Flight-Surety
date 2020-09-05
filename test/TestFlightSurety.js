const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');
const truffleAssert = require('truffle-assertions');
const MockOracle = require('../utils/mockOracle');

contract('FlightSurety', (accounts) => {
    let appContract;
    let dataContract;

    const [
        airline1,
        airline2,
        airline3,
        airline4,
        airline5,
        passenger1,
        passenger2,
    ] = accounts;

    const testFlight = {
        flightNumber: 'TEST123',
        timestamp: Date.parse('01 Jan 2019 09:00:00 GMT'),
    };

    beforeEach(async () => {
        appContract = await FlightSuretyApp.deployed();
    });

    describe('Airline spec', () => {
        beforeEach(async () => {
            dataContract = await FlightSuretyData.deployed();
        });

        it('registers first airline when deployed', async () => {
            const registeredCount = await dataContract.registeredAirlinesCount.call();
            assert.equal(registeredCount.toNumber(), 1);
        });

        it('allows registered airlines to register a new airline until 4 airlines registered', async () => {
            let tx;
            // register airline2
            tx = await appContract.registerAirline(airline2, { from: airline1 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline2);

            // the request from not registered airline fails
            try {
                await appContract.registerAirline(airline3, { from: airline5 });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not Registered airline/);
            }

            // register airline3
            tx = await appContract.registerAirline(airline3, { from: airline2 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline3);

            // register airline4
            tx = await appContract.registerAirline(airline4, { from: airline3 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline4);

            // now 4 airlines are registered
            const registeredCount = await dataContract.registeredAirlinesCount.call();
            assert.equal(registeredCount.toNumber(), 4);
        });

        it('requires multi-party consensus of registered airlines to register 5th and subsequent airlines', async () => {
            let tx;
            let registeredCount;
            tx = await appContract.registerAirline(airline5, { from: airline1 });
            // AirlineRegistered event is NOT emitted.
            truffleAssert.eventNotEmitted(tx, 'AirlineRegistered', event => event.account === airline5);

            // instead, AirlineVoted event is emitted.
            truffleAssert.eventEmitted(tx, 'AirlineVoted', event => (
                event.account === airline5 && event.votedCount.toNumber() === 1
            ));

            // registered airline count is not changed.
            registeredCount = await dataContract.registeredAirlinesCount.call();
            assert.equal(registeredCount.toNumber(), 4);

            // another registered airline registers the new airline.
            tx = await appContract.registerAirline(airline5, { from: airline2 });

            truffleAssert.eventEmitted(tx, 'AirlineVoted', event => (
                event.account === airline5 && event.votedCount.toNumber() === 2
            ));

            // now 50% of registered ailines approve the registration
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline5);

            // registered airline count is incremented.
            registeredCount = await dataContract.registeredAirlinesCount.call();
            assert.equal(registeredCount.toNumber(), 5);
        });

        it('requires 10 ether funding for registered airlines to participate in contract', async () => {
            let fundedEnough;

            fundedEnough = await appContract.fundedEnough.call(airline1);
            assert.equal(fundedEnough, false);

            const amount = web3.utils.toWei('10', 'ether');
            const tx = await appContract.fundAirline({ from: airline1, value: amount });
            truffleAssert.eventEmitted(tx, 'AirlineFunded', (event) => {
                const deposit = web3.utils.fromWei(event.deposit.toString(), 'ether');
                return event.account === airline1 && deposit === '10';
            });

            fundedEnough = await appContract.fundedEnough.call(airline1);
            assert.equal(fundedEnough, true);
        });
    });

    describe('Passenger spec', () => {
        const premium = web3.utils.toWei('1', 'ether');
        const payout = web3.utils.toWei('1.5', 'ether');

        let oracles;

        before(async () => {
            // register flight
            const { flightNumber, timestamp } = testFlight;
            await appContract.registerFlight(flightNumber, timestamp, { from: airline1 });

            // instantiate mock oracles
            oracles = accounts.slice(10, 30).map(account => new MockOracle(account));

            // register and get indexes
            const registrationFee = web3.utils.toWei('1', 'ether');
            await Promise.all(oracles.map(oracle => (
                appContract.registerOracle({ from: oracle.address, value: registrationFee })
                    .then(() => appContract.getOracleIndexes({ from: oracle.address }))
                    .then((indexes) => {
                        oracle.setIndexes(indexes);
                    })
            )));
        });

        it('allows passengers to pay up to 1 ether for purchasing flight insurance', async () => {
            // a passenger can pay 1 ether
            const { flightNumber, timestamp } = testFlight;
            const tx = await appContract.buyInsurance(flightNumber, timestamp, {
                from: passenger1,
                value: premium,
            });
            truffleAssert.eventEmitted(tx, 'BuyInsurance', event => (
                event.account === passenger1
                && event.flight === flightNumber
                && event.timestamp.toNumber() === timestamp
                && event.amount.toString() === premium
            ));

            // a passernger cannot pay more than 1 ether
            try {
                await appContract.buyInsurance(flightNumber, timestamp, {
                    from: passenger2,
                    value: web3.utils.toWei('2', 'ether'),
                });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Up to 1 ether for purchasing flight insurance/);
            }
        });

        it('allows passengers to withdrawal 1.5X the amount of they paid when the flight delays', async () => {
            // request to fetch flight status
            let requestIndex;
            const { flightNumber, timestamp } = testFlight;

            const tx = await appContract.fetchFlightStatus(
                flightNumber,
                timestamp,
                { from: passenger1 },
            );
            truffleAssert.eventEmitted(tx, 'OracleRequest', (event) => {
                requestIndex = event.index.toNumber();
                return (
                    event.flight === flightNumber
                    && event.timestamp.toNumber() === timestamp
                );
            });

            // valid oracles submit flight status, Late Airline
            const statusCode = 20; // Late Airline
            const oraclesAllowToSubmit = oracles.filter(oracle => oracle.hasIndex(requestIndex));

            if (oraclesAllowToSubmit.length < 3) {
                // eslint-disable-next-line no-console
                console.log('Cannot update flight status. please run test again.');
                return;
            }

            await Promise.all(oraclesAllowToSubmit.slice(0, 3).map(oracle => (
                appContract.submitOracleResponse(
                    requestIndex,
                    flightNumber,
                    timestamp,
                    statusCode,
                    { from: oracle.address },
                )
            )));

            // a passenger withdrawals payout
            const balanceBefore = await web3.eth.getBalance(passenger1);

            await appContract.withdrawalRefund(
                flightNumber,
                timestamp,
                { from: passenger1, gasPrice: 0 },
            );

            const balanceAfter = await web3.eth.getBalance(passenger1);

            assert.equal(
                Number(balanceAfter) - Number(balanceBefore),
                Number(payout),
            );
        });
    });
});
