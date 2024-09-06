import * as yup from 'https://cdn.skypack.dev/yup';
import keyBy from 'https://cdn.skypack.dev/lodash/keyBy';
import onChange from 'https://cdn.skypack.dev/on-change';

const state = {
  form: {
    email: '',
    password: '',
    errors: {},
    processState: 'filling', 
  },
};

const watchedState = onChange(state, (path) => {
  if (path === 'form.email' || path === 'form.password') {
    const errors = validate(state.form);
    state.form.errors = errors;
  }

  updateUI();
});

const schema = yup.object().shape({
  email: yup.string().email('Must be a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const validate = (formState) => {
  try {
    schema.validateSync({
      email: formState.email,
      password: formState.password,
    }, { abortEarly: false });
    return {};
  } catch (e) {
    return keyBy(e.inner, 'path');
  }
};

const handleProcessState = (processState) => {
  watchedState.form.processState = processState;
};

const updateUI = () => {
  const { errors, processState } = state.form;

  const emailError = document.querySelector('#email-error');
  const passwordError = document.querySelector('#password-error');
  const formMessage = document.querySelector('#form-message');
  const submitButton = document.querySelector('.submit');

  emailError.textContent = errors.email ? errors.email.message : '';
  passwordError.textContent = errors.password ? errors.password.message : '';

  switch (processState) {
    case 'sent':
      formMessage.textContent = 'Authorization is successful';
      formMessage.style.color = 'green';
      break;
    case 'error':
      submitButton.disabled = false;
      formMessage.textContent = 'An error occurred';
      formMessage.style.color = 'red';
      break;
    case 'sending':
      submitButton.disabled = true;
      formMessage.textContent = 'Sending...';
      formMessage.style.color = 'orange';
      break;
    case 'filling':
      submitButton.disabled = false;
      formMessage.textContent = '';
      break;
    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

window.fetch = (url, options) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (options.method === 'POST' && url === 'https://example.com/auth') {
        resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' }),
        });
      } else {
        reject(new Error('Network error'));
      }
    }, 1000);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  form.addEventListener('submit', (e) => {
    const { id, value } = e.target;
    watchedState.form[id] = value; 
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { email, password, errors } = state.form;

    if (Object.keys(errors).length === 0) {
      handleProcessState('sending');

      try {
        await fetch('https://example.com/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        handleProcessState('sent');
      } catch (error) {
        handleProcessState('error');
      }
    } else {
      handleProcessState('filling');
    }
  });
});