'use client';

import styles from './header.module.css';
import Image from 'next/image';
import { useState } from 'react';

export default function Header({ titulo }: { titulo: string }) {
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    return (
        <div className={styles.header}>
            <div className={styles.toggleButton}>
                <Image src="/layout-sidebar-right-expand.svg" alt="Menu" width={32} height={32} />
            </div>
            
            <div className={styles.titulo}>
                <p>Workspace / Cortex</p>
                <text>{titulo}</text>
            </div>

                <Image
                    className={styles.themeButton}
                    src={isDarkTheme ? '/sun.svg' : '/moon.svg'}
                    alt={isDarkTheme ? 'Tema claro' : 'Tema escuro'}
                    width={32}
                    height={32}
                    onClick={() => setIsDarkTheme(!isDarkTheme)}
                />
                
                <Image className={styles.notificationButton} src="/bell.svg" alt="Notificações" width={32} height={32} />
        </div>
    );
}