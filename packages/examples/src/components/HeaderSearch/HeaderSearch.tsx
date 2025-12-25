import { Component } from 'solid-js';
import { appStore, setSearchTerm } from '../../store/appStore';
import styles from './HeaderSearch.module.css';

const HeaderSearch: Component = () => {
    return (
        <div class={styles.header}>
            <h1 class={styles.title}>Zylem Examples</h1>
            <input
                type="text"
                placeholder="Search..."
                class={styles.searchInput}
                value={appStore.searchTerm}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
            />
        </div>
    );
};

export default HeaderSearch;
