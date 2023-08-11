import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import css from './NoSearchResultsMaybe.module.css';
import { ExternalLink } from '../../../components';

const NoSearchResultsMaybe = props => {
  const { listingsAreLoaded, totalItems, location, resetAll } = props;
  console.log('arrived no search results');
  console.log(props);
  const hasNoResult = listingsAreLoaded && totalItems === 0;
  const hasSearchParams = location.search?.length > 0;
  return hasNoResult ? (
    <div className={css.noSearchResults}>
      <FormattedMessage id="SearchPage.noResults" />
      <br />
      <br />
      <ExternalLink href="https://forms.gle/tDzGq9DrEEnqLj636">
        Can't find what you're looking for? Click here!
      </ExternalLink>
      <br />
      {hasSearchParams ? (
        <button className={css.resetAllFiltersButton} onClick={e => resetAll(e)}>
          <FormattedMessage id={'SearchPage.resetAllFilters'} />
        </button>
      ) : null}
    </div>
  ) : null;
};

export default NoSearchResultsMaybe;
