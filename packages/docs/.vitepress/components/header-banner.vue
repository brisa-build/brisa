//banner to apper on top of the page fixed informing that Brisa is experimental
<template>
  <div class="header-banner">
    <div class="header-banner-content">
      <p>
        <span>🚧</span>
        <span id="site">Brisa is <b>experimental</b>. Please report any issues on </span>
        <span id="mobile">Brisa is <b>experimental</b>. Issues on </span>
        <a href="https://github.com/brisa-build/brisa/issues" target="_blank">GitHub</a>
      </p>
    </div>
  </div>
</template>

<style>
.header-banner {
  text-align: center;
  height: 24px;
  font-size: 12px;
  top: 0;
  left: 0;
  width: 100vw;
  position: fixed;
  z-index: 99;
  background-color: var(--banner-bg);
}

.header-banner-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.header-banner-content a {
  color: #2b6cb0;
  text-decoration: underline;
}

.header-banner-content span {
  margin: 0 0.25rem;
}

#site {
  display: inline;
}

#mobile {
  display: none;
}

@media (max-width: 550px) {
  .header-banner {
    width: 100%;
  }

  #site {
    display: none;
  }

  #mobile {
    display: inline;
  }
}
</style>
