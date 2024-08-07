import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { useRef, useEffect } from 'react';
import {
  Modal, FormGroup, FormControl, Button,
} from 'react-bootstrap';
import filter from 'leo-profanity';
import { useTranslation } from 'react-i18next';
import { useRollbar } from '@rollbar/react';

import { useEditChannelMutation } from '../../api/homeChannelsApi.js';
import handleError from '../../utils/handleError.js';
import useAuthContext from '../../hooks/useAuthContext.js';
import showSuccess from '../../utils/showSuccess.js';

const RenameChannel = ({ handleCloseModal }) => {
  const { channelNames, editChannelId, editChannelName } = useSelector((state) => state.app);
  const rollbar = useRollbar();
  const { logOut } = useAuthContext();

  const { t } = useTranslation();

  const channelSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, t('homePage.modals.errors.shortChannelName'))
      .max(20, t('homePage.modals.errors.longChannelName'))
      .matches(/\S/, t('homePage.modals.errors.requiredField'))
      .required(t('homePage.modals.errors.requiredField'))
      .notOneOf(channelNames, t('homePage.modals.errors.uniqueName')),
  });

  const [editChannel] = useEditChannelMutation();
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.focus();
    inputRef.current.select();
  }, []);

  const handleRenameChannel = async (channelName) => {
    const filteredChannelName = filter.clean(channelName);
    const newChannel = { id: editChannelId, name: filteredChannelName };
    const channelRenameResult = await editChannel(newChannel);

    handleCloseModal();

    if (channelRenameResult?.error) {
      handleError({
        error: channelRenameResult.error,
        filePath: 'Rename Channel',
        translate: t,
        logOut,
        rollbar,
      });

      return;
    }

    showSuccess({
      successMessage: 'renameChannel',
      translate: t,
    });
  };

  return (
    <Formik
      initialValues={{ name: editChannelName }}
      onSubmit={({ name }) => handleRenameChannel(name)}
      validationSchema={channelSchema}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({
        errors, values, handleChange, isSubmitting,
      }) => (
        <Modal show centered onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>{t('homePage.modals.renameChannelHeader')}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form>
              <FormGroup>
                <FormControl name="name" id="name" className="mb-2" value={values.name} onChange={handleChange} isInvalid={!!errors.name} ref={inputRef} />
                <label htmlFor="name" className="visually-hidden">
                  {t('homePage.modals.newChannelName')}
                </label>
                <FormGroup className="invalid-feedback">{errors.name}</FormGroup>
                <FormGroup className="d-flex justify-content-end">
                  <Button variant="secondary" type="button" className="me-2" onClick={handleCloseModal}>
                    {t('homePage.modals.declineButton')}
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {t('homePage.modals.confirmButton')}
                  </Button>
                </FormGroup>
              </FormGroup>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </Formik>
  );
};

export default RenameChannel;
