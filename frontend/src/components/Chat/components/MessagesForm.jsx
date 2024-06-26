import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as yup from 'yup';
import leoProfanity from 'leo-profanity';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { MdArrowForward } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useRollbar } from '@rollbar/react';
import { toast } from 'react-toastify';
import axios from 'axios';

import { chatApiRoutes } from '../../../routes/routes.js';
// import { postServerMessage } from '../../../contexts/ChatApiProvider.jsx';
import { useAuth } from '../../../contexts/AuthProvider.jsx';
import { useChatApi } from '../../../contexts/ChatApiProvider.jsx';
import { selectors as channelsSelectors } from '../../../slices/channelsSlice.js';

const validationSchema = yup.object().shape({
  body: yup.string().trim().required(),
});

const MessagesForm = ({ channelId }) => {
  const rollbar = useRollbar();
  const { t } = useTranslation();
  const { getUserName } = useAuth();
  const { sendMessage } = useChatApi();
  const input = useRef(null);

  const currentChannel = useSelector(channelsSelectors.selectCurrentChannel);

  useEffect(() => {
    input.current.focus();
  }, [currentChannel]);

  const formik = useFormik({
    initialValues: {
      body: '',
    },
    validationSchema,
    validateOnMount: true,
    onSubmit: async ({ body }) => {
      // ChatApiProvider.postServerMessage();
      // console.log(ChatApiProvider);

      await axios.post(
        chatApiRoutes.messages(),
        { ...formik.values, channelId, username: getUserName() },
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxOTQwNDQ4OH0.pBMns65VV1yfFcWlmh5cCbPnCG7F1Zyzt4kYWLEn8X8',
          },
        },
      ).then((response) => {
        console.log(response.data);
      });
      // input.current.Control();
      formik.resetForm();
      const cleanedMessage = leoProfanity.clean(body);
      const message = {
        body: cleanedMessage,
        username: getUserName(),
        channelId,
      };

      try {
        await sendMessage(message);
        formik.resetForm();
      } catch (error) {
        toast.error(t('noConnection'));
        rollbar.error('MessageForm#sending', error);
      } finally {
        input.current.focus();
      }
    },
  });

  return (
    <Form className="p-3" onSubmit={formik.handleSubmit}>
      <InputGroup>
        <Form.Label visuallyHidden htmlFor="body">{t('messageFormPlaceholder')}</Form.Label>
        <Form.Control
          ref={input}
          onChange={formik.handleChange}
          value={formik.values.body}
          onBlur={formik.handleBlur}
          name="body"
          placeholder={t('messageFormPlaceholder')}
          aria-label={t('newMessage')}
          required
          className="rounded-pill w-100 pe-5 ps-3"
          id="body"
          autoComplete="off"
          disabled={formik.isSubmitting}
        />
        <Button
          disabled={formik.errors.body || formik.isSubmitting}
          className="border-0 rounded-circle p-0 m-1 position-absolute end-0 me-3"
          style={{ zIndex: 5 }}
          type="submit"
        >
          <MdArrowForward size="30" />
          <span className="visually-hidden">{t('send')}</span>
        </Button>
      </InputGroup>
    </Form>
  );
};

export default MessagesForm;
