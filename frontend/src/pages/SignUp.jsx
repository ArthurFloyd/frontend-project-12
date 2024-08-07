import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import {
  FormGroup, FormControl, Button, FormFloating, FormLabel,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import useAuthContext from '../hooks/useAuthContext';
import { useSignUpMutation } from '../api/authenticateApi';
import SignupComponent from '../components/SignupComponent';
import signup from '../assets/signup.jpg';
import { appRoutes } from '../containers/Routes/routesPath.js';

const SignUp = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [signUp] = useSignUpMutation();
  const authContext = useAuthContext();

  const signupSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, t('signupPage.errors.shortUserName'))
      .max(20, t('signupPage.errors.longUserName'))
      .required(t('signupPage.errors.requiredField')),
    password: Yup.string().min(6, t('signupPage.errors.shortPassword')).required(t('signupPage.errors.requiredField')),
    confirmPassword: Yup.string().oneOf([Yup.ref('password')], t('signupPage.errors.passwordMatch')).required(t('signupPage.errors.requiredField')),
  });
  const handleFormSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const authData = await signUp({ ...values }).unwrap();
      authContext.login(authData);

      setSubmitting(false);
      navigate(appRoutes.chatPagePath());
    } catch (error) {
      setSubmitting(false);
      const { status } = error;
      switch (status) {
        case 0: {
          setErrors({ username: ' ', password: ' ', confirmPassword: t('signupPage.errors.network') });
          break;
        }
        case 409: {
          setErrors({ username: ' ', password: ' ', confirmPassword: t('signupPage.errors.userExists') });
          break;
        }
        default: {
          setErrors({ username: ' ', password: ' ', confirmPassword: t('signupPage.errors.unknown') });
          break;
        }
      }
    }
  };
  return (
    <SignupComponent avatar={signup}>
      <Formik
        initialValues={{ username: '', password: '', confirmPassword: '' }}
        onSubmit={handleFormSubmit}
        validationSchema={signupSchema}
        validateOnChange={false}
        validateOnBlur
      >
        {({
          errors, values, handleChange, handleBlur, isSubmitting,
        }) => (
          <Form className="w-50">
            <h1 className="text-center mb-4">{t('signupPage.form.header')}</h1>
            <FormFloating className="mb-3">
              <FormControl
                name="username"
                id="username"
                value={values.username}
                onBlur={handleBlur}
                onChange={handleChange}
                isInvalid={!!errors.username}
                autoFocus
              />
              <FormLabel htmlFor="username">{t('signupPage.form.username')}</FormLabel>
              <FormGroup className="invalid-tooltip">{errors.username}</FormGroup>
            </FormFloating>

            <FormFloating className="mb-3">
              <FormControl
                type="password"
                name="password"
                id="password"
                value={values.password}
                onBlur={handleBlur}
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <FormLabel htmlFor="password">{t('signupPage.form.password')}</FormLabel>
              <FormGroup className="invalid-tooltip">{errors.password}</FormGroup>
            </FormFloating>

            <FormFloating className=" mb-4">
              <FormControl
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={values.confirmPassword}
                onBlur={handleBlur}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
              />
              <FormLabel htmlFor="confirmPassword">{t('signupPage.form.passwordConfirm')}</FormLabel>
              <FormGroup className="invalid-tooltip">{errors.confirmPassword}</FormGroup>
            </FormFloating>
            <Button type="submit" variant="outline-primary" className="w-100" disabled={isSubmitting}>
              {t('signupPage.form.registrationButton')}
            </Button>
          </Form>
        )}
      </Formik>
    </SignupComponent>
  );
};

export default SignUp;
