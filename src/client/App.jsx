import React, { useEffect } from 'react';
import useWeb3 from './hooks/useWeb3';
import useFlights from './hooks/useFlights';
import Layout from './components/Layout';

const App = () => {
    const [web3, contract, account] = useWeb3();
    const [flights, setAirline, setStatus] = useFlights();

    const options = { fromBlock: 0 };

    useEffect(() => {
        if (contract) {
            contract.events.FlightRegistered(options, (error, event) => {
                if (error) {
                    console.error(error); // eslint-disable-line no-console
                    return;
                }
                const { returnValues: { flight, timestamp, airline } } = event;
                setAirline(flight, timestamp.toNumber(), airline);
            });

            contract.events.FlightStatusInfo(options, (error, event) => {
                if (error) {
                    console.error(error); // eslint-disable-line no-console
                    return;
                }
                const { returnValues: { flight, timestamp, status } } = event;
                setStatus(flight, timestamp.toNumber(), status);
            });
        }
    }, [contract]);

    return (
        <div className="container d-flex flex-column">
            <h1 className="flex-grow-0">Flight Surety Dapp</h1>
            {web3 && contract && account ? (
                <Layout
                    web3={web3}
                    contract={contract}
                    account={account}
                    flights={flights}
                />
            ) : (
                <div className="row justify-content-center align-items-center flex-grow-1">
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
