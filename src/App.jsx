import { useState } from 'react';
import styles from './App.module.css';
import {
    BiochemistryPage,
    EpigenomePage,
    FluxDynamicsPage,
    GuideDesignPage,
    Header,
} from './components';

function App() {
  const [activePage, setActivePage] = useState(0);

  const renderPage = () => {
    switch (activePage) {
      case 0:
        return <BiochemistryPage />;
      case 1:
        return <EpigenomePage />;
      case 2:
        return <FluxDynamicsPage />;
      case 3:
        return <GuideDesignPage />;
      default:
        return <BiochemistryPage />;
    }
  };

  return (
    <div className={styles.app}>
      <Header activePage={activePage} setActivePage={setActivePage} />
      <main className={styles.content}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
