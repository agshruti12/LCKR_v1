import React, { Component, PropTypes } from 'react';
import { debounce } from 'lodash';
import classNames from 'classnames';
import { Input } from '../../components';
import * as propTypes from '../../util/propTypes';
import { getPlacePredictions, getPlaceDetails } from '../../util/googleMaps';

import css from './LocationAutocompleteInput.css';

const DEBOUNCE_WAIT_TIME = 200;
const KEY_CODE_ARROW_UP = 38;
const KEY_CODE_ARROW_DOWN = 40;
const KEY_CODE_ENTER = 13;
const KEY_CODE_TAB = 9;
const DIRECTION_UP = 'up';
const DIRECTION_DOWN = 'down';

// Renders the autocompletion prediction results in a list
const LocationPredictionsList = props => {
  const {
    rootClassName,
    className,
    predictions,
    highlightedIndex,
    onSelectStart,
    onSelectEnd,
  } = props;
  if (predictions.length === 0) {
    return null;
  }

  /* eslint-disable jsx-a11y/no-static-element-interactions */
  const item = (prediction, index) => {
    const isHighlighted = index === highlightedIndex;

    return (
      <li
        className={isHighlighted ? css.highlighted : null}
        key={prediction.id}
        onTouchStart={onSelectStart}
        onMouseDown={onSelectStart}
        onTouchEnd={() => onSelectEnd(index)}
        onMouseUp={() => onSelectEnd(index)}
      >
        {prediction.description}
      </li>
    );
  };
  /* eslint-enable jsx-a11y/no-static-element-interactions */

  const classes = classNames(rootClassName || css.predictionsRoot, className);

  return (
    <div className={classes}>
      <ul className={css.predictions}>
        {predictions.map(item)}
      </ul>
      <div className={css.poweredByGoogle} />
    </div>
  );
};

const { bool, shape, string, arrayOf, func, any, number } = PropTypes;

LocationPredictionsList.defaultProps = {
  rootClassName: null,
  className: null,
  highlightedIndex: null,
};

LocationPredictionsList.propTypes = {
  rootClassName: string,
  className: string,
  predictions: arrayOf(
    shape({
      id: string.isRequired,
      description: string.isRequired,
      place_id: string.isRequired,
    })
  ).isRequired,
  highlightedIndex: number,
  onSelectStart: func.isRequired,
  onSelectEnd: func.isRequired,
};

// Get the current value with defaults from the given
// LocationAutocompleteInput props.
const currentValue = props => {
  const value = props.input.value || {};
  const { search = '', predictions = [], selectedPlaceId = null, selectedPlace = null } = value;
  return { search, predictions, selectedPlaceId, selectedPlace };
};

