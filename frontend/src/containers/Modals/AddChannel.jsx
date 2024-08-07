import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useRef, useEffect } from 'react';
import {
  Modal, FormGroup, FormControl, Button,
} from 'react-bootstrap';
import filter from 'leo-profanity';
import { useTranslation } from 'react-i18next';
import { useRollbar } from '@rollbar/react';

import { useAddChannelMutation } from '../../api/homeChannelsApi.js';
import { changeChannel } from '../../store/slices/app.js';
import useAuthContext from '../../hooks/useAuthContext.js';
import handleError from '../../utils/handleError.js';
import showSuccess from '../../utils/showSuccess.js';

const AddChannel = ({ handleCloseModal }) => {
  const { channelNames } = useSelector((state) => state.app);
  const { t } = useTranslation();
  const rollbar = useRollbar();
  const { logOut } = useAuthContext();

  const channelSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, t('homePage.modals.errors.shortChannelName'))
      .max(20, t('homePage.modals.errors.longChannelName'))
      .matches(/\S/, t('homePage.modals.errors.requiredField'))
      .required(t('homePage.modals.errors.requiredField'))
      .notOneOf(channelNames, t('homePage.modals.errors.uniqueName')),
  });

  const [addChannel] = useAddChannelMutation();
  const dispatch = useDispatch();
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleAddNewChannel = async (channelName) => {
    const filteredChannelName = filter.clean(channelName);
    const newChannel = { name: filteredChannelName };
    const channelAdditionResult = await addChannel(newChannel);
    handleCloseModal();

    if (channelAdditionResult?.error) {
      handleError({
        error: channelAdditionResult.error,
        filePath: 'Add Channel',
        translate: t,
        logOut,
        rollbar,
      });

      return;
    }

    const { data: { name, id } } = channelAdditionResult;
    dispatch(changeChannel({ name, id }));

    showSuccess({
      successMessage: 'addChannel',
      translate: t,
    });
  };

  return (
    <Formik
      initialValues={{ name: '' }}
      onSubmit={({ name }) => handleAddNewChannel(name)}
      validationSchema={channelSchema}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({
        errors, values, handleChange, isSubmitting,
      }) => (
        <Modal show centered onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>{t('homePage.modals.addNewChannelHeader')}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form disabled>
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

export default AddChannel;
