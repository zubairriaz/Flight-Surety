import { useReducer } from 'react';
import faker from 'faker';

/* ********************************************************************
 *                       UTILITY FUNCTIONS                            *
 ******************************************************************** */
const { address: { countryCode }, random: { number } } = faker;

const fakeFlightNumber = () => (
    `${countryCode()}${number(9)}${number(9)}${number(9)}${number(9)}`
);

/* ********************************************************************
 *                         INITIAL STATE                              *
 ******************************************************************** */
const initialFlights = [
    {
        number: fakeFlightNumber(),
        timestamp: new Date().setHours(9, 0, 0, 0),
        airline: '',
        status: 0, // 0: unknwon
    },
    {
        number: fakeFlightNumber(),
        timestamp: new Date().setHours(11, 0, 0, 0),
        airline: '',
        status: 0, // 0: unknwon
    },
    {
        number: fakeFlightNumber(),
        timestamp: new Date().setHours(13, 0, 0, 0),
        airline: '',
        status: 0, // 0: unknwon
    },
    {
        number: fakeFlightNumber(),
        timestamp: new Date().setHours(15, 0, 0, 0),
        airline: '',
        status: 0, // 0: unknwon
    },
    {
        number: fakeFlightNumber(),
        timestamp: new Date().setHours(17, 0, 0, 0),
        airline: '',
        status: 0, // 0: unknwon
    },
];

/* ********************************************************************
 *                            ACTIONS                                 *
 ******************************************************************** */
const SET_AIRLINE = Symbol('SET_AIRLINE');
const SET_STATUS = Symbol('SET_STATUS');

/* ********************************************************************
 *                            REDUCERS                                *
 ******************************************************************** */
const flightReducer = (state, action) => {
    switch (action.type) {
    case SET_AIRLINE:
        return { ...state, airline: action.airline };
    case SET_STATUS:
        return { ...state, status: action.status };
    default:
        return state;
    }
};

const flightsReducer = (state, action) => (
    state.map((flight) => {
        if (flight.number === action.flightNumber && flight.timestamp === action.timestamp) {
            return flightReducer(flight, action);
        }
        return flight;
    })
);

/* ********************************************************************
 *                               HOOK                                 *
 ******************************************************************** */
const useFlights = () => {
    const [state, dispatch] = useReducer(flightsReducer, initialFlights);

    const setAirline = (flightNumber, timestamp, airline) => dispatch({
        type: SET_AIRLINE,
        flightNumber,
        timestamp,
        airline,
    });

    const setStatus = (flightNumber, timestamp, status) => dispatch({
        type: SET_STATUS,
        flightNumber,
        timestamp,
        status,
    });

    return [state, setAirline, setStatus];
};

export default useFlights;
