import React from 'react';
import { bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import * as validators from '../../../../util/validators';

import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
} from '../../../../util/validators';

// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  FieldRadioButton,
  FieldSelect,
  Button,
  FieldTextInput,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingLocationForm.module.css';

const identity = v => v;

export const EditListingLocationFormComponent = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        required,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
      } = formRenderProps;

      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingLocationForm.optionalText',
      });

      const headingText = intl.formatMessage({
        id: 'EditListingLocationForm.headingText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const showAsRequired = pristine && required;

      const requiredV = validators.required('This field is required.');

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.updateFailed" />
            </p>
          ) : null}

          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.showListingFailed" />
            </p>
          ) : null}

          {/* <h1>For your reference:</h1> */}
          <FormattedMessage id="EditListingLocationForm.headingText" />

          <br></br>

          <FieldSelect
            id="lckrSelect"
            name="lckrSelect"
            label="Selected LCKR:"
            validate={requiredV}
            rootClassName={css.validLocation}
          >
            <option value="">Pick something...</option>
            <option value="vp">Van Pelt Library</option>
            <option value="pott">Pottruck</option>
            <option value="jmhh">Huntsman Hall</option>
            <option value="wmaker">Wanamaker House</option>
            <option value="ccc">Campus Copy Center</option>
            <option value="golf">Five Iron Golf</option>
            {/* <option value="detkin">Detkin</option> */}
          </FieldSelect>

          <br></br>

          <FieldLocationAutocompleteInput
            rootClassName={css.locationAddress}
            inputClassName={css.locationAutocompleteInput}
            iconClassName={css.locationAutocompleteInputIcon}
            predictionsClassName={css.predictionsRoot}
            validClassName={css.validLocation}
            // autoFocus={autoFocus}
            name="location"
            label={intl.formatMessage({ id: 'EditListingLocationForm.address' })}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.addressPlaceholder',
            })}
            useDefaultPredictions={false}
            format={identity}
            valueFromForm={values.location}
            validate={composeValidators(
              autocompleteSearchRequired(addressRequiredMessage),
              autocompletePlaceSelected(addressNotRecognizedMessage)
            )}
          />

          {/* <FieldRadioButton
            id={`quad`}
            name="option-group"
            label="The Quad"
            value="option1"
            showAsRequired={showAsRequired}
          />
          <FieldRadioButton
            id={`vp`}
            name="option-group"
            label="Van Pelt"
            value="option2"
            showAsRequired={showAsRequired}
          />
          <FieldRadioButton
            id={`pottruck`}
            name="option-group"
            label="Pottruck"
            value="option3"
            showAsRequired={showAsRequired}
          />
          <FieldRadioButton
            id={`detkin`}
            name="option-group"
            label="Detkin"
            value="option4"
            showAsRequired={showAsRequired}
          /> */}

          <br></br>

          {/* <FieldTextInput
            className={css.building}
            type="text"
            name="building"
            id={`${formId}building`}
            label={intl.formatMessage({ id: 'EditListingLocationForm.building' }, { optionalText })}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.buildingPlaceholder',
            })}
          /> */}

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditListingLocationFormComponent.defaultProps = {
  selectedPlace: null,
  fetchErrors: null,
  formId: 'EditListingLocationForm',
};

EditListingLocationFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  selectedPlace: propTypes.place,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingLocationFormComponent);
