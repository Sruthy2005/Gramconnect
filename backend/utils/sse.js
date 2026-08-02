let clients = [];

const addClient = (client) => {
  clients.push(client);
};

const removeClient = (res) => {
  clients = clients.filter(c => c.res !== res);
};

const getClients = () => clients;

const sendSSEEvent = (client, eventName, data) => {
  client.res.write(`event: ${eventName}\n`);
  client.res.write(`data: ${JSON.stringify(data)}\n\n`);
};

module.exports = {
  addClient,
  removeClient,
  getClients,
  sendSSEEvent
};
