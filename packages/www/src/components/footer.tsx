export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer>
      <div class="footer-content">
        <p>&copy; {year} Brisa Framework</p>
      </div>
    </footer>
  );
}
