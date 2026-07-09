import { Component } from 'solid-js';
import { SearchInput } from '@zylem/ui/components';
import { appStore, setSearchTerm } from '../../../store/appStore';
import * as styles from './HeaderSearch.css';

const HeaderSearch: Component = () => {
  return (
    <div class={styles.header}>
      <h1 class={styles.title}>Zylem Examples</h1>
      <SearchInput
        class={styles.searchField}
        placeholder="Search..."
        value={appStore.searchTerm}
        onInput={setSearchTerm}
      />
    </div>
  );
};

export default HeaderSearch;
