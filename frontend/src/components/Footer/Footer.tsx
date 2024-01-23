
import { Link } from "@fluentui/react-components";
import { FooterStyles } from "./FooterStyles";

function Footer() {
    const styles = FooterStyles();
  return (
    <div
      className={styles.footerContainer}
    >
      <Link href="mailto:msrchatsupport@microsoft.com">
        <p className={styles.footerText}>Contact Us</p>
      </Link>
      <p className={styles.footerText}>|</p>
      <Link href="https://www.microsoft.com/en-us/legal/terms-of-use" >
        <p className={styles.footerText}>Terms of Use</p>
      </Link>
      <p className={styles.footerText}>|</p>
      <Link href="https://go.microsoft.com/fwlink/?LinkId=521839" >
        <p className={styles.footerText}>Privacy & Cookies</p>
      </Link>
      <p className={styles.footerText}>|</p>
        <p className={styles.footerText}>We do not retain your chat data.</p>
      <p className={styles.footerText}>|</p>
      <p className={styles.footerText}>
        &copy; {new Date().getFullYear()} Microsoft
      </p>
    </div>
  );
}

export default Footer;
