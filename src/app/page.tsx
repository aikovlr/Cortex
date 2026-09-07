import styles from "./page.module.css";
import Sidebar from "./Components/Sidebar/sidebar";
import Header from "./Components/Header/header";

export default function Home() {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      
      <div className={styles.page}>
        <Header titulo="Minhas tarefas" />
      </div>
    </div>
  );
}
