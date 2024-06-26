import { createContext, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';

import { chatApiRoutes } from '../routes/routes.js';
import * as channelsSlice from '../slices/channelsSlice.js';
import * as messagesSlice from '../slices/messagesSlice.js';
import { useAuth } from './AuthProvider.jsx';

const actionsMap = {
  newMessage: () => 'newMessage',
  newChannel: () => 'newChannel',
  renameChannel: () => 'renameChannel',
  removeChannel: () => 'removeChannel',
};

const ChatApiContext = createContext({});

const ChatApiProvider = ({ socket, children }) => {
  const TIMEOUT = 4000;

  const dispatch = useDispatch();
  const { getAuthHeader } = useAuth();

  const context = useMemo(() => {
    const sendMessage = async (message) => {
      await socket
        .timeout(TIMEOUT)
        .emitWithAck(actionsMap.newMessage(), { ...message, timestamp: Date.now() });
    };

    const createChannel = async (name) => {
      const { data } = await socket
        .timeout(TIMEOUT)
        .emitWithAck(actionsMap.newChannel(), { name });

      dispatch(channelsSlice.actions.addChannel(data));
      dispatch(channelsSlice.actions.setCurrentChannel(data.id));
    };

    const renameChannel = async (id, newName) => {
      await socket
        .timeout(TIMEOUT)
        .emitWithAck(actionsMap.renameChannel(), { id, name: newName });
    };

    const removeChannel = async (id) => {
      await socket
        .timeout(TIMEOUT)
        .emitWithAck(actionsMap.removeChannel(), { id });
    };

    const connectSocket = () => {
      socket.connect();

      socket.on(actionsMap.newMessage(), (message) => {
        // console.log(message, socket);
        dispatch(messagesSlice.actions.addMessage(message));
      });
      socket.on(actionsMap.newChannel(), (channel) => {
        dispatch(channelsSlice.actions.addChannel(channel));
      });
      socket.on(actionsMap.renameChannel(), ({ id, name }) => {
        dispatch(channelsSlice.actions.renameChannel({ id, changes: { name } }));
      });
      socket.on(actionsMap.removeChannel(), ({ id }) => {
        dispatch(channelsSlice.actions.removeChannel(id));
      });
    };

    const disconnectSocket = () => {
      socket.off();
      socket.disconnect();
    };

    const getServerMessages = async () => {
      const route = chatApiRoutes.messages();
      const headers = getAuthHeader();
      const response = await axios.get(route, { headers });

      return response;
    };

    // const postServerMessage = async () => {
    //   const route = chatApiRoutes.messages();
    //   const headers = getAuthHeader();
    //   const response = await axios.post(route, { headers });

    //   return response;
    // };

    const getServerChannels = async () => {
      const route = chatApiRoutes.channels();
      const headers = getAuthHeader();
      const response = await axios.get(route, { headers });

      return response;
    };
    return ({
      getServerChannels,
      getServerMessages,
      // postServerMessage,
      connectSocket,
      sendMessage,
      createChannel,
      renameChannel,
      removeChannel,
      disconnectSocket,
    });
  }, [dispatch, getAuthHeader, socket]);

  return (
    <ChatApiContext.Provider value={context}>
      {children}
    </ChatApiContext.Provider>
  );
};

const useChatApi = () => useContext(ChatApiContext);
export { ChatApiContext, useChatApi };
export default ChatApiProvider;
