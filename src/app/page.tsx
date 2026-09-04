import styles from "./page.module.css";
import Sidebar from "./Components/Sidebar/sidebar";

export default function Home() {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      
      <div className={styles.page}>
        
      </div>
    </div>
  );
}
