const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hour = date.getHours();

    return `${month} ${day}, ${hour}:00`;
};

const formatAddress = address => `${address.slice(0, 5)}...`;

const formatFlightStatus = (statusCode) => {
    switch (statusCode) {
    case 10:
        return 'On Time';
    case 20:
        return 'Late Airline';
    case 30:
        return 'Late Weather';
    case 40:
        return 'Late Technical';
    case 50:
        return 'Late Other';
    default:
        return 'Unknown';
    }
};

export default {
    date: formatDate,
    address: formatAddress,
    flightStatus: formatFlightStatus,
};
