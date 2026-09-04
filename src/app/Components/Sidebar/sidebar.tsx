"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./sidebar.module.css";
import Link from "next/dist/client/link";

export default function Sidebar() {
    const [selected, setSelected] = useState("minhas-tarefas");
    return (
        <div className={styles.layout}>
            <div className={styles.sidebar}>

                <div className={styles.logo}>
                    <Image src="/logo.png" alt="Logo" width={200} height={200} loading="eager" />
                </div>

                <div className={styles.menu}>

                    <Link href="./../pages/minhas-tarefas" className={styles.link}>
                        <div className={`${styles.menuItem} ${selected === "minhas-tarefas" ? styles.selected : ""}`}
                            onClick={() => setSelected("minhas-tarefas")}>
                            <Image src="clipboard-text.svg" alt="Minhas tarefas" width={24} height={24} />
                            Minhas tarefas
                        </div>
                    </Link>

                    <Link href="./../pages/gerenciar-tarefas" className={styles.link}>
                        <div className={`${styles.menuItem} ${selected === "gerenciar-tarefas" ? styles.selected : ""}`}
                            onClick={() => setSelected("gerenciar-tarefas")}>
                            <Image src="clipboard-data.svg" alt="Minhas tarefas" width={24} height={24} />
                            Gerenciar
                        </div>
                    </Link>

                    <Link href="./../pages/gerenciar-equipes" className={styles.link}>
                        <div className={`${styles.menuItem} ${selected === "gerenciar-equipes" ? styles.selected : ""}`}
                            onClick={() => setSelected("gerenciar-equipes")}>
                            <Image src="users.svg" alt="Minhas tarefas" width={24} height={24} />
                            Equipes
                        </div>
                    </Link>

                    <Link href="./../pages/configuracoes" className={styles.link}>
                        <div className={`${styles.menuItem} ${selected === "configuracoes" ? styles.selected : ""}`}
                            onClick={() => setSelected("configuracoes")}>
                            <Image src="adjustments-horizontal.svg" alt="Minhas tarefas" width={24} height={24} />
                            Configurações
                        </div>
                    </Link>

                </div>

                <div className={styles.footer}>
                    <Image src="/perfil.png" alt="Perfil" width={32} height={32} />
                    Placeholder
                    <span className={styles.logout}>
                        <Image src="/logout-2.svg" alt="Sair" width={24} height={24} />
                    </span>
                </div>

            </div>
        </div>
    );
}