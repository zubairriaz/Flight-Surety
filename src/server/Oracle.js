const faker = require('faker');

class Oracle {
    constructor(account, statusCode) {
        this.account = account;
        this.indexes = [];
        this.isListening = false;

        if (statusCode === undefined) {
            this.statusCode = faker.random.number(5) * 10;
        } else {
            this.statusCode = parseInt(statusCode, 10);
        }
    }

    startListening(contract, fee) {
        this.subscribeRegisteredEvent(contract);
        this.registerOracle(contract, fee);
    }

    registerOracle(contract, fee) {
        contract.methods.registerOracle()
            .send({ from: this.account, value: fee, gas: 6700000 })
            .catch(console.log); // eslint-disable-line no-console
    }

    submitResponse(contract, event) {
        const { flight, index } = event.returnValues;
        const timestamp = event.returnValues.timestamp.toNumber();

        contract.methods.submitOracleResponse(index, flight, timestamp, this.statusCode)
            .send({ from: this.account, gas: 6700000 })
            .catch(console.log); // eslint-disable-line no-console
    }

    subscribeRegisteredEvent(contract) {
        contract.events.OracleRegistered({
            filter: {
                account: this.account,
            },
            fromBlock: 0,
        }, (error, event) => {
            if (error) {
                console.log(error); // eslint-disable-line no-console
                return;
            }

            const { indexes } = event.returnValues;
            this.indexes = indexes;
            this.subscribeRequestEvent(contract);
            this.isListening = true;
        });
    }

    subscribeRequestEvent(contract) {
        contract.events.OracleRequest({
            fromBlock: 0,
        }, (error, event) => {
            if (error) {
                console.log(error); // eslint-disable-line no-console
                return;
            }

            if (this.indexes.includes(event.returnValues.index)) {
                this.submitResponse(contract, event);
            }
        });
    }
}

module.exports = Oracle;
