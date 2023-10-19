import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingLocationForm from './EditListingLocationForm';
import css from './EditListingLocationPanel.module.css';
import { types as sdkTypes } from '../../../../util/sdkLoader';
const { LatLng } = sdkTypes;

const jmhh = {
  selectedPlace: {
    address: 'Jon M. Huntsman Hall, 3730 Walnut St, Philadelphia, PA 19104',
    origin: new LatLng(39.955029, -75.210083),
  },
};

const ccc = {
  selectedPlace: {
    address: '3907 Walnut St, Philadelphia, PA 19104',
    origin: new LatLng(39.954109, -75.20063),
  },
};

const golf = {
  selectedPlace: {
    address: '2116 Chestnut St, Philadelphia, PA 19103',
    origin: new LatLng(39.95211, -75.176338),
  },
};

const pott = {
  selectedPlace: {
    address: '3701 Walnut St, Philadelphia, PA 19104',
    origin: new LatLng(39.95372, -75.196899),
  },
};

const vp = {
  selectedPlace: {
    address: '3420 Walnut St, Philadelphia, PA 19104',
    origin: new LatLng(39.952801, -75.192398),
  },
};

const wmaker = {
  selectedPlace: {
    address: '2020 Walnut St, Philadelphia, PA 19103',
    origin: new LatLng(39.95032, -75.17508),
  },
};

const getInitialValues = props => {
  const { listing } = props;
  const { publicData } = listing?.attributes || {};

  // Only render current search if full place object is available in the URL params
  // TODO bounds are missing - those need to be queried directly from Google Places
  // const location = publicData?.location || {};
  const lckrSelect = publicData?.lckrSelect || null;
  const location =
    lckrSelect === 'jmhh'
      ? jmhh
      : lckrSelect === 'ccc'
      ? ccc
      : lckrSelect === 'golf'
      ? golf
      : lckrSelect === 'vp'
      ? vp
      : lckrSelect === 'pott'
      ? pott
      : lckrSelect === 'wmaker'
      ? wmaker
      : null;
  // const locationFieldsPresent = publicData?.location?.address && geolocation;

  // console.log('location');
  // console.log(location);

  // const { address, building } = location;
  const {
    selectedPlace: { address, origin },
  } = location;

  // console.log(lckrSelect);

  return {
    // building,
    location: {
      search: address,
      selectedPlace: { address, origin: origin },
    },
    lckrSelect: lckrSelect,
  };
};

const EditListingLocationPanel = props => {
  // State is needed since LocationAutocompleteInput doesn't have internal state
  // and therefore re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props) });
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes.state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingLocationPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingLocationPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingLocationForm
        className={css.form}
        initialValues={state.initialValues}
        onSubmit={values => {
          // console.log('ARRIVED HERE');
          // console.log(values);
          const { building = '', lckrSelect } = values;

          const location =
            lckrSelect === 'jmhh'
              ? jmhh
              : lckrSelect === 'ccc'
              ? ccc
              : lckrSelect === 'golf'
              ? golf
              : lckrSelect === 'vp'
              ? vp
              : lckrSelect === 'pott'
              ? pott
              : lckrSelect === 'wmaker'
              ? wmaker
              : null;

          console.log('this is it');
          console.log(location);

          const {
            selectedPlace: { address, origin },
          } = location;

          // const { testingRad } = rad;

          // select option from the drop down, called locationSelect
          // map each locationSelect to an ADDRESS (string) and ORIGIN (geolocation)
          // make this a location object
          // use this in the onSubmit to update publicData

          // New values for listing attributes
          const updateValues = {
            geolocation: origin,
            publicData: {
              location: { address, building },
              lckrSelect: lckrSelect,
            },
          };
          // Save the initialValues to state
          // LocationAutocompleteInput doesn't have internal state
          // and therefore re-rendering would overwrite the values during XHR call.
          setState({
            initialValues: {
              building,
              location: {
                search: address,
                selectedPlace: { address, origin },
              },
              lckrSelect: lckrSelect,
            },
          });

          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        autoFocus
      />
    </div>
  );
};

const { func, object, string, bool } = PropTypes;

EditListingLocationPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingLocationPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingLocationPanel;
