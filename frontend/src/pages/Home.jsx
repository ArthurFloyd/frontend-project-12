/* eslint-disable no-param-reassign */

import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';

import { homeChannelsApi, useGetChannelsQuery } from '../api/homeChannelsApi.js';
import { homeMessagessApi, useGetMessagesQuery } from '../api/homeMessagesApi.js';
import { changeChannel, changeModalState } from '../store/slices/app.js';
import Channels from '../containers/Channels/Channels.jsx';
import Messages from '../containers/Messages/Messages.jsx';
import NewMessage from '../containers/Messages/NewMessage.jsx';
import getModal from '../containers/Modals/index.js';
import 'react-toastify/dist/ReactToastify.css';
import defaultChannel from '../utils/defaultChannel.js';
import useSocket from '../hooks/useSocket.js';

const renderModal = ({ isModalOpened, modalType, handleCloseModal }) => {
  if (!isModalOpened) {
    return null;
  }

  const Component = getModal(modalType);
  return <Component handleCloseModal={handleCloseModal} />;
};

const Home = () => {
  const dispatch = useDispatch();
  const socket = useSocket();

  const handleCloseModal = () => {
    dispatch(changeModalState({ isModalOpened: false, modalType: null, editChannelId: null }));
  };

  const {
    currentChannelId,
    modals: { isModalOpened, modalType },
  } = useSelector((state) => state.app);

  const { data: channels } = useGetChannelsQuery();
  const { data: messages } = useGetMessagesQuery();

  console.log(messages);

  useEffect(() => {
    const handleNewMessage = (newMessage) => dispatch(homeMessagessApi.util.updateQueryData('getMessages', undefined, (draftMessages) => {
      draftMessages.push(newMessage);
    }));

    const handleNewChannel = (newChannel) => dispatch(homeChannelsApi.util.updateQueryData('getChannels', undefined, (draftChannels) => {
      draftChannels.push(newChannel);
    }));

    const handleRenameChannel = (newChannel) => dispatch(homeChannelsApi.util.updateQueryData('getChannels', undefined, (draftChannels) => {
      draftChannels.forEach((channel) => {
        if (channel.id === newChannel.id) {
          channel.name = newChannel.name;
          dispatch(changeChannel({ name: channel.name, id: channel.id }));
        }
      });

      return draftChannels;
    }));

    const handleRemoveChannel = ({ id }) => {
      const removeChannelAction = homeChannelsApi.util.updateQueryData('getChannels', undefined, (draftChannels) => {
        draftChannels = draftChannels.filter((curChannels) => curChannels.id !== id);

        if (currentChannelId === id) {
          dispatch(changeChannel(defaultChannel));
        }

        return draftChannels;
      });

      const removeMessagesAction = homeMessagessApi.util.updateQueryData(
        'getMessages',
        undefined,
        (draftMessages) => draftMessages.filter(({ channelId }) => channelId !== id),
      );

      dispatch(removeChannelAction);
      dispatch(removeMessagesAction);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('newChannel', handleNewChannel);
    socket.on('renameChannel', handleRenameChannel);
    socket.on('removeChannel', handleRemoveChannel);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('newChannel', handleNewChannel);
      socket.off('renameChannel', handleNewChannel);
      socket.off('removeChannel', handleRemoveChannel);
    };
  }, [currentChannelId, dispatch, socket]);

  return (
    <>
      <div className="container h-100 my-4 overflow-hidden rounded shadow">
        <div className="row h-100 bg-white flex-md-row">
          <Channels channels={channels} />
          <Messages messages={messages}>
            <NewMessage />
          </Messages>
        </div>
      </div>
      <ToastContainer />
      {renderModal({ isModalOpened, modalType, handleCloseModal })}
    </>
  );
};

export default Home;
