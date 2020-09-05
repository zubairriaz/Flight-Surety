import { useState, useEffect } from 'react';
import Web3 from 'web3';
import FlightSuretyApp from '../../contracts/FlightSuretyApp.json';

const useWeb3 = () => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            window.ethereum.enable().then(() => {
                setWeb3(web3Instance);
            });
        } else if (window.web3) {
            setWeb3(window.web3);
        } else {
            const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
            setWeb3(new Web3(provider));
        }
    }, []);

    useEffect(() => {
        if (web3) {
            web3.eth.getAccounts().then((accounts) => {
                setAccount(accounts[0]);
            });
        }
    }, [web3, setAccount]);

    useEffect(() => {
        if (web3) {
            web3.eth.net.getId().then((networkId) => {
                const deployedNetwork = FlightSuretyApp.networks[networkId];
                const instance = new web3.eth.Contract(
                    FlightSuretyApp.abi,
                    deployedNetwork && deployedNetwork.address,
                );
                setContract(instance);
            });
        }
    }, [web3, setContract, FlightSuretyApp]);

    return [web3, contract, account];
};

export default useWeb3;
