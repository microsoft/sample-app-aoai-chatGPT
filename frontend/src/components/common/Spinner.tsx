import spinnerStyles from './Spinner.module.css'

const Spinner = ({ isActive }: { isActive: boolean }) => {
  return isActive ? (
    <div className={spinnerStyles.chatSpinnerOverlay}>
      <div className={spinnerStyles.spinner}></div>
    </div>
  ) : null
}

export default Spinner
