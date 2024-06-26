import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Container, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useRollbar } from '@rollbar/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Rings } from 'react-loader-spinner';

import Channels from './components/Channels.jsx';
import Messages from './components/Messages.jsx';
import Modal from '../common/Modal/index.js';
import { fetchInitialChannels, fetchInitialMessages } from '../../slices/thunks.js';
import { useAuth } from '../../contexts/AuthProvider.jsx';

import { useChatApi } from '../../contexts/ChatApiProvider.jsx';
import { selectors as loadingStatusSelectors } from '../../slices/loadingStatusSlice.js';
import { selectors as channelsSelectors } from '../../slices/channelsSlice.js';
import { selectors as messagesSelectors } from '../../slices/messagesSlice.js';

const statusesMap = {
  successful: 'successful',
  failed: 'failed',
  authError: 'authError',
};

const Placeholder = () => (
  <Rings
    height="200"
    width="200"
    color="#4fa94d"
    radius="6"
    visible
    ariaLabel="rings-loading"
    wrapperClass="justify-content-center align-items-center"
  />
);

const ChatError = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="m-auto w-auto text-center">
      <p>{t('chatApiError')}</p>
      <Button onClick={() => navigate(0)}>{t('update')}</Button>
    </div>
  );
};

const InnerContent = () => {
  const loadingState = useSelector(loadingStatusSelectors.getStatus);
  const channels = useSelector(channelsSelectors.selectAllChannels);
  const currentChannel = useSelector(channelsSelectors.selectCurrentChannel);
  const currentChannelMessages = useSelector(messagesSelectors.selectCurrentChannelMessages);
  // console.log('currentChannelMessages', currentChannelMessages, currentChannel);

  switch (loadingState) {
    case statusesMap.successful:
      return (
        <>
          <Channels channels={channels} currentChannelId={currentChannel.id} />
          <Messages channel={currentChannel} messages={currentChannelMessages} />
        </>
      );

    case statusesMap.failed:
      return <ChatError />;

    default:
      return <Placeholder />;
  }
};

const ChatPage = () => {
  const rollbar = useRollbar();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { logOut } = useAuth();
  const {
    connectSocket, getServerChannels, getServerMessages, disconnectSocket,
  } = useChatApi();

  useEffect(() => {
    // console.log('c', fetchInitialData(getServerChannels));
    // console.log('m', fetchInitialData(getServerMessages));
    dispatch(fetchInitialChannels(getServerChannels));
    dispatch(fetchInitialMessages(getServerMessages));
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [dispatch, connectSocket, disconnectSocket, getServerChannels, getServerMessages]);

  const loadingState = useSelector(loadingStatusSelectors.getStatus);

  useEffect(() => {
    switch (loadingState) {
      case statusesMap.authError:
        toast.error(t('toasts.fetchDataError'));
        rollbar.error('Chat#authError');
        logOut();
        break;

      case statusesMap.failed:
        rollbar.error('Chat#failed');
        break;

      default:
        break;
    }
  }, [loadingState, logOut, rollbar, t]);

  return (
    <>
      <Container className="h-100 my-4 overflow-hidden rounded shadow">
        <Row className="h-100 bg-white flex-md-row">
          <InnerContent />
        </Row>
      </Container>
      <Modal />
    </>
  );
};

export default ChatPage;