/*
  Location auto completion input component

  This component can work as the `component` prop to Redux Form's
  <Field /> component. it takes a custom input value shape, and
  controls the onChanged callback that is called with the value to
  syncronise to the form's Redux store.

  The component works by listening to the underlying input component
  and calling the Google Maps Places API for predictions. When the
  predictions arrive, those are passed to Redux Form in the onChange
  callback.

  See the LocationAutocompleteInput.example.js file for a usage
  example within a form.
*/
class LocationAutocompleteInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      inputHasFocus: false,
      selectionInProgress: false,
      highlightedIndex: -1, // -1 means no highlight
    };

    this.changeHighlight = this.changeHighlight.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.selectItemIfNoneSelected = this.selectItemIfNoneSelected.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.handlePredictionsSelectStart = this.handlePredictionsSelectStart.bind(this);
    this.handlePredictionsSelectEnd = this.handlePredictionsSelectEnd.bind(this);
    this.finalizeSelection = this.finalizeSelection.bind(this);

    // Debounce the method to avoid calling the API too many times
    // when the user is typing fast.
    this.predict = debounce(this.predict.bind(this), DEBOUNCE_WAIT_TIME, { leading: true });
  }
  componentDidMount() {
    const mapsLibLoaded = window.google && window.google.maps;
    if (!mapsLibLoaded) {
      throw new Error('Google Maps API must be loaded for LocationAutocompleteInput');
    }
  }

  // Interpret input key event
  onKeyDown(e) {
    if (e.keyCode === KEY_CODE_ARROW_UP) {
      // Prevent changing cursor position in input
      e.preventDefault();
      this.changeHighlight(DIRECTION_UP);
    } else if (e.keyCode === KEY_CODE_ARROW_DOWN) {
      // Prevent changing cursor position in input
      e.preventDefault();
      this.changeHighlight(DIRECTION_DOWN);
    } else if (e.keyCode === KEY_CODE_ENTER) {
      const { search, selectedPlace } = currentValue(this.props);

      if (search && !selectedPlace) {
        // Prevent form submit, try to select value instead.
        e.preventDefault();
        e.stopPropagation();
        this.selectItemIfNoneSelected();
      }
    } else if (e.keyCode === KEY_CODE_TAB) {
      this.selectItemIfNoneSelected();
    }
  }

  // Handle input text change, fetch predictions if the value isn't empty
  onChange(e) {
    const onChange = this.props.input.onChange;
    const { predictions } = currentValue(this.props);
    const newValue = e.target.value;

    // Clear the current values since the input content is changed
    onChange({
      search: newValue,
      predictions: newValue ? predictions : [],
      selectedPlaceId: null,
      selectedPlace: null,
    });

    // Clear highlighted prediction since the input value changed and
    // results will change as well
    this.setState({ highlightedIndex: -1 });

    if (!newValue) {
      // No need to fetch predictions on empty input
      return;
    }

    this.predict(newValue);
  }

  // Change the currently highlighted item by calculating the new
  // index from the current state and the given direction number
  // (DIRECTION_UP or DIRECTION_DOWN)
  changeHighlight(direction) {
    this.setState((prevState, props) => {
      const { predictions } = currentValue(props);
      const currentIndex = prevState.highlightedIndex;
      let index = currentIndex;

      if (direction === DIRECTION_UP) {
        // Keep the first position if already highlighted
        index = currentIndex === 0 ? 0 : currentIndex - 1;
      } else if (direction === DIRECTION_DOWN) {
        index = currentIndex + 1;
      }

      // Check that the index is within the bounds
      if (index < 0) {
        index = -1;
      } else if (index >= predictions.length) {
        index = predictions.length - 1;
      }

      return { highlightedIndex: index };
    });
  }

  // Select the prediction in the given item. This will fetch the
  // place details and set it as the selected place.
  selectItem(index) {
    if (index < 0) {
      return;
    }
    const { predictions } = currentValue(this.props);
    if (index >= predictions.length) {
      return;
    }
    const prediction = predictions[index];
    const placeId = prediction.place_id;

    this.props.input.onChange({
      ...this.props.input,
      selectedPlaceId: placeId,
      selectedPlace: null,
    });

    getPlaceDetails(placeId)
      .then(place => {
        this.props.input.onChange({
          search: prediction.description,
          predictions: [],
          selectedPlaceId: placeId,
          selectedPlace: place,
        });
      })
      .catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
        this.props.input.onChange({
          ...this.props.input.value,
          selectedPlaceId: null,
          selectedPlace: null,
        });
      });
  }
  selectItemIfNoneSelected() {
    const { search, selectedPlaceId } = currentValue(this.props);
    if (search && !selectedPlaceId) {
      const index = this.state.highlightedIndex !== -1 ? this.state.highlightedIndex : 0;
      this.selectItem(index);
    }
  }
  predict(search) {
    const onChange = this.props.input.onChange;
    getPlacePredictions(search)
      .then(results => {
        const { search: currentSearch } = currentValue(this.props);

        // If the earlier predictions arrive when the user has already
        // changed the search term, ignore and wait until the latest
        // predictions arrive. Without this logic, results for earlier
        // requests would override whatever the user had typed since.
        //
        // This is essentially the same as switchLatest in RxJS or
        // takeLatest in Redux Saga, without canceling the earlier
        // requests.
        if (results.search === currentSearch) {
          onChange({
            search: results.search,
            predictions: results.predictions,
            selectedPlaceId: null,
            selectedPlace: null,
          });
        }
      })
      .catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
        const value = currentValue(this.props);
        onChange({
          ...value,
          selectedPlaceId: null,
          selectedPlace: null,
        });
      });
  }

  finalizeSelection() {
    this.setState({ inputHasFocus: false, highlightedIndex: -1 });
    this.props.input.onBlur(currentValue(this.props));
  }

  handleOnBlur() {
    if (!this.state.selectionInProgress) {
      this.finalizeSelection();
    }
  }

  handlePredictionsSelectStart() {
    this.setState({ selectionInProgress: true });
  }

  handlePredictionsSelectEnd(index) {
    this.setState({ selectionInProgress: false });
    this.selectItem(index);
    this.finalizeSelection();
  }

  render() {
    const {
      autoFocus,
      rootClassName,
      className,
      inputClassName,
      predictionsClassName,
      placeholder,
      input,
    } = this.props;
    const { name, onFocus } = input;
    const { search, predictions } = currentValue(this.props);

    const handleOnFocus = e => {
      this.setState({ inputHasFocus: true });
      onFocus(e);
    };

    const rootClass = classNames(rootClassName || css.root, className);
    const inputClass = classNames(css.input, inputClassName);
    const predictionsClass = classNames(predictionsClassName);

    // Only render predictions when the input has focus. For
    // development and easier workflow with the browser devtools, you
    // might want to hardcode this to `true`. Otherwise the dropdown
    // list will disappear.
    const renderPredictions = this.state.inputHasFocus;

    return (
      <div className={rootClass}>
        <Input
          className={inputClass}
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          name={name}
          value={search}
          onFocus={handleOnFocus}
          onBlur={this.handleOnBlur}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
        />
        {renderPredictions
          ? <LocationPredictionsList
              rootClassName={predictionsClass}
              predictions={predictions}
              highlightedIndex={this.state.highlightedIndex}
              onSelectStart={this.handlePredictionsSelectStart}
              onSelectEnd={this.handlePredictionsSelectEnd}
            />
          : null}
      </div>
    );
  }
}

LocationAutocompleteInput.defaultProps = {
  autoFocus: false,
  rootClassName: null,
  className: null,
  inputClassName: null,
  predictionsClassName: null,
  placeholder: '',
};

LocationAutocompleteInput.propTypes = {
  autoFocus: bool,
  rootClassName: string,
  className: string,
  inputClassName: string,
  predictionsClassName: string,
  placeholder: string,
  input: shape({
    name: string.isRequired,
    value: shape({
      search: string,
      predictions: any,
      selectedPlace: propTypes.place,
    }),
    onChange: func.isRequired,
    onFocus: func.isRequired,
    onBlur: func.isRequired,
  }).isRequired,
};

export default LocationAutocompleteInput;
