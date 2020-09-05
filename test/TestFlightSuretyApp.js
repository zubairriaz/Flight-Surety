const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const truffleAssert = require('truffle-assertions');
const MockOracle = require('../utils/mockOracle');

contract('FlightSuretyApp', (accounts) => {
    let instance;
    let requestIndex;
    let canPayout = false;

    const [
        airline1,
        airline2,
        airline3,
        airline4,
        airline5,
        notRegistered1,
        notRegistered2,
        passenger1,
        passenger2,
    ] = accounts;

    const owner = airline1;

    const premium = web3.utils.toWei('1', 'ether');
    const payout = web3.utils.toWei('1.5', 'ether');

    const oracles = accounts.slice(10, 30).map(account => new MockOracle(account));

    const testFlight = {
        flightNumber: 'TEST123',
        timestamp: Date.parse('01 Jan 2009 09:00:00 GMT'),
    };

    beforeEach(async () => {
        instance = await FlightSuretyApp.deployed();
    });

    describe('registerAirline function', () => {
        it('registers a new airline', async () => {
            const tx = await instance.registerAirline(airline2, { from: airline1 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline2);
        });

        it('registers up to 4th airlines without cousensus', async () => {
            let tx;
            tx = await instance.registerAirline(airline3, { from: airline1 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline3);

            tx = await instance.registerAirline(airline4, { from: airline1 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline4);
        });

        it('does not register 5th and subsequent airlines without consensus', async () => {
            const tx = await instance.registerAirline(airline5, { from: airline1 });
            // AirlineRegistered event is NOT emitted.
            truffleAssert.eventNotEmitted(tx, 'AirlineRegistered', event => event.account === airline5);

            // Instead, AirlineVoted event is emitted.
            truffleAssert.eventEmitted(tx, 'AirlineVoted', event => (
                event.account === airline5 && event.votedCount.toNumber() === 1
            ));
        });

        it('registers 5th and subsequent airlines when voted by 50% of registered airlines', async () => {
            // airline5 is voted by airline1 and airline2
            const tx = await instance.registerAirline(airline5, { from: airline2 });
            truffleAssert.eventEmitted(tx, 'AirlineRegistered', event => event.account === airline5);
        });


        it('refuses a request from not registered airline', async () => {
            try {
                await instance.registerAirline(notRegistered2, { from: notRegistered1 });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not Registered airline/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.registerAirline(notRegistered1, { from: airline1 });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('fundAirline function', () => {
        const amount = web3.utils.toWei('10', 'ether');

        it('accepts ether', async () => {
            const tx = await instance.fundAirline({ from: airline1, value: amount });
            truffleAssert.eventEmitted(tx, 'AirlineFunded', event => (
                event.account === airline1 && event.deposit.toString() === amount
            ));
        });

        it('refuses a request from not registered airline', async () => {
            try {
                await instance.fundAirline({ from: notRegistered1, value: amount });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not Registered airline/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.fundAirline({ from: airline2, value: amount });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('fundedEnough function', () => {
        it('returns true if the account has funded more than 10 ether', async () => {
            const result = await instance.fundedEnough.call(airline1);
            assert.equal(result, true);
        });

        it('returns false if the account has funded less than 10 ether', async () => {
            const result = await instance.fundedEnough.call(airline2);
            assert.equal(result, false);
        });
    });

    describe('registerFlight function', () => {
        it('registers a new flight', async () => {
            const { flightNumber, timestamp } = testFlight;

            const tx = await instance.registerFlight(flightNumber, timestamp, { from: airline1 });
            truffleAssert.eventEmitted(tx, 'FlightRegistered', event => (
                event.airline === airline1
                && event.flight === flightNumber
                && event.timestamp.toNumber() === timestamp
            ));
        });

        it('refuses a request from not registered airline', async () => {
            const flightNumber = 'TEST999';
            const timestamp = Date.now();

            try {
                await instance.registerFlight(flightNumber, timestamp, { from: notRegistered1 });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not Registered airline/);
            }
        });

        it('refuses a request from a airline funded less than 10 ether', async () => {
            const flightNumber = 'TEST999';
            const timestamp = Date.now();

            try {
                await instance.registerFlight(flightNumber, timestamp, { from: airline2 });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Deposit is inadequet/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            const flightNumber = 'TEST999';
            const timestamp = Date.now();

            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.registerFlight(flightNumber, timestamp, { from: airline1 });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('buyInsurance function', () => {
        it('allows passengers to purchase insurance', async () => {
            const { flightNumber, timestamp } = testFlight;

            const tx = await instance.buyInsurance(flightNumber, timestamp, {
                from: passenger1,
                value: premium,
            });

            truffleAssert.eventEmitted(tx, 'BuyInsurance', event => (
                event.account === passenger1
                && event.flight === flightNumber
                && event.timestamp.toNumber() === timestamp
                && event.amount.toString() === premium
            ));
        });

        it('refuses a request to pay more than 1 ether', async () => {
            const { flightNumber, timestamp } = testFlight;

            try {
                await instance.buyInsurance(flightNumber, timestamp, {
                    from: passenger2,
                    value: web3.utils.toWei('2', 'ether'),
                });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Up to 1 ether for purchasing flight insurance/);
            }
        });

        it('refuses a request to purchase the insurance of flight before registration', async () => {
            const flightNumber = 'TEST999';
            const timestamp = Date.now();

            try {
                await instance.buyInsurance(flightNumber, timestamp, {
                    from: passenger2,
                    value: premium,
                });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Flight is not registered/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            const { flightNumber, timestamp } = testFlight;

            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.buyInsurance(flightNumber, timestamp, {
                    from: passenger2,
                    value: premium,
                });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('fetchFlightStatus function', () => {
        it('emits OracleRequest event', async () => {
            const { flightNumber, timestamp } = testFlight;
            const tx = await instance.fetchFlightStatus(
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
        });

        it('refuses any requests when the contract is not operational', async () => {
            const { flightNumber, timestamp } = testFlight;

            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.fetchFlightStatus(
                    flightNumber,
                    timestamp,
                    { from: passenger1 },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('registerOracle function', async () => {
        const fee = web3.utils.toWei('1', 'ether');

        it('registers a oracle', async () => {
            const tx = await instance.registerOracle({
                from: oracles[0].address,
                value: fee,
            });
            truffleAssert.eventEmitted(tx, 'OracleRegistered', event => (
                event.account === oracles[0].address
            ));
        });

        it('refuses a request without adequet fee', async () => {
            try {
                await instance.registerOracle({
                    from: oracles[1].address,
                    value: web3.utils.toWei('.5', 'ether'),
                });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Inadequet registration fee/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.registerOracle({
                    from: oracles[1].address,
                    value: fee,
                });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('getOracleIndexes function', () => {
        it('returns indexes of registered oracle', async () => {
            const oracle = oracles[0];
            const indexes = await instance.getOracleIndexes.call({ from: oracle.address });
            oracle.setIndexes(indexes);

            assert.equal(oracle.indexes.length, 3);
            oracle.indexes.forEach((index) => {
                assert.isNumber(index);
                assert.isAtLeast(index, 0);
                assert.isAtMost(index, 9);
            });
        });

        it('refuses a request from not registered oracle', async () => {
            const oracle = oracles[1];
            try {
                await instance.getOracleIndexes.call({ from: oracle.address });
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not registered as an oracle/);
            }
        });
    });

    describe('submitOracleResponse function', () => {
        let validOracles;
        let invalidOracles;

        const { flightNumber, timestamp } = testFlight;
        const statusCode = 20; // Airline Late

        before(async () => {
            // register all rest oracles
            const fee = web3.utils.toWei('1', 'ether');
            const register = oracle => (
                instance.registerOracle({ from: oracle.address, value: fee })
                    .then(() => instance.getOracleIndexes.call({ from: oracle.address }))
                    .then((indexes) => {
                        oracle.setIndexes(indexes);
                    })
            );
            await Promise.all(oracles.slice(1).map(register));

            validOracles = oracles.filter(oracle => oracle.hasIndex(requestIndex));
            invalidOracles = oracles.filter(oracle => !oracle.hasIndex(requestIndex));

            if (validOracles.length >= 3) {
                canPayout = true;
            }
        });

        it('emits OracleReport event', async () => {
            if (validOracles.length === 0) {
                // eslint-disable-next-line no-console
                console.log('There are no oracles with valid index. Please rerun test.');
                return;
            }

            const tx = await instance.submitOracleResponse(
                requestIndex,
                flightNumber,
                timestamp,
                statusCode,
                { from: validOracles[0].address },
            );

            truffleAssert.eventEmitted(tx, 'OracleReport', event => (
                event.flight === flightNumber
                && event.timestamp.toNumber() === timestamp
                && event.status.toNumber() === statusCode
            ));
        });

        it('emits FlightStatusInfo event when third response submitted', async () => {
            if (validOracles.length < 3) {
                // eslint-disable-next-line no-console
                console.log('There are less than 3 oracles with valid index. Please rerun test.');
                return;
            }

            await instance.submitOracleResponse(
                requestIndex,
                flightNumber,
                timestamp,
                statusCode,
                { from: validOracles[1].address },
            );

            const tx = await instance.submitOracleResponse(
                requestIndex,
                flightNumber,
                timestamp,
                statusCode,
                { from: validOracles[2].address },
            );

            truffleAssert.eventEmitted(tx, 'FlightStatusInfo', event => (
                event.flight === flightNumber
                && event.timestamp.toNumber() === timestamp
                && event.status.toNumber() === statusCode
            ));
        });

        it('refuses a request to submit to a closed oracle request', async () => {
            if (validOracles.length < 4) {
                // eslint-disable-next-line no-console
                console.log('There are less than 4 oracles with valid index. Please rerun test.');
                return;
            }

            try {
                await instance.submitOracleResponse(
                    requestIndex,
                    flightNumber,
                    timestamp,
                    statusCode,
                    { from: validOracles[3].address },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Request is closed/);
            }
        });

        it('refuses a request from a oracle does not have the requested index', async () => {
            if (invalidOracles.length === 0) {
                // eslint-disable-next-line no-console
                console.log('There are no oracles with invalid index. Please rerun test.');
                return;
            }

            try {
                await instance.submitOracleResponse(
                    requestIndex,
                    flightNumber,
                    timestamp,
                    statusCode,
                    { from: invalidOracles[0].address },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Index does not match oracle request/);
            }
        });

        it('refuses a request from not registered oracle', async () => {
            try {
                await instance.submitOracleResponse(
                    requestIndex,
                    flightNumber,
                    timestamp,
                    statusCode,
                    { from: airline1 },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not registered oracle/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.submitOracleResponse(
                    requestIndex,
                    flightNumber,
                    timestamp,
                    statusCode,
                    { from: oracles[0].address },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });

    describe('withdrawalRefund function', () => {
        it('allows passengers to withdrawal payout', async () => {
            if (!canPayout) {
                // eslint-disable-next-line no-console
                console.log('There are no flights to pay back credit. Please rerun test.');
                return;
            }

            const { flightNumber, timestamp } = testFlight;
            const balanceBefore = await web3.eth.getBalance(passenger1);

            await instance.withdrawalRefund(
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

        it('does not allow to withdrawal if flight does not delay', async () => {
            const flightNumber = 'TEST234';
            const timestamp = Date.parse('02 Jan 2009 09:00:00 GMT');

            await instance.registerFlight(flightNumber, timestamp, { from: airline1 });
            await instance.buyInsurance(flightNumber, timestamp, {
                from: passenger1,
                value: premium,
            });

            try {
                await instance.withdrawalRefund(
                    flightNumber,
                    timestamp,
                    { from: passenger1, gasPrice: 0 },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Not a flight to payout/);
            }
        });

        it('refuses any requests when the contract is not operational', async () => {
            const flightNumber = 'TEST345';
            const timestamp = Date.parse('03 Jan 2009 09:00:00 GMT');

            await instance.registerFlight(flightNumber, timestamp, { from: airline1 });
            await instance.buyInsurance(flightNumber, timestamp, {
                from: passenger1,
                value: premium,
            });

            await instance.setOperatingStatus(false, { from: owner });

            try {
                await instance.withdrawalRefund(
                    flightNumber,
                    timestamp,
                    { from: passenger1, gasPrice: 0 },
                );
                throw new Error('unreachable error');
            } catch (error) {
                assert.match(error.message, /Contract is currently not operational/);
            }

            await instance.setOperatingStatus(true, { from: owner });
        });
    });
});
