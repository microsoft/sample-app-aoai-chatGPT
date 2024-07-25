import styles from "./Header.module.css";
import logo from "../../../assets/images/logo.svg"
import { useContext } from "react";
import { AppStateContext } from "../../../state/AppProvider";

export function Header() {
  const appStateContext = useContext(AppStateContext)
  const ui = appStateContext?.state.frontendSettings?.ui;
  return (
    <nav className={styles.navigation}>
      <a className={styles.homeLink} aria-label="home link with logo" href={ui?.hugo_url || 'https://hugo.huvepharma.com/'} target='_blank'>
        <img src={logo} width="160" alt="Site logo" />
      </a>
      <a className={styles.link} href={ui?.hugo_url || 'https://hugo.huvepharma.com/'} target='_blank'>
        Home
      </a> 
      <a className={styles.link} href={ui?.hugo_url+'/documents' || 'https://hugo.huvepharma.com/documents'} target='_blank'>
        Documents
      </a>
      {/* <div className="account-options">
    <ng-container *ngIf="!(authService.authenticated | async)">
      <button aria-label="Login button"><b>Login</b></button>
    </ng-container>
    <ng-container *ngIf="authService.authenticated | async">
      <button aria-label="My account">
        Welcome, <b>{{ userNameChanged$ | async }}</b>
      </button>
      <ul>
        <li><button (click)="authService.logout()">Log out</button></li>
      </ul>
    </ng-container>
  </div> */}
    </nav>
  );
}
