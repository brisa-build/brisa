export default function Nav() {
  return (
    <nav>
      <div className="nav-content">
        <a
          className="logo"
          href="https://brisa.build"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/brisa.svg" alt="Brisa Framework logo" width="30" />
          Brisa
        </a>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/about">About Brisa</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
